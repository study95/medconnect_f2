import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { useSearchParams } from 'react-router-dom'

import HospitalCard from '../components/common/HospitalCard'
import { HospitalGridSkeleton } from '../components/common/Skeletons'
import useLocations from '../hooks/useLocations'
import useSpecialties from '../hooks/useSpecialties'
import useInfiniteHospitals from '../hooks/useInfiniteHospitals'
import {
  IconBuildingHospital, IconShieldCheck, IconSearch,
  IconChevronRight, IconChevronLeft, IconClock, IconHeadset, IconLock,
  IconAdjustmentsHorizontal, IconX, IconCheck, IconTrash, IconMapPin,
  IconChevronUp, IconChevronDown, IconStethoscope, IconAlertTriangle,
  IconVideo, IconCalendarCheck, IconStar
} from '@tabler/icons-react'
import { useTypewriter } from '../hooks/useTypewriter'

const SEARCH_PHRASES = [
  'হাসপাতালের নাম লিখুন...',
  'যেমন: স্কয়ার হাসপাতাল',
  'যেমন: ল্যাবএইড ডায়াগনস্টিক',
  'যেমন: ইবনে সিনা ক্লিনিক',
  'যেমন: সরকারি মেডিকেল'
]

const HOSPITAL_TYPES = [
  { id: 'private',    label: 'প্রাইভেট হাসপাতাল',   icon: '🏥' },
  { id: 'government', label: 'সরকারি হাসপাতাল',      icon: '🏛️' },
  { id: 'diagnostic', label: 'ডায়াগনস্টিক সেন্টার', icon: '🔬' },
  { id: 'clinic',     label: 'ক্লিনিক',               icon: '💉' },
  { id: 'maternity',  label: 'মাতৃসদন / মাতৃস্বাস্থ্য', icon: '👶' },
]

const BED_RANGES = [
  { id: '1-50',    label: '১ - ৫০ শয্যা' },
  { id: '51-150',  label: '৫১ - ১৫০ শয্যা' },
  { id: '151-300', label: '১৫১ - ৩০০ শয্যা' },
  { id: '301-999', label: '৩০০+ শয্যা' },
]

/* ─── HOSPITAL HERO ───────────────────────── */
function HospitalHero({ onSearch, total, sortBy, setSortBy }) {
  const typingPlaceholder = useTypewriter(SEARCH_PHRASES)
  const {
    divisions, districts, upazilas, unions,
    selectedDivision, selectedDistrict, selectedUpazila, selectedUnion,
    setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion,
  } = useLocations()

  const [searchParams] = useSearchParams()
  const [hospitalType, setHospitalType]       = useState(searchParams.get('type') || '')
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty_id') || '')
  const [selectedBeds, setSelectedBeds]       = useState(searchParams.get('beds') || '')
  const [emergencyOnly, setEmergencyOnly]     = useState(false)
  const [openTodayOnly, setOpenTodayOnly]     = useState(false)
  const [searchText, setSearchText]           = useState(searchParams.get('search') || '')
  const [specialtySearch, setSpecialtySearch] = useState('')

  const { specialties } = useSpecialties()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Accordion open/close state
  const [openAccordions, setOpenAccordions] = useState({
    type: true,
    specialty: false,
    division: true,
    district: false,
    upazila: false,
    beds: false,
    extras: true,
  })

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    const divId = searchParams.get('division_id')
    const distId = searchParams.get('district_id')
    const upaId  = searchParams.get('upazila_id')
    const uniId  = searchParams.get('union_id')
    if (divId)  setSelectedDivision(divId)
    if (distId) setSelectedDistrict(distId)
    if (upaId)  setSelectedUpazila(upaId)
    if (uniId)  setSelectedUnion(uniId)
  }, [searchParams, setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion])

  const getParamObj = () => ({
    division_id:  selectedDivision,
    district_id:  selectedDistrict,
    upazila_id:   selectedUpazila,
    union_id:     selectedUnion,
    type:         hospitalType,
    specialty_id: selectedSpecialty,
    beds:         selectedBeds,
    emergency:    emergencyOnly,
    open_today:   openTodayOnly,
    search:       searchText.trim(),
  })

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    const params = {}
    if (selectedDivision)  params.division_id  = selectedDivision
    if (selectedDistrict)  params.district_id  = selectedDistrict
    if (selectedUpazila)   params.upazila_id   = selectedUpazila
    if (selectedUnion)     params.union_id      = selectedUnion
    if (hospitalType)      params.type          = hospitalType
    if (selectedSpecialty) params.specialty_id  = selectedSpecialty
    if (selectedBeds)      params.beds          = selectedBeds
    if (emergencyOnly)     params.emergency     = true
    if (openTodayOnly)     params.open_today    = true
    if (searchText.trim()) params.search        = searchText.trim()
    onSearch(params)
  }

  const handleApplyFilters = () => {
    handleSubmit()
    setIsDrawerOpen(false)
  }

  const handleClearAllFilters = () => {
    setSelectedDivision('')
    setSelectedDistrict('')
    setSelectedUpazila('')
    setSelectedUnion('')
    setHospitalType('')
    setSelectedSpecialty('')
    setSelectedBeds('')
    setEmergencyOnly(false)
    setOpenTodayOnly(false)
    onSearch({})
  }

  const getSelectedLabel = (type) => {
    if (type === 'division' && selectedDivision) {
      const item = divisions.find(d => String(d.id) === String(selectedDivision))
      return item ? item.name || item.bangla_name : ''
    }
    if (type === 'district' && selectedDistrict) {
      const item = districts.find(d => String(d.id) === String(selectedDistrict))
      return item ? item.name || item.bangla_name : ''
    }
    if (type === 'upazila' && selectedUpazila) {
      const item = upazilas.find(u => String(u.id) === String(selectedUpazila))
      return item ? item.name || item.bangla_name : ''
    }
    if (type === 'type' && hospitalType) {
      const item = HOSPITAL_TYPES.find(t => t.id === hospitalType)
      return item ? item.label : hospitalType
    }
    if (type === 'specialty' && selectedSpecialty) {
      const item = specialties.find(s => String(s.id) === String(selectedSpecialty))
      return item ? item.name || item.name_bn : ''
    }
    if (type === 'beds' && selectedBeds) {
      const item = BED_RANGES.find(b => b.id === selectedBeds)
      return item ? item.label : selectedBeds
    }
    return ''
  }

  // Active filters list
  const activeFilters = useMemo(() => {
    const list = []
    if (hospitalType) {
      const item = HOSPITAL_TYPES.find(t => t.id === hospitalType)
      list.push({ key: 'type', label: item ? item.label : hospitalType, clear: () => { setHospitalType(''); onSearch({ ...getParamObj(), type: '' }) } })
    }
    if (selectedSpecialty) {
      const item = specialties.find(s => String(s.id) === String(selectedSpecialty))
      list.push({ key: 'specialty', label: item ? item.name || item.name_bn : 'Specialty', clear: () => { setSelectedSpecialty(''); onSearch({ ...getParamObj(), specialty_id: '' }) } })
    }
    if (selectedDivision) {
      const item = divisions.find(d => String(d.id) === String(selectedDivision))
      list.push({ key: 'division', label: `${item ? item.name || item.bangla_name : 'বিভাগ'} Division`, clear: () => { setSelectedDivision(''); setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion(''); onSearch({ ...getParamObj(), division_id: '', district_id: '', upazila_id: '', union_id: '' }) } })
    }
    if (selectedDistrict) {
      const item = districts.find(d => String(d.id) === String(selectedDistrict))
      list.push({ key: 'district', label: item ? item.name || item.bangla_name : 'জেলা', clear: () => { setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion(''); onSearch({ ...getParamObj(), district_id: '', upazila_id: '', union_id: '' }) } })
    }
    if (selectedUpazila) {
      const item = upazilas.find(u => String(u.id) === String(selectedUpazila))
      list.push({ key: 'upazila', label: item ? item.name || item.bangla_name : 'উপজেলা', clear: () => { setSelectedUpazila(''); setSelectedUnion(''); onSearch({ ...getParamObj(), upazila_id: '', union_id: '' }) } })
    }
    if (selectedBeds) {
      const item = BED_RANGES.find(b => b.id === selectedBeds)
      list.push({ key: 'beds', label: item ? item.label : selectedBeds, clear: () => { setSelectedBeds(''); onSearch({ ...getParamObj(), beds: '' }) } })
    }
    if (emergencyOnly) {
      list.push({ key: 'emergency', label: '২৪/৭ জরুরি সেবা', clear: () => { setEmergencyOnly(false); onSearch({ ...getParamObj(), emergency: false }) } })
    }
    if (openTodayOnly) {
      list.push({ key: 'open_today', label: 'আজ খোলা আছে', clear: () => { setOpenTodayOnly(false); onSearch({ ...getParamObj(), open_today: false }) } })
    }
    if (searchText.trim()) {
      list.push({ key: 'search', label: `"${searchText.trim()}"`, clear: () => { setSearchText(''); onSearch({ ...getParamObj(), search: '' }) } })
    }
    return list
  }, [hospitalType, selectedSpecialty, selectedDivision, selectedDistrict, selectedUpazila, selectedBeds, emergencyOnly, openTodayOnly, searchText, specialties, divisions, districts, upazilas])

  const activeCount = activeFilters.length

  // Filtered specialties list
  const filteredSpecialties = useMemo(() => {
    if (!specialtySearch.trim()) return specialties
    const q = specialtySearch.toLowerCase()
    return specialties.filter(s => (s.name || '').toLowerCase().includes(q) || (s.name_bn || '').toLowerCase().includes(q))
  }, [specialties, specialtySearch])

  return (
    <>
      <style>{`
        .hospital-filter-hero {
          display: block;
          background: white;
          padding: 24px 0 16px;
        }
        .hospital-mobile-hero {
          display: none;
        }
        .filter-drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 29999;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        .filter-drawer-backdrop.open {
          opacity: 1;
          visibility: visible;
        }
        .filter-drawer {
          position: fixed;
          top: 0;
          bottom: 0;
          right: -100%;
          width: 100%;
          max-width: 390px;
          background: white;
          z-index: 30000;
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.15);
          transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }
        .filter-drawer.open {
          right: 0;
        }
        .drawer-scroll-body {
          flex: 1;
          overflow-y: auto;
          padding: 8px 24px 20px 24px;
        }
        .drawer-scroll-body::-webkit-scrollbar { width: 4px; }
        .drawer-scroll-body::-webkit-scrollbar-track { background: #F8FAFC; }
        .drawer-scroll-body::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        .hosp-toggle-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 20px;
          border: 1.5px solid #E2E8F0;
          background: white;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: 'Hind Siliguri', sans-serif;
          white-space: nowrap;
        }
        .hosp-toggle-pill.active {
          background: #E6F4EA;
          border-color: #008767;
          color: #008767;
        }
        .hosp-toggle-pill:hover {
          border-color: #008767;
          color: #008767;
        }
        .specialty-search-input {
          width: 100%;
          padding: 7px 12px;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          margin-bottom: 8px;
          font-family: 'Hind Siliguri', sans-serif;
          color: #1E293B;
        }
        .specialty-search-input:focus {
          border-color: #008767;
        }
        .accordion-item-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 4px;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.12s;
        }
        .accordion-item-row:hover {
          background: #F8FAFC;
        }
        @media (max-width: 767px) {
          .hospital-filter-hero {
            display: none !important;
          }
          .hospital-mobile-hero {
            display: block !important;
          }
          .results-header-row {
            display: none !important;
          }
        }
      `}</style>

      {/* ── MOBILE STICKY SEARCH BAR ── */}
      <div className="hospital-mobile-hero" style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '8px 16px', position: 'sticky', top: 66, zIndex: 1040 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder={typingPlaceholder || 'হাসপাতালের নাম...'}
              value={searchText}
              onChange={e => { setSearchText(e.target.value); onSearch({ ...getParamObj(), search: e.target.value.trim() }) }}
              style={{ width: '100%', height: 42, borderRadius: 10, border: '1.5px solid #CBD5E1', padding: '0 36px 0 14px', fontSize: 13.5, color: '#1E293B', fontWeight: 600, outline: 'none', fontFamily: "'Hind Siliguri', sans-serif" }}
            />
            {searchText ? (
              <button type="button" onClick={() => { setSearchText(''); onSearch({ ...getParamObj(), search: '' }) }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                <IconX size={18} />
              </button>
            ) : (
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>
                <IconSearch size={18} />
              </span>
            )}
          </div>
          <button type="button" onClick={() => setIsDrawerOpen(true)}
            style={{ height: 42, padding: '0 12px', borderRadius: 10, background: 'white', border: '1.5px solid #008767', color: '#008767', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Hind Siliguri', sans-serif" }}>
            <IconAdjustmentsHorizontal size={18} />
            <span>ফিল্টার</span>
            {activeCount > 0 && (
              <span style={{ background: '#EF4444', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeCount}
              </span>
            )}
          </button>
        </form>
      </div>

      {/* ── DESKTOP HERO BANNER ── */}
      <section className="hospital-filter-hero">
        <Container>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: '#64748B', fontSize: 15, fontWeight: 600, marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>আপনার স্বাস্থ্য, আমাদের অঙ্গীকার</p>
            <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 44px)', fontWeight: 900, color: '#1E293B', marginBottom: 16, fontFamily: "'Hind Siliguri', sans-serif" }}>
              বিশ্বস্ত <span style={{ color: '#008767' }}>হাসপাতাল</span> খুঁজুন
            </h1>
          </div>
        </Container>
      </section>

      {/* ── DESKTOP STICKY SEARCH FORM ── */}
      <section className="hospital-filter-hero" style={{ position: 'sticky', top: 'calc(var(--header-height) - 1px)', zIndex: 990, background: '#F8FAFC', padding: '10px 0' }}>
        <Container>
          <div style={{ background: 'white', borderRadius: 16, padding: '14px 18px', boxShadow: '0 6px 24px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, width: '100%', alignItems: 'center' }}>
              {/* Search input */}
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                  <IconSearch size={18} />
                </span>
                <input
                  type="text"
                  placeholder={typingPlaceholder || 'হাসপাতালের নাম দিয়ে খুঁজুন...'}
                  value={searchText}
                  onChange={e => { setSearchText(e.target.value); onSearch({ ...getParamObj(), search: e.target.value.trim() }) }}
                  style={{ width: '100%', height: 48, borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '0 40px 0 46px', fontSize: 14, color: '#1E293B', fontWeight: 500, outline: 'none', fontFamily: "'Hind Siliguri', sans-serif" }}
                />
                {searchText && (
                  <button type="button" onClick={() => { setSearchText(''); onSearch({ ...getParamObj(), search: '' }) }}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <IconX size={18} />
                  </button>
                )}
              </div>

              {/* Search button */}
              <button type="submit" style={{ height: 48, borderRadius: 10, background: '#008767', color: 'white', border: 'none', fontWeight: 700, fontSize: 15, padding: '0 28px', cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif", boxShadow: '0 4px 12px rgba(0,135,103,0.2)', whiteSpace: 'nowrap' }}>
                খুঁজুন
              </button>

              {/* Filter button */}
              <button type="button" onClick={() => setIsDrawerOpen(true)}
                style={{ height: 48, borderRadius: 10, background: 'white', color: '#008767', border: '1.5px solid #008767', fontWeight: 700, fontSize: 15, padding: '0 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Hind Siliguri', sans-serif", whiteSpace: 'nowrap' }}>
                <IconAdjustmentsHorizontal size={18} color="#008767" />
                <span>ফিল্টার</span>
                {activeCount > 0 && (
                  <span style={{ background: '#EF4444', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activeCount}
                  </span>
                )}
              </button>
            </form>
          </div>
        </Container>
      </section>

      {/* ── ACTIVE FILTERS CHIPS STRIP ── */}
      {activeCount > 0 && (
        <section style={{ paddingTop: 8, paddingBottom: 4 }}>
          <Container>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  আপনার নির্বাচিত ফিল্টার সমূহ:
                </span>
                {activeFilters.map(f => (
                  <span key={f.key} style={{ background: '#E6F4EA', color: '#008767', border: '1px solid #C6E7D2', borderRadius: 16, padding: '4px 12px', fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {f.label}
                    <button type="button" onClick={f.clear} style={{ background: 'none', border: 'none', padding: 0, color: '#008767', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <IconX size={13} />
                    </button>
                  </span>
                ))}
              </div>
              <button type="button" onClick={handleClearAllFilters} style={{ background: 'transparent', border: 'none', color: '#008767', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                সব ক্লিয়ার করুন <IconTrash size={15} />
              </button>
            </div>
          </Container>
        </section>
      )}

      {/* ── BACKDROP ── */}
      <div className={`filter-drawer-backdrop ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />

      {/* ── RIGHT-SIDE FILTER DRAWER ── */}
      <div className={`filter-drawer ${isDrawerOpen ? 'open' : ''}`}>

        {/* Drawer Header */}
        <div style={{ padding: '20px 24px 12px 24px', borderBottom: '1px solid #F1F5F9', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h5 style={{ fontWeight: 800, fontSize: 18, color: '#1E293B', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                ফিল্টার
              </h5>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', margin: '4px 0 0 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                নির্বাচিত ফিল্টার ({activeCount})
              </p>
            </div>
            <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}>
              <IconX size={22} />
            </button>
          </div>

          {/* Active chips inside drawer header */}
          {activeCount > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {activeFilters.map(f => (
                  <span key={f.key} style={{ background: '#E6F4EA', color: '#008767', borderRadius: 14, padding: '3px 10px', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {f.label}
                    <button type="button" onClick={f.clear} style={{ background: 'none', border: 'none', padding: 0, color: '#008767', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <IconX size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ textAlign: 'right' }}>
                <button type="button" onClick={handleClearAllFilters} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  সব ক্লিয়ার করুন <IconTrash size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Accordion Body */}
        <div className="drawer-scroll-body">

          {/* ── ACCORDION: Quick Toggles ── */}
          <div style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div onClick={() => toggleAccordion('extras')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconStar size={18} color="#475569" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>বিশেষ সুবিধা</span>
              </div>
              {openAccordions.extras ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>
            {openAccordions.extras && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => setEmergencyOnly(v => !v)}
                  className={`hosp-toggle-pill${emergencyOnly ? ' active' : ''}`}
                >
                  <IconAlertTriangle size={15} />
                  ২৪/৭ জরুরি সেবা
                </button>
                <button
                  type="button"
                  onClick={() => setOpenTodayOnly(v => !v)}
                  className={`hosp-toggle-pill${openTodayOnly ? ' active' : ''}`}
                >
                  <IconCalendarCheck size={15} />
                  আজ খোলা আছে
                </button>
              </div>
            )}
          </div>

          {/* ── ACCORDION: Hospital Type ── */}
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: openAccordions.type ? 14 : 0 }}>
            <div onClick={() => toggleAccordion('type')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconBuildingHospital size={18} color="#475569" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>হাসপাতাল ধরন</span>
              </div>
              {openAccordions.type ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>
            {openAccordions.type && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4 }}>
                {/* All types option */}
                <div className="accordion-item-row" onClick={() => setHospitalType('')}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: !hospitalType ? '2px solid #008767' : '1.5px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', flexShrink: 0 }}>
                    {!hospitalType && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#008767' }} />}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: !hospitalType ? 700 : 500, color: !hospitalType ? '#1E293B' : '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>সব ধরন</span>
                </div>
                {HOSPITAL_TYPES.map(t => {
                  const isSel = hospitalType === t.id
                  return (
                    <div key={t.id} className="accordion-item-row" onClick={() => setHospitalType(isSel ? '' : t.id)}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: isSel ? '2px solid #008767' : '1.5px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', flexShrink: 0 }}>
                        {isSel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#008767' }} />}
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: isSel ? 700 : 500, color: isSel ? '#1E293B' : '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>
                        {t.icon} {t.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── ACCORDION: Specialty ── */}
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: openAccordions.specialty ? 14 : 0 }}>
            <div onClick={() => toggleAccordion('specialty')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconStethoscope size={18} color="#475569" />
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>বিশেষজ্ঞ সেবা</span>
                  {!openAccordions.specialty && getSelectedLabel('specialty') && (
                    <div style={{ fontSize: 12, color: '#008767', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>{getSelectedLabel('specialty')}</div>
                  )}
                </div>
              </div>
              {openAccordions.specialty ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>
            {openAccordions.specialty && (
              <div style={{ paddingTop: 4 }}>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <IconSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="বিশেষজ্ঞ খুঁজুন..."
                    value={specialtySearch}
                    onChange={e => setSpecialtySearch(e.target.value)}
                    className="specialty-search-input"
                    style={{ paddingLeft: 30 }}
                  />
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div className="accordion-item-row" onClick={() => setSelectedSpecialty('')}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: !selectedSpecialty ? '2px solid #008767' : '1.5px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', flexShrink: 0 }}>
                      {!selectedSpecialty && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#008767' }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: !selectedSpecialty ? 700 : 500, color: !selectedSpecialty ? '#1E293B' : '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>সব বিশেষজ্ঞ</span>
                  </div>
                  {filteredSpecialties.map(s => {
                    const isSel = String(selectedSpecialty) === String(s.id)
                    return (
                      <div key={s.id} className="accordion-item-row" onClick={() => setSelectedSpecialty(isSel ? '' : s.id)}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, border: isSel ? 'none' : '1.5px solid #CBD5E1', background: isSel ? '#008767' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isSel && <IconCheck size={12} color="white" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: isSel ? 700 : 500, color: isSel ? '#008767' : '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {s.name || s.name_bn}
                        </span>
                      </div>
                    )
                  })}
                  {filteredSpecialties.length === 0 && (
                    <p style={{ color: '#94A3B8', fontSize: 12.5, textAlign: 'center', padding: '8px 0', fontFamily: "'Hind Siliguri', sans-serif" }}>কোনো ফলাফল নেই</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── ACCORDION: Division ── */}
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: openAccordions.division ? 14 : 0 }}>
            <div onClick={() => toggleAccordion('division')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconMapPin size={18} color="#475569" />
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>বিভাগ (Division)</span>
                  {!openAccordions.division && getSelectedLabel('division') && (
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>{getSelectedLabel('division')}</div>
                  )}
                </div>
              </div>
              {openAccordions.division ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>
            {openAccordions.division && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4 }}>
                {divisions.map(d => {
                  const isSel = String(selectedDivision) === String(d.id)
                  const divName = d.name || d.bangla_name
                  return (
                    <div key={d.id} className="accordion-item-row" onClick={() => { setSelectedDivision(isSel ? '' : d.id); setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('') }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: isSel ? 'none' : '1.5px solid #CBD5E1', background: isSel ? '#008767' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSel && <IconCheck size={12} color="white" strokeWidth={3} />}
                      </div>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: isSel ? 700 : 600, color: isSel ? '#008767' : '#1E293B', fontFamily: 'system-ui, sans-serif' }}>{divName}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── ACCORDION: District ── */}
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: openAccordions.district ? 14 : 0 }}>
            <div onClick={() => toggleAccordion('district')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconMapPin size={18} color="#475569" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>জেলা (District)</div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {getSelectedLabel('district') || 'সব জেলা'}
                  </div>
                </div>
              </div>
              {openAccordions.district ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>
            {openAccordions.district && (
              <div style={{ paddingBottom: 6 }}>
                {!selectedDivision ? (
                  <p style={{ color: '#94A3B8', fontSize: 12.5, fontFamily: "'Hind Siliguri', sans-serif", margin: 0 }}>
                    প্রথমে একটি বিভাগ নির্বাচন করুন।
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {districts.map(d => {
                      const isSel = String(selectedDistrict) === String(d.id)
                      return (
                        <div key={d.id} className="accordion-item-row" onClick={() => { setSelectedDistrict(isSel ? '' : d.id); setSelectedUpazila(''); setSelectedUnion('') }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: isSel ? 'none' : '1.5px solid #CBD5E1', background: isSel ? '#008767' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isSel && <IconCheck size={12} color="white" strokeWidth={3} />}
                          </div>
                          <span style={{ fontSize: 13.5, fontWeight: isSel ? 700 : 500, color: isSel ? '#008767' : '#1E293B', fontFamily: 'system-ui, sans-serif' }}>
                            {d.name || d.bangla_name}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── ACCORDION: Upazila ── */}
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: openAccordions.upazila ? 14 : 0 }}>
            <div onClick={() => toggleAccordion('upazila')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconMapPin size={18} color="#475569" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>উপজেলা (Upazila)</div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {getSelectedLabel('upazila') || 'সব উপজেলা'}
                  </div>
                </div>
              </div>
              {openAccordions.upazila ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>
            {openAccordions.upazila && (
              <div style={{ paddingBottom: 6 }}>
                {!selectedDistrict ? (
                  <p style={{ color: '#94A3B8', fontSize: 12.5, fontFamily: "'Hind Siliguri', sans-serif", margin: 0 }}>
                    প্রথমে একটি জেলা নির্বাচন করুন।
                  </p>
                ) : upazilas.length === 0 ? (
                  <p style={{ color: '#94A3B8', fontSize: 12.5, fontFamily: "'Hind Siliguri', sans-serif", margin: 0 }}>
                    কোনো উপজেলা পাওয়া যায়নি।
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {upazilas.map(u => {
                      const isSel = String(selectedUpazila) === String(u.id)
                      return (
                        <div key={u.id} className="accordion-item-row" onClick={() => { setSelectedUpazila(isSel ? '' : u.id); setSelectedUnion('') }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: isSel ? 'none' : '1.5px solid #CBD5E1', background: isSel ? '#008767' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isSel && <IconCheck size={12} color="white" strokeWidth={3} />}
                          </div>
                          <span style={{ fontSize: 13.5, fontWeight: isSel ? 700 : 500, color: isSel ? '#008767' : '#1E293B', fontFamily: 'system-ui, sans-serif' }}>
                            {u.name || u.bangla_name}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── ACCORDION: Bed Range ── */}
          <div style={{ paddingBottom: openAccordions.beds ? 14 : 0 }}>
            <div onClick={() => toggleAccordion('beds')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconHeadset size={18} color="#475569" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>শয্যা সংখ্যা (Beds)</span>
              </div>
              {openAccordions.beds ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>
            {openAccordions.beds && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4 }}>
                <div className="accordion-item-row" onClick={() => setSelectedBeds('')}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: !selectedBeds ? '2px solid #008767' : '1.5px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', flexShrink: 0 }}>
                    {!selectedBeds && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#008767' }} />}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: !selectedBeds ? 700 : 500, color: !selectedBeds ? '#1E293B' : '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>যেকোনো সংখ্যা</span>
                </div>
                {BED_RANGES.map(b => {
                  const isSel = selectedBeds === b.id
                  return (
                    <div key={b.id} className="accordion-item-row" onClick={() => setSelectedBeds(isSel ? '' : b.id)}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: isSel ? '2px solid #008767' : '1.5px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', flexShrink: 0 }}>
                        {isSel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#008767' }} />}
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: isSel ? 700 : 500, color: isSel ? '#1E293B' : '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>{b.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>{/* end drawer-scroll-body */}

        {/* ── Drawer Footer Buttons ── */}
        <div style={{ display: 'flex', gap: 12, padding: '16px 24px calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid #F1F5F9', background: 'white' }}>
          <button type="button" onClick={handleClearAllFilters}
            style={{ flex: 1, height: 46, borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif" }}>
            রিসেট
          </button>
          <button type="button" onClick={handleApplyFilters}
            style={{ flex: 2, height: 46, borderRadius: 10, background: '#008767', border: 'none', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif", boxShadow: '0 4px 12px rgba(0,135,103,0.25)' }}>
            প্রয়োগ করুন {total ? `(${total})` : ''}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── MAIN PAGE ───────────────────────── */
function HospitalsPage() {
  const [searchParams] = useSearchParams()
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const p = {}
    if (searchParams.get('division_id'))  p.division_id  = searchParams.get('division_id')
    if (searchParams.get('district_id'))  p.district_id  = searchParams.get('district_id')
    if (searchParams.get('upazila_id'))   p.upazila_id   = searchParams.get('upazila_id')
    if (searchParams.get('union_id'))     p.union_id     = searchParams.get('union_id')
    if (searchParams.get('type'))         p.type         = searchParams.get('type')
    if (searchParams.get('specialty_id')) p.specialty_id = searchParams.get('specialty_id')
    if (searchParams.get('search'))       p.search       = searchParams.get('search')
    return p
  })

  const [sortBy, setSortBy] = useState('relevance')

  const activeCount = Object.keys(appliedFilters).filter(k => appliedFilters[k]).length

  const { hospitals, total, loading, fetchingNext, hasMore, fetchMore, error, refresh } = useInfiniteHospitals(appliedFilters)

  const sortedHospitals = useMemo(() => {
    const list = [...hospitals]
    if (sortBy === 'name_asc') return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    if (sortBy === 'name_desc') return list.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    return list
  }, [hospitals, sortBy])

  // Infinite scroll sentinel
  const sentinelRef = useRef(null)
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !fetchingNext) fetchMore() },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, fetchingNext, fetchMore])

  const handleSearch = useCallback((params) => {
    setAppliedFilters(params)
  }, [])

  const handleClearFilters = () => setAppliedFilters({})

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <HospitalHero
        onSearch={handleSearch}
        total={total}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* RESULTS */}
      <Container style={{ paddingBottom: 80 }}>
        <div style={{ marginTop: 20 }}>
          {/* Results header (desktop) */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 results-header-row">
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>সকল হাসপাতাল</h2>
            <div className="d-flex align-items-center gap-3">
              <p style={{ color: '#64748B', fontSize: 14, marginBottom: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                {loading ? 'লোড হচ্ছে...' : <><strong>{hospitals.length}</strong> হাসপাতাল দেখানো হচ্ছে {total ? `মোট ${total} এর মধ্যে` : ''}</>}
              </p>
              {activeCount > 0 && (
                <button onClick={handleClearFilters} style={{ background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 8, padding: '5px 14px', color: '#64748B', fontSize: 13, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  ✕ ফিল্টার মুছুন
                </button>
              )}
            </div>
          </div>

          {loading && <HospitalGridSkeleton count={6} />}
          {error && !loading && (
            <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <p style={{ color: '#c53030', marginBottom: 12 }}>⚠️ {error}</p>
              <button onClick={refresh} style={{ background: '#00A88C', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>আবার চেষ্টা করুন</button>
            </div>
          )}
          {!loading && sortedHospitals.length > 0 && (
            <Row className="g-4">
              {sortedHospitals.map((h, i) => (
                <Col key={h.id} xs={12} md={6} xl={4}>
                  <HospitalCard hospital={h} index={i} />
                </Col>
              ))}
            </Row>
          )}
          {!loading && !error && sortedHospitals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', marginTop: 20 }}>
              <div style={{ width: 80, height: 80, background: '#FDF4FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <IconBuildingHospital size={40} color="#D946EF" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', marginBottom: 10, fontFamily: "'Hind Siliguri', sans-serif" }}>কোনো হাসপাতাল পাওয়া যায়নি</h3>
              <p style={{ color: '#64748B', fontSize: 15, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5, fontFamily: "'Hind Siliguri', sans-serif" }}>আপনার নির্বাচিত ফিল্টার অনুযায়ী কোনো হাসপাতাল খুঁজে পাওয়া যায়নি।</p>
              <button onClick={handleClearFilters} style={{ background: '#FDF4FF', color: '#A21CAF', border: '1px solid #F5D0FE', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif" }}>ফিল্টার মুছুন</button>
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} style={{ height: 40, marginTop: 20 }} />
          {fetchingNext && <div style={{ paddingTop: 10 }}><HospitalGridSkeleton count={3} /></div>}
          {!hasMore && !loading && sortedHospitals.length > 0 && (
            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 14, marginTop: 24, fontFamily: "'Hind Siliguri', sans-serif" }}>
              সকল হাসপাতাল দেখানো হয়েছে ✓
            </p>
          )}
        </div>

        {/* FEATURES BANNER */}
        <div style={{ background: '#F0FDF4', borderRadius: 24, padding: '40px', marginTop: 60, border: '1px solid #DCFCE7' }}>
          <Row className="g-4">
            {[
              { icon: <IconShieldCheck size={30} color="#00A88C" />, title: 'যাচাইকৃত হাসপাতাল', desc: 'আমাদের সকল হাসপাতাল যাচাইকৃত' },
              { icon: <IconLock size={30} color="#00A88C" />,        title: 'নিরাপদ সেবা',       desc: 'রোগীর তথ্যের সর্বোচ্চ নিরাপত্তা' },
              { icon: <IconClock size={30} color="#00A88C" />,       title: '২৪/৭ জরুরি সেবা',  desc: 'জরুরি প্রয়োজনে আমরা আপনার পাশে' },
              { icon: <IconHeadset size={30} color="#00A88C" />,     title: 'সাপোর্ট সেবা',     desc: 'যেকোনো প্রয়োজনে সাপোর্ট টিম আছে' },
            ].map((f, i) => (
              <Col key={i} xs={12} md={6} lg={3}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #00A88C' }}>{f.icon}</div>
                  <div>
                    <h6 style={{ fontWeight: 800, color: '#065F46', marginBottom: 4, fontSize: 16, fontFamily: "'Hind Siliguri', sans-serif" }}>{f.title}</h6>
                    <p style={{ color: '#64748B', fontSize: 13, margin: 0, lineHeight: 1.4, fontFamily: "'Hind Siliguri', sans-serif" }}>{f.desc}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </div>
  )
}

export default HospitalsPage

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { useSearchParams, Link } from 'react-router-dom'

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
  IconCalendarCheck, IconStar, IconListDetails, IconGridDots, IconMap
} from '@tabler/icons-react'

const HOSPITAL_TYPES = [
  { id: 'Private Hospital', label: 'বেসরকারি হাসপাতাল (Private)', icon: '🏥' },
  { id: 'Govt Hospital', label: 'সরকারি হাসপাতাল (Govt)', icon: '🏛️' },
  { id: 'Clinic', label: 'ক্লিনিক (Clinic)', icon: '💉' },
  { id: 'Diagnostic Center', label: 'ডায়াগনস্টিক সেন্টার (Diagnostic)', icon: '🔬' },
  { id: 'Specialized Hospital (Maa-O-Shishu)', label: 'মা ও শিশু হাসপাতাল (Maa-O-Shishu)', icon: '👶' },
  { id: 'Specialized Hospital (Eye)', label: 'চক্ষু হাসপাতাল (Eye Hospital)', icon: '👁️' },
  { id: 'Specialized Hospital (Cancer)', label: 'ক্যান্সার হাসপাতাল (Cancer Hospital)', icon: '🎗️' },
  { id: 'Specialized Hospital (Dental)', label: 'ডেন্টাল হাসপাতাল (Dental Hospital)', icon: '🦷' },
  { id: 'Specialized Hospital (Other)', label: 'অন্যান্য বিশেষায়িত হাসপাতাল', icon: '🏥' }
]

const BED_RANGES = [
  { id: '1-50',    label: '১ - ৫০ শয্যা' },
  { id: '51-150',  label: '৫১ - ১৫০ শয্যা' },
  { id: '151-300', label: '১৫১ - ৩০০ শয্যা' },
  { id: '301-999', label: '৩০০+ শয্যা' },
]

function HospitalsPage() {
  const [searchParams] = useSearchParams()
  const {
    divisions, districts, upazilas, unions,
    selectedDivision, selectedDistrict, selectedUpazila, selectedUnion,
    setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion,
  } = useLocations()

  const { specialties } = useSpecialties()

  const [hospitalType, setHospitalType]       = useState(searchParams.get('type') || '')
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty_id') || '')
  const [selectedBeds, setSelectedBeds]       = useState(searchParams.get('beds') || '')
  const [emergencyOnly, setEmergencyOnly]     = useState(false)
  const [openTodayOnly, setOpenTodayOnly]     = useState(false)
  const [searchText, setSearchText]           = useState(searchParams.get('search') || '')
  const [specialtySearch, setSpecialtySearch] = useState('')

  const [sortBy, setSortBy]   = useState('newest')
  const [viewMode, setViewMode] = useState('list') // 'list' | 'grid' | 'map'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Accordion open/close state inside left filter panel & mobile drawer
  const [openAccordions, setOpenAccordions] = useState({
    type: true,
    location: true,
    beds: true,
    specialty: false,
    extras: true,
  })

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    const divId  = searchParams.get('division_id')
    const distId = searchParams.get('district_id')
    const upaId  = searchParams.get('upazila_id')
    const uniId  = searchParams.get('union_id')
    if (divId)  setSelectedDivision(divId)
    if (distId) setSelectedDistrict(distId)
    if (upaId)  setSelectedUpazila(upaId)
    if (uniId)  setSelectedUnion(uniId)
  }, [searchParams, setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion])

  const appliedFilters = useMemo(() => {
    const p = {}
    if (selectedDivision)  p.division_id  = selectedDivision
    if (selectedDistrict)  p.district_id  = selectedDistrict
    if (selectedUpazila)   p.upazila_id   = selectedUpazila
    if (selectedUnion)     p.union_id     = selectedUnion
    if (hospitalType)      p.type         = hospitalType
    if (selectedSpecialty) p.specialty_id = selectedSpecialty
    if (selectedBeds)      p.beds         = selectedBeds
    if (emergencyOnly)     p.emergency    = true
    if (openTodayOnly)     p.open_today   = true
    if (searchText.trim()) p.search       = searchText.trim()
    return p
  }, [selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, hospitalType, selectedSpecialty, selectedBeds, emergencyOnly, openTodayOnly, searchText])

  const { hospitals, total, loading, fetchingNext, hasMore, fetchMore, error, refresh } = useInfiniteHospitals(appliedFilters)

  const sortedHospitals = useMemo(() => {
    const list = [...hospitals]
    if (sortBy === 'name_asc')  return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    if (sortBy === 'name_desc') return list.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    return list
  }, [hospitals, sortBy])

  // Helper for location display name
  const getLocName = (item, fallback) => {
    if (!item) return fallback
    if (typeof item.name === 'object' && item.name !== null) {
      return item.name.bn || item.name.en || fallback
    }
    return item.name || item.name_bn || item.bangla_name || fallback
  }

  // Active filters list
  const activeFilters = useMemo(() => {
    const list = []
    if (selectedDivision) {
      const item = divisions.find(d => String(d.id) === String(selectedDivision))
      list.push({ key: 'division', label: getLocName(item, 'Division'), clear: () => { setSelectedDivision(''); setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('') } })
    }
    if (selectedDistrict) {
      const item = districts.find(d => String(d.id) === String(selectedDistrict))
      list.push({ key: 'district', label: getLocName(item, 'District'), clear: () => { setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('') } })
    }
    if (selectedUpazila) {
      const item = upazilas.find(u => String(u.id) === String(selectedUpazila))
      list.push({ key: 'upazila', label: getLocName(item, 'Upazila'), clear: () => { setSelectedUpazila(''); setSelectedUnion('') } })
    }
    if (selectedUnion) {
      const item = unions.find(u => String(u.id) === String(selectedUnion))
      list.push({ key: 'union', label: getLocName(item, 'Union'), clear: () => setSelectedUnion('') })
    }
    if (hospitalType) {
      const item = HOSPITAL_TYPES.find(t => t.id === hospitalType)
      list.push({ key: 'type', label: item ? item.label : hospitalType, clear: () => setHospitalType('') })
    }
    if (selectedSpecialty) {
      const item = specialties.find(s => String(s.id) === String(selectedSpecialty))
      list.push({ key: 'specialty', label: item ? item.name || item.name_bn : 'Specialty', clear: () => setSelectedSpecialty('') })
    }
    if (selectedBeds) {
      const item = BED_RANGES.find(b => b.id === selectedBeds)
      list.push({ key: 'beds', label: item ? item.label : selectedBeds, clear: () => setSelectedBeds('') })
    }
    if (emergencyOnly) {
      list.push({ key: 'emergency', label: '24/7 Emergency', clear: () => setEmergencyOnly(false) })
    }
    if (openTodayOnly) {
      list.push({ key: 'open_today', label: 'Open Today', clear: () => setOpenTodayOnly(false) })
    }
    if (searchText.trim()) {
      list.push({ key: 'search', label: `"${searchText.trim()}"`, clear: () => setSearchText('') })
    }
    return list
  }, [
    selectedDivision, selectedDistrict, selectedUpazila, selectedUnion,
    hospitalType, selectedSpecialty, selectedBeds, emergencyOnly, openTodayOnly, searchText,
    divisions, districts, upazilas, unions, specialties
  ])

  const activeCount = activeFilters.length

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
    setSearchText('')
  }

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

  // Dynamic location title for heading
  const locationHeadingText = useMemo(() => {
    const parts = []
    if (selectedUnion) {
      const uniObj = unions.find(u => String(u.id) === String(selectedUnion))
      if (uniObj) parts.push(getLocName(uniObj, ''))
    }
    if (selectedUpazila) {
      const upaObj = upazilas.find(u => String(u.id) === String(selectedUpazila))
      if (upaObj) parts.push(getLocName(upaObj, ''))
    }
    if (selectedDistrict) {
      const distObj = districts.find(d => String(d.id) === String(selectedDistrict))
      if (distObj) parts.push(getLocName(distObj, ''))
    }
    if (selectedDivision) {
      const divObj = divisions.find(d => String(d.id) === String(selectedDivision))
      if (divObj) parts.push(getLocName(divObj, ''))
    }
    return parts.filter(Boolean).join(', ')
  }, [selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, divisions, districts, upazilas, unions])

  // Filtered specialties list for search inside drawer
  const filteredSpecialties = useMemo(() => {
    if (!specialtySearch.trim()) return specialties
    const q = specialtySearch.toLowerCase()
    return specialties.filter(s => (s.name || '').toLowerCase().includes(q) || (s.name_bn || '').toLowerCase().includes(q))
  }, [specialties, specialtySearch])

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingTop: 'var(--header-height, 110px)', paddingBottom: 60, fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── RESPONSIVE FILTER DRAWER CSS ── */}
      <style>{`
        .filter-drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 29999;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          display: none;
          transition: all 0.3s ease;
        }
        .filter-drawer-backdrop.open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          display: block;
        }
        .filter-drawer {
          position: fixed;
          top: 0;
          bottom: 0;
          right: -100%;
          width: 100%;
          max-width: 380px;
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
          padding: 12px 20px 20px 20px;
        }
        @media (max-width: 991px) {
          .hosp-desktop-search {
            display: none !important;
          }
          .hosp-mobile-search-bar {
            display: block !important;
          }
        }
        @media (min-width: 992px) {
          .hosp-mobile-search-bar {
            display: none !important;
          }
        }
      `}</style>

      {/* ── MOBILE STICKY SEARCH & FILTER BAR (<992px) ── */}
      <div className="hosp-mobile-search-bar" style={{
        position: 'sticky',
        top: 'calc(var(--header-height, 68px) - 1px)',
        zIndex: 1040,
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        padding: '8px 16px'
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="হাসপাতালের নাম লিখুন..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 8,
                border: '1.5px solid #CBD5E1',
                padding: '0 36px 0 14px',
                fontSize: 13.5,
                color: '#0F172A',
                fontWeight: 600,
                outline: 'none',
                fontFamily: "'Hind Siliguri', sans-serif"
              }}
            />
            {searchText ? (
              <button type="button" onClick={() => setSearchText('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <IconX size={18} />
              </button>
            ) : (
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>
                <IconSearch size={18} />
              </span>
            )}
          </div>

          {/* Filter Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            style={{
              height: 42,
              padding: '0 14px',
              borderRadius: 8,
              background: '#00B875',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Hind Siliguri', sans-serif"
            }}
          >
            <IconAdjustmentsHorizontal size={18} />
            <span>ফিল্টার</span>
            {activeCount > 0 && (
              <span style={{
                background: '#EF4444',
                color: 'white',
                borderRadius: '50%',
                width: 18,
                height: 18,
                fontSize: 10,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── TOP NAV BAR WITH ACTIVE FILTER PILLS (White Background) ── */}
      {activeCount > 0 && (
        <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {activeFilters.map(f => (
              <span key={f.key} style={{
                background: '#00B875',
                color: 'white',
                border: '1px solid #00B875',
                borderRadius: 4,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                {f.label}
                <button type="button" onClick={f.clear} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex' }}>
                  <IconX size={12} />
                </button>
              </span>
            ))}
          </div>
          <button type="button" onClick={handleClearAllFilters} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Clear All ✕
          </button>
        </div>
      )}

      <Container fluid style={{ maxWidth: 1380, padding: '20px 24px' }}>
        
        {/* ── BREADCRUMB ── */}
        <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link to="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: '#0F172A', fontWeight: 600 }}>Hospital Listings</span>
        </div>

        {/* ── HEADING TITLE ── */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#0F172A',
          marginBottom: 16,
          letterSpacing: '-0.5px'
        }}>
          {locationHeadingText ? (
            <>
              <span style={{ textTransform: 'capitalize' }}>{locationHeadingText}</span> — <span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>হাসপাতাল তালিকা</span>
            </>
          ) : (
            <span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>সকল হাসপাতাল তালিকা</span>
          )}
        </h1>

        {/* ── DESKTOP FULL WIDTH SEARCH BAR (≥992px) ── */}
        <div className="hosp-desktop-search" style={{
          background: 'white',
          borderRadius: 8,
          border: '1px solid #CBD5E1',
          padding: '4px 6px 4px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          marginBottom: 20
        }}>
          <IconSearch size={18} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search by area, hospital type, keyword..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: '#0F172A',
              fontWeight: 500,
              background: 'transparent',
              padding: '10px 0'
            }}
          />
          {searchText && (
            <button onClick={() => setSearchText('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}>
              <IconX size={16} />
            </button>
          )}
          <button style={{
            background: '#00B875',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '10px 24px',
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif"
          }}>
            Search
          </button>
        </div>

        {/* ── RESULTS SUMMARY BAR & VIEW MODE SWITCHER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: '#64748B', fontSize: 13, fontWeight: 500 }}>
            Showing <strong style={{ color: '#0F172A' }}>{sortedHospitals.length}</strong> out of <strong style={{ color: '#0F172A' }}>{total || sortedHospitals.length}</strong> properties
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: 'white',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Newest First</option>
                <option value="name_asc">Name (A - Z)</option>
                <option value="name_desc">Name (Z - A)</option>
              </select>
            </div>

            {/* View Mode Toggle Buttons (List :== , Grid ::: , Map [ ]) */}
            <div style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden', background: 'white' }}>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List View"
                style={{
                  padding: '6px 10px',
                  background: viewMode === 'list' ? '#00B875' : 'white',
                  color: viewMode === 'list' ? 'white' : '#64748B',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <IconListDetails size={18} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                style={{
                  padding: '6px 10px',
                  background: viewMode === 'grid' ? '#00B875' : 'white',
                  color: viewMode === 'grid' ? 'white' : '#64748B',
                  border: 'none',
                  borderLeft: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <IconGridDots size={18} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                title="Map View"
                style={{
                  padding: '6px 10px',
                  background: viewMode === 'map' ? '#00B875' : 'white',
                  color: viewMode === 'map' ? 'white' : '#64748B',
                  border: 'none',
                  borderLeft: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <IconMap size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        {viewMode === 'map' ? (
          /* ── MAP VIEW: NO LEFT FILTER SIDEBAR, FULL-WIDTH 2-COLUMN SPLIT MAP ── */
          <Row className="g-3">
            {/* Left ~65% Live Hospital Map Area */}
            <Col xs={12} lg={7} xl={8}>
              <div style={{
                position: 'relative',
                height: 580,
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                overflow: 'hidden',
                background: '#E5E7EB',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>
                {/* Live OpenStreetMap Embed */}
                <iframe
                  title="Hospital Live Map View"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=90.350%2C23.830%2C90.430%2C23.900&amp;layer=mapnik"
                  style={{ border: 0, filter: 'contrast(1.02) saturate(1.05)' }}
                />

                {/* Live Hospital Pin Markers (NO TAKA / MONEY, ONLY HOSPITAL NAMES) */}
                {sortedHospitals.slice(0, 6).map((h, idx) => {
                  const positions = [
                    { top: '32%', left: '36%' },
                    { top: '48%', left: '55%' },
                    { top: '62%', left: '26%' },
                    { top: '25%', left: '58%' },
                    { top: '72%', left: '46%' },
                    { top: '50%', left: '72%' }
                  ]
                  const pos = positions[idx % positions.length]
                  return (
                    <div
                      key={h.id}
                      onClick={() => navigate(`/hospitals/${h.id}`)}
                      style={{
                        position: 'absolute',
                        top: pos.top,
                        left: pos.left,
                        background: '#00B875',
                        color: 'white',
                        padding: '5px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: '0 4px 14px rgba(0, 184, 117, 0.35)',
                        border: '2px solid white',
                        cursor: 'pointer',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontFamily: "'Hind Siliguri', sans-serif",
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.08)'
                        e.currentTarget.style.background = '#008767'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.background = '#00B875'
                      }}
                    >
                      <span>🏥</span>
                      <span>{h.name}</span>
                    </div>
                  )
                })}

                {/* Map Controls (Top Right) */}
                <div style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  background: 'white',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                  zIndex: 20
                }}>
                  <button type="button" style={{ width: 34, height: 34, background: 'none', border: 'none', borderBottom: '1px solid #E2E8F0', cursor: 'pointer', fontWeight: 800, fontSize: 16, color: '#0F172A' }}>+</button>
                  <button type="button" style={{ width: 34, height: 34, background: 'none', border: 'none', borderBottom: '1px solid #E2E8F0', cursor: 'pointer', fontWeight: 800, fontSize: 16, color: '#0F172A' }}>-</button>
                  <button type="button" style={{ width: 34, height: 34, background: 'none', border: 'none', borderBottom: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎯</button>
                  <button type="button" style={{ width: 34, height: 34, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⤢</button>
                </div>
              </div>
            </Col>

            {/* Right ~35% Scrollable Hospital List */}
            <Col xs={12} lg={5} xl={4}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 12, fontFamily: "'Hind Siliguri', sans-serif" }}>
                ম্যাপে <strong style={{ color: '#0F172A' }}>{sortedHospitals.length}টি</strong> হাসপাতাল দেখানো হচ্ছে
              </div>
              <div style={{ maxHeight: 585, overflowY: 'auto', paddingRight: 4 }}>
                {sortedHospitals.map((h, i) => (
                  <HospitalCard key={h.id} hospital={h} index={i} viewMode="map-compact" />
                ))}
              </div>
            </Col>
          </Row>
        ) : (
          /* ── LIST & GRID VIEW (WITH LEFT FILTER SIDEBAR) ── */
          <Row className="g-4">

            {/* ── LEFT COLUMN: FILTERS PANEL (Desktop Only ≥992px) ── */}
            <Col xs={12} lg={3} className="d-none d-lg-block">
              <div style={{
                background: 'white',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                padding: '16px',
                position: 'sticky',
                top: 'calc(var(--header-height, 110px) + 16px)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                {/* Filter Sidebar Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconAdjustmentsHorizontal size={18} color="#0F172A" />
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Filters</h3>
                      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                        Showing <strong style={{ color: '#0F172A' }}>{sortedHospitals.length}</strong> properties
                      </div>
                    </div>
                  </div>
                </div>

                {/* Applied Filters Block inside Sidebar */}
                {activeCount > 0 && (
                  <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Applied filters</span>
                      <button type="button" onClick={handleClearAllFilters} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        Clear All ✕
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {activeFilters.map(f => (
                        <span key={f.key} style={{
                          background: '#00B875',
                          color: 'white',
                          borderRadius: 4,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          {f.label}
                          <button type="button" onClick={f.clear} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex' }}>
                            <IconX size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accordion 1: Make / Hospital Type */}
                <div style={{ marginBottom: 14, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                  <div onClick={() => toggleAccordion('type')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Make / Hospital Type</span>
                    {openAccordions.type ? <IconChevronUp size={16} color="#64748B" /> : <IconChevronDown size={16} color="#64748B" />}
                  </div>
                  {openAccordions.type && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                      {HOSPITAL_TYPES.map(t => {
                        const isChecked = hospitalType === t.id
                        return (
                          <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: isChecked ? 700 : 500 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => setHospitalType(isChecked ? '' : t.id)}
                              style={{ width: 16, height: 16, accentColor: '#00B875', borderRadius: 4, cursor: 'pointer' }}
                            />
                            <span>{t.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Accordion 2: Location */}
                <div style={{ marginBottom: 14, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                  <div onClick={() => toggleAccordion('location')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Location</span>
                    {openAccordions.location ? <IconChevronUp size={16} color="#64748B" /> : <IconChevronDown size={16} color="#64748B" />}
                  </div>
                  {openAccordions.location && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                      {/* Division selector */}
                      <div>
                        <label style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4, display: 'block' }}>বিভাগ (Division)</label>
                        <select
                          value={selectedDivision}
                          onChange={e => { setSelectedDivision(e.target.value); setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('') }}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A', outline: 'none' }}
                        >
                          <option value="">সকল বিভাগ</option>
                          {divisions.map(d => (
                            <option key={d.id} value={d.id}>{getLocName(d, d.id)}</option>
                          ))}
                        </select>
                      </div>

                      {/* District selector */}
                      <div>
                        <label style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4, display: 'block' }}>জেলা (District)</label>
                        <select
                          value={selectedDistrict}
                          onChange={e => { setSelectedDistrict(e.target.value); setSelectedUpazila(''); setSelectedUnion('') }}
                          disabled={!selectedDivision}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A', outline: 'none', background: !selectedDivision ? '#F1F5F9' : 'white' }}
                        >
                          <option value="">সকল জেলা</option>
                          {districts.map(d => (
                            <option key={d.id} value={d.id}>{getLocName(d, d.id)}</option>
                          ))}
                        </select>
                      </div>

                      {/* Upazila selector */}
                      <div>
                        <label style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4, display: 'block' }}>উপজেলা (Upazila)</label>
                        <select
                          value={selectedUpazila}
                          onChange={e => { setSelectedUpazila(e.target.value); setSelectedUnion('') }}
                          disabled={!selectedDistrict}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A', outline: 'none', background: !selectedDistrict ? '#F1F5F9' : 'white' }}
                        >
                          <option value="">সকল উপজেলা</option>
                          {upazilas.map(u => (
                            <option key={u.id} value={u.id}>{getLocName(u, u.id)}</option>
                          ))}
                        </select>
                      </div>

                      {/* Union selector */}
                      <div>
                        <label style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4, display: 'block' }}>ইউনিয়ন (Union)</label>
                        <select
                          value={selectedUnion}
                          onChange={e => setSelectedUnion(e.target.value)}
                          disabled={!selectedUpazila}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A', outline: 'none', background: !selectedUpazila ? '#F1F5F9' : 'white' }}
                        >
                          <option value="">সকল ইউনিয়ন</option>
                          {unions.map(u => (
                            <option key={u.id} value={u.id}>{getLocName(u, u.id)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 3: Bed Ranges */}
                <div style={{ marginBottom: 14, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                  <div onClick={() => toggleAccordion('beds')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Beds Range</span>
                    {openAccordions.beds ? <IconChevronUp size={16} color="#64748B" /> : <IconChevronDown size={16} color="#64748B" />}
                  </div>
                  {openAccordions.beds && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                      {BED_RANGES.map(b => {
                        const isChecked = selectedBeds === b.id
                        return (
                          <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: isChecked ? 700 : 500 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => setSelectedBeds(isChecked ? '' : b.id)}
                              style={{ width: 16, height: 16, accentColor: '#00B875', borderRadius: 4, cursor: 'pointer' }}
                            />
                            <span>{b.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Accordion 4: Special Facilities */}
                <div style={{ marginBottom: 4 }}>
                  <div onClick={() => toggleAccordion('extras')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Facilities</span>
                    {openAccordions.extras ? <IconChevronUp size={16} color="#64748B" /> : <IconChevronDown size={16} color="#64748B" />}
                  </div>
                  {openAccordions.extras && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: emergencyOnly ? 700 : 500 }}>
                        <input
                          type="checkbox"
                          checked={emergencyOnly}
                          onChange={() => setEmergencyOnly(v => !v)}
                          style={{ width: 16, height: 16, accentColor: '#00B875', borderRadius: 4, cursor: 'pointer' }}
                        />
                        <span>২৪/৭ জরুরি সেবা</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: openTodayOnly ? 700 : 500 }}>
                        <input
                          type="checkbox"
                          checked={openTodayOnly}
                          onChange={() => setOpenTodayOnly(v => !v)}
                          style={{ width: 16, height: 16, accentColor: '#00B875', borderRadius: 4, cursor: 'pointer' }}
                        />
                        <span>আজ খোলা আছে</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </Col>

            {/* ── RIGHT COLUMN: LIST / GRID HOSPITAL LISTINGS AREA ── */}
            <Col xs={12} lg={9}>
              {loading && <HospitalGridSkeleton count={4} />}

              {error && !loading && (
                <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                  <p style={{ color: '#c53030', marginBottom: 12 }}>⚠️ {error}</p>
                  <button onClick={refresh} style={{ background: '#0B192C', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>
                    Try Again
                  </button>
                </div>
              )}

              {!loading && sortedHospitals.length > 0 && (
                <>
                  {viewMode === 'grid' ? (
                    <Row className="g-3">
                      {sortedHospitals.map((h, i) => (
                        <Col key={h.id} xs={12} md={6} xl={4}>
                          <HospitalCard hospital={h} index={i} viewMode="grid" />
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    /* DEFAULT LIST VIEW (Matching screenshot) */
                    <div>
                      {sortedHospitals.map((h, i) => (
                        <HospitalCard key={h.id} hospital={h} index={i} viewMode="list" />
                      ))}
                    </div>
                  )}
                </>
              )}

              {!loading && !error && sortedHospitals.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ width: 70, height: 70, background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <IconBuildingHospital size={36} color="#64748B" />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>No hospitals found</h3>
                  <p style={{ color: '#64748B', fontSize: 14, maxWidth: 360, margin: '0 auto 20px' }}>No hospital listings matched your selected filters.</p>
                  <button onClick={handleClearAllFilters} style={{ background: '#0B192C', color: 'white', border: 'none', borderRadius: 6, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} style={{ height: 30, marginTop: 20 }} />
              {fetchingNext && <div style={{ paddingTop: 10 }}><HospitalGridSkeleton count={2} /></div>}
            </Col>
          </Row>
        )}
      </Container>

      {/* ── MOBILE FILTER DRAWER BACKDROP ── */}
      <div className={`filter-drawer-backdrop ${isMobileFilterOpen ? 'open' : ''}`} onClick={() => setIsMobileFilterOpen(false)} />

      {/* ── MOBILE SLIDING FILTER DRAWER ── */}
      <div className={`filter-drawer ${isMobileFilterOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #F1F5F9', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h5 style={{ fontWeight: 800, fontSize: 17, color: '#0F172A', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>ফিল্টার সমুহ</h5>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '2px 0 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                নির্বাচিত ফিল্টার ({activeCount})
              </p>
            </div>
            <button onClick={() => setIsMobileFilterOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}>
              <IconX size={22} />
            </button>
          </div>
        </div>

        {/* Drawer Scroll Body */}
        <div className="drawer-scroll-body">
          {/* Hospital Type */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>হাসপাতাল ধরন</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HOSPITAL_TYPES.map(t => {
                const isChecked = hospitalType === t.id
                return (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setHospitalType(isChecked ? '' : t.id)}
                      style={{ width: 16, height: 16, accentColor: '#00B875', borderRadius: 4 }}
                    />
                    <span>{t.icon} {t.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>লোকেশন (Location)</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4, display: 'block', fontFamily: "'Hind Siliguri', sans-serif" }}>বিভাগ (Division)</label>
                <select
                  value={selectedDivision}
                  onChange={e => { setSelectedDivision(e.target.value); setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('') }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13.5, color: '#0F172A', outline: 'none' }}
                >
                  <option value="">সকল বিভাগ</option>
                  {divisions.map(d => (
                    <option key={d.id} value={d.id}>{getLocName(d, d.id)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4, display: 'block', fontFamily: "'Hind Siliguri', sans-serif" }}>জেলা (District)</label>
                <select
                  value={selectedDistrict}
                  onChange={e => { setSelectedDistrict(e.target.value); setSelectedUpazila(''); setSelectedUnion('') }}
                  disabled={!selectedDivision}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13.5, color: '#0F172A', outline: 'none', background: !selectedDivision ? '#F1F5F9' : 'white' }}
                >
                  <option value="">সকল জেলা</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{getLocName(d, d.id)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4, display: 'block', fontFamily: "'Hind Siliguri', sans-serif" }}>উপজেলা (Upazila)</label>
                <select
                  value={selectedUpazila}
                  onChange={e => { setSelectedUpazila(e.target.value); setSelectedUnion('') }}
                  disabled={!selectedDistrict}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13.5, color: '#0F172A', outline: 'none', background: !selectedDistrict ? '#F1F5F9' : 'white' }}
                >
                  <option value="">সকল উপজেলা</option>
                  {upazilas.map(u => (
                    <option key={u.id} value={u.id}>{getLocName(u, u.id)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4, display: 'block', fontFamily: "'Hind Siliguri', sans-serif" }}>ইউনিয়ন (Union)</label>
                <select
                  value={selectedUnion}
                  onChange={e => setSelectedUnion(e.target.value)}
                  disabled={!selectedUpazila}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13.5, color: '#0F172A', outline: 'none', background: !selectedUpazila ? '#F1F5F9' : 'white' }}
                >
                  <option value="">সকল ইউনিয়ন</option>
                  {unions.map(u => (
                    <option key={u.id} value={u.id}>{getLocName(u, u.id)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bed Ranges */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>শয্যা সংখ্যা (Beds)</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BED_RANGES.map(b => {
                const isChecked = selectedBeds === b.id
                return (
                  <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setSelectedBeds(isChecked ? '' : b.id)}
                      style={{ width: 16, height: 16, accentColor: '#0B192C', borderRadius: 4 }}
                    />
                    <span>{b.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Special Facilities */}
          <div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>বিশেষ সুবিধা</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#334155', fontWeight: emergencyOnly ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                <input
                  type="checkbox"
                  checked={emergencyOnly}
                  onChange={() => setEmergencyOnly(v => !v)}
                  style={{ width: 16, height: 16, accentColor: '#0B192C', borderRadius: 4 }}
                />
                <span>২৪/৭ জরুরি সেবা</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#334155', fontWeight: openTodayOnly ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                <input
                  type="checkbox"
                  checked={openTodayOnly}
                  onChange={() => setOpenTodayOnly(v => !v)}
                  style={{ width: 16, height: 16, accentColor: '#0B192C', borderRadius: 4 }}
                />
                <span>আজ খোলা আছে</span>
              </label>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 20px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid #F1F5F9', background: 'white' }}>
          <button type="button" onClick={handleClearAllFilters} style={{ flex: 1, height: 44, borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif" }}>
            রিসেট
          </button>
          <button type="button" onClick={() => setIsMobileFilterOpen(false)} style={{ flex: 2, height: 44, borderRadius: 8, background: '#0B192C', border: 'none', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif" }}>
            প্রয়োগ করুন ({sortedHospitals.length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default HospitalsPage

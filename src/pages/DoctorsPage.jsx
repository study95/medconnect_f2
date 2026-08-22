import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { useParams, useSearchParams, Link } from 'react-router-dom'

import DoctorCard from '../components/common/DoctorCard'
import ErrorState from '../components/common/ErrorState'
import { DoctorGridSkeleton } from '../components/common/Skeletons'
import SeoHead from '../components/common/SeoHead'
import DoctorDetailPage from './DoctorDetailPage'
import useInfiniteDoctors from '../hooks/useInfiniteDoctors'
import useLocations from '../hooks/useLocations'
import useSpecialties from '../hooks/useSpecialties'
import useHospitals from '../hooks/useHospitals'
import useDebounce from '../hooks/useDebounce'
import {
  IconSearch, IconStethoscope, IconHeart, IconEye, IconBone,
  IconMoodSmile, IconBabyCarriage, IconDroplet, IconShieldCheck,
  IconLock, IconClock, IconHeadset, IconChevronLeft, IconChevronRight,
  IconAdjustmentsHorizontal, IconX, IconMapPin, IconChevronDown, IconChevronUp, IconBrain, IconGenderFemale, IconDental,
  IconBuildingHospital, IconStar, IconTrash, IconActivity, IconCheck, IconVideo, IconCalendarCheck, IconListDetails, IconGridDots
} from '@tabler/icons-react'

const POPULAR_DEPARTMENTS = [
  { enName: 'Cardiologist', bnName: 'হৃদরোগ বিশেষজ্ঞ', searchKey: 'cardio', bnKey: 'হৃদরোগ', icon: <IconHeart size={18} color="#EF4444" /> },
  { enName: 'Medicine Specialist', bnName: 'মেডিসিন বিশেষজ্ঞ', searchKey: 'med', bnKey: 'মেডিসিন', icon: <IconStethoscope size={18} color="#2563EB" /> },
  { enName: 'Dermatologist', bnName: 'চর্মরোগ বিশেষজ্ঞ', searchKey: 'derma', bnKey: 'চর্মরোগ', icon: <IconDroplet size={18} color="#D97706" /> },
  { enName: 'Neurologist', bnName: 'স্নায়ুরোগ বিশেষজ্ঞ', searchKey: 'neuro', bnKey: 'স্নায়ুরোগ', icon: <IconBrain size={18} color="#9333EA" /> },
  { enName: 'Pediatrician', bnName: 'শিশু রোগ বিশেষজ্ঞ', searchKey: 'pedia', bnKey: 'শিশু', icon: <IconBabyCarriage size={18} color="#0284C7" /> },
  { enName: 'Gynecologist', bnName: 'স্ত্রী ও প্রসূতি রোগ', searchKey: 'gyne', bnKey: 'স্ত্রী', icon: <IconGenderFemale size={18} color="#DB2777" /> },
  { enName: 'Dentist', bnName: 'দন্ত বিশেষজ্ঞ', searchKey: 'dent', bnKey: 'দন্ত', icon: <IconDental size={18} color="#16A34A" /> },
  { enName: 'Orthopedist', bnName: 'অর্থোপেডিক্স', searchKey: 'ortho', bnKey: 'অর্থোপেডিক্স', icon: <IconBone size={18} color="#EA580C" /> }
]

const FEE_RANGES = [
  { id: '0-500', label: '৳ ০ - ৫০০' },
  { id: '501-1000', label: '৳ ৫০১ - ১০০০' },
  { id: '1001-1500', label: '৳ ১০০১ - ১৫০০' },
  { id: '1501-99999', label: '৳ ১৫০০+' }
]

const EXP_RANGES = [
  { id: '0-5', label: '০ - ৫ বছর' },
  { id: '6-10', label: '৬ - ১০ বছর' },
  { id: '11-20', label: '১১ - ২০ বছর' },
  { id: '21-99', label: '২০+ বছর' }
]

function DoctorsPage() {
  const { district: districtParam, upazila: upazilaParam } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  // 1-segment legacy fallback disambiguation:
  // If route matched /doctors/:district and the token is purely numeric or ULID, delegate to DoctorDetailPage
  const isLegacyIdentifier = !upazilaParam && (
    districtParam && (/^\d+$/.test(districtParam) || (districtParam.length === 26 && /^[0-9A-HJ-KM-NP-TV-Z]+$/i.test(districtParam)))
  )

  if (isLegacyIdentifier) {
    return <DoctorDetailPage />
  }

  const {
    divisions, districts, upazilas, unions,
    selectedDivision, selectedDistrict, selectedUpazila, selectedUnion,
    setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion,
  } = useLocations()

  const { specialties } = useSpecialties()
  const { hospitals } = useHospitals({ per_page: 100 })

  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty_id') || '')
  const [selectedHospital, setSelectedHospital]   = useState(searchParams.get('hospital_id') || '')
  const [selectedFee, setSelectedFee]             = useState(searchParams.get('fee_range') || '')
  const [selectedExp, setSelectedExp]             = useState(searchParams.get('exp_range') || '')
  const [searchText, setSearchText]               = useState(searchParams.get('search') || '')
  const debouncedSearchText                       = useDebounce(searchText, 350)
  const [availableToday, setAvailableToday]       = useState(false)
  const [telemedicineOnly, setTelemedicineOnly]   = useState(false)
  const [specialtySearch, setSpecialtySearch]     = useState('')
  const [hospitalSearch, setHospitalSearch]       = useState('')

  const [sortBy, setSortBy]   = useState('relevance')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState({
    specialty: true,
    location: true,
    fee: true,
    exp: false,
    hospital: false,
    extras: true
  })

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Ref to track URL search string to prevent race condition loops
  const prevParamsRef = useRef(searchParams.toString())

  // Update URL helper
  const updateUrlParams = useCallback((updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      Object.entries(updates).forEach(([key, val]) => {
        if (val) {
          next.set(key, val)
        } else {
          next.delete(key)
        }
      })
      prevParamsRef.current = next.toString()
      return next
    }, { replace: true })
  }, [setSearchParams])

  // Sync regional URL params with useLocations
  useEffect(() => {
    if (districtParam && districts?.length > 0 && !selectedDistrict) {
      const match = districts.find(d => d.slug === districtParam)
      if (match) setSelectedDistrict(String(match.id))
    }
  }, [districtParam, districts, selectedDistrict, setSelectedDistrict])

  useEffect(() => {
    if (upazilaParam && upazilas?.length > 0 && !selectedUpazila) {
      const match = upazilas.find(u => u.slug === upazilaParam)
      if (match) setSelectedUpazila(String(match.id))
    }
  }, [upazilaParam, upazilas, selectedUpazila, setSelectedUpazila])

  // Sync state when URL params change from external navigation
  useEffect(() => {
    const currentStr = searchParams.toString()
    if (prevParamsRef.current === currentStr) return
    prevParamsRef.current = currentStr

    const divId   = searchParams.get('division_id') || ''
    const distId  = searchParams.get('district_id') || ''
    const upaId   = searchParams.get('upazila_id') || ''
    const uniId   = searchParams.get('union_id') || ''
    const qSearch = searchParams.get('search') || ''
    const specId  = searchParams.get('specialty_id') || ''
    const hospId  = searchParams.get('hospital_id') || ''
    const fee     = searchParams.get('fee_range') || ''
    const exp     = searchParams.get('exp_range') || ''

    setSelectedDivision(divId)
    setSelectedDistrict(distId)
    setSelectedUpazila(upaId)
    setSelectedUnion(uniId)
    setSearchText(qSearch)
    setSelectedSpecialty(specId)
    setSelectedHospital(hospId)
    setSelectedFee(fee)
    setSelectedExp(exp)
  }, [searchParams, setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion])

  // Effective search keyword: immediately empty when searchText is cleared
  const effectiveSearch = searchText.trim() === '' ? '' : debouncedSearchText.trim()

  const appliedFilters = useMemo(() => {
    const p = {}
    if (districtParam)             p.district_slug = districtParam
    if (upazilaParam)              p.upazila_slug  = upazilaParam
    if (selectedDivision)          p.division_id   = selectedDivision
    if (selectedDistrict)          p.district_id   = selectedDistrict
    if (selectedUpazila)           p.upazila_id    = selectedUpazila
    if (selectedUnion)             p.union_id      = selectedUnion
    if (selectedSpecialty)         p.specialty_id  = selectedSpecialty
    if (selectedHospital)          p.hospital_id   = selectedHospital
    if (selectedFee)               p.fee_range     = selectedFee
    if (selectedExp)               p.exp_range     = selectedExp
    if (telemedicineOnly)          p.available_telemedicine = 'yes'
    if (availableToday)            p.available_today = true
    if (effectiveSearch)           p.search        = effectiveSearch
    return p
  }, [districtParam, upazilaParam, selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, selectedSpecialty, selectedHospital, selectedFee, selectedExp, telemedicineOnly, availableToday, effectiveSearch])

  const { doctors, total, loading, fetchingNext, hasMore, fetchMore, error, refresh } = useInfiniteDoctors(appliedFilters)

  const sortedDoctors = useMemo(() => {
    let list = [...doctors]

    if (selectedFee) {
      const [minStr, maxStr] = selectedFee.split('-')
      const min = parseInt(minStr) || 0
      const max = parseInt(maxStr) || 99999
      list = list.filter(d => {
        const rawFee = d.fee ?? d.consultation_fee ?? 500
        const f = parseFloat(String(rawFee).replace(/[^0-9.]/g, '')) || 500
        return f >= min && f <= max
      })
    }
    
    if (selectedExp) {
      const [minStr, maxStr] = selectedExp.split('-')
      const min = parseInt(minStr) || 0
      const max = parseInt(maxStr) || 99
      list = list.filter(d => {
        const rawExp = d.experience ?? 8
        const e = parseInt(String(rawExp).replace(/[^0-9]/g, '')) || 8
        return e >= min && e <= max
      })
    }

    if (telemedicineOnly) {
      list = list.filter(d => Boolean(d.available_telemedicine ?? d.telemedicine ?? true))
    }

    if (sortBy === 'fee_low') {
      return list.sort((a, b) => (parseFloat(a.fee) || 0) - (parseFloat(b.fee) || 0))
    }
    if (sortBy === 'fee_high') {
      return list.sort((a, b) => (parseFloat(b.fee) || 0) - (parseFloat(a.fee) || 0))
    }
    if (sortBy === 'exp_high') {
      return list.sort((a, b) => {
        const eStrB = String(b.experience || '0').replace(/[^0-9]/g, '')
        const eStrA = String(a.experience || '0').replace(/[^0-9]/g, '')
        return (parseInt(eStrA) || 0) - (parseInt(eStrB) || 0)
      })
    }
    return list
  }, [doctors, sortBy, selectedFee, selectedExp, telemedicineOnly])

  // Helper for location display name
  const getLocName = (item, fallback) => {
    if (!item) return fallback
    if (typeof item.name === 'object' && item.name !== null) {
      return item.name.bn || item.name.en || fallback
    }
    return item.name || item.name_bn || item.bangla_name || fallback
  }

  // Clear single search handler
  const handleClearSearch = () => {
    setSearchText('')
    updateUrlParams({ search: '' })
  }

  // Active filters list
  const activeFilters = useMemo(() => {
    const list = []
    if (selectedSpecialty) {
      const item = specialties.find(s => String(s.id) === String(selectedSpecialty))
      list.push({
        key: 'specialty',
        label: item ? item.name || item.name_bn : 'Specialty',
        clear: () => {
          setSelectedSpecialty('')
          updateUrlParams({ specialty_id: '' })
        }
      })
    }
    if (selectedDivision) {
      const item = divisions.find(d => String(d.id) === String(selectedDivision))
      list.push({
        key: 'division',
        label: getLocName(item, 'Division'),
        clear: () => {
          setSelectedDivision('')
          setSelectedDistrict('')
          setSelectedUpazila('')
          setSelectedUnion('')
          updateUrlParams({ division_id: '', district_id: '', upazila_id: '', union_id: '' })
        }
      })
    }
    if (selectedDistrict) {
      const item = districts.find(d => String(d.id) === String(selectedDistrict))
      list.push({
        key: 'district',
        label: getLocName(item, 'District'),
        clear: () => {
          setSelectedDistrict('')
          setSelectedUpazila('')
          setSelectedUnion('')
          updateUrlParams({ district_id: '', upazila_id: '', union_id: '' })
        }
      })
    }
    if (selectedUpazila) {
      const item = upazilas.find(u => String(u.id) === String(selectedUpazila))
      list.push({
        key: 'upazila',
        label: getLocName(item, 'Upazila'),
        clear: () => {
          setSelectedUpazila('')
          setSelectedUnion('')
          updateUrlParams({ upazila_id: '', union_id: '' })
        }
      })
    }
    if (selectedUnion) {
      const item = unions.find(u => String(u.id) === String(selectedUnion))
      list.push({
        key: 'union',
        label: getLocName(item, 'Union'),
        clear: () => {
          setSelectedUnion('')
          updateUrlParams({ union_id: '' })
        }
      })
    }
    if (selectedHospital) {
      const item = hospitals.find(h => String(h.id) === String(selectedHospital))
      list.push({
        key: 'hospital',
        label: item ? item.name || item.name_bn : 'Hospital',
        clear: () => {
          setSelectedHospital('')
          updateUrlParams({ hospital_id: '' })
        }
      })
    }
    if (selectedFee) {
      const item = FEE_RANGES.find(f => f.id === selectedFee)
      list.push({
        key: 'fee',
        label: item ? item.label : selectedFee,
        clear: () => {
          setSelectedFee('')
          updateUrlParams({ fee_range: '' })
        }
      })
    }
    if (selectedExp) {
      const item = EXP_RANGES.find(e => e.id === selectedExp)
      list.push({
        key: 'exp',
        label: item ? item.label : selectedExp,
        clear: () => {
          setSelectedExp('')
          updateUrlParams({ exp_range: '' })
        }
      })
    }
    if (telemedicineOnly) {
      list.push({ key: 'telemedicine', label: 'অনলাইন ভিডিও পরামর্শ', clear: () => setTelemedicineOnly(false) })
    }
    if (availableToday) {
      list.push({ key: 'today', label: 'আজ উপলব্ধ', clear: () => setAvailableToday(false) })
    }
    if (searchText.trim()) {
      list.push({
        key: 'search',
        label: `"${searchText.trim()}"`,
        clear: handleClearSearch
      })
    }
    return list
  }, [
    selectedSpecialty, selectedDivision, selectedDistrict, selectedUpazila, selectedUnion,
    selectedHospital, selectedFee, selectedExp, telemedicineOnly, availableToday, searchText,
    specialties, divisions, districts, upazilas, unions, hospitals, updateUrlParams
  ])

  const activeCount = activeFilters.length

  const handleClearAllFilters = () => {
    setSelectedDivision('')
    setSelectedDistrict('')
    setSelectedUpazila('')
    setSelectedUnion('')
    setSelectedSpecialty('')
    setSelectedHospital('')
    setSelectedFee('')
    setSelectedExp('')
    setTelemedicineOnly(false)
    setAvailableToday(false)
    setSearchText('')
    prevParamsRef.current = ''
    setSearchParams({}, { replace: true })
  }

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    updateUrlParams({ search: searchText.trim() })
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

  const filteredSpecialties = useMemo(() => {
    if (!specialtySearch.trim()) return specialties
    const q = specialtySearch.toLowerCase()
    return specialties.filter(s => (s.name || '').toLowerCase().includes(q) || (s.name_bn || '').toLowerCase().includes(q))
  }, [specialties, specialtySearch])

  const filteredHospitals = useMemo(() => {
    if (!hospitalSearch.trim()) return hospitals
    const q = hospitalSearch.toLowerCase()
    return hospitals.filter(h => (h.name || '').toLowerCase().includes(q) || (h.name_bn || '').toLowerCase().includes(q))
  }, [hospitals, hospitalSearch])

  // Dynamic SEO metadata computation for national, district, and upazila doctor listing hubs
  const seoData = useMemo(() => {
    const districtObj = districts?.find(d => d.slug === districtParam || String(d.id) === String(selectedDistrict))
    const upazilaObj = upazilas?.find(u => u.slug === upazilaParam || String(u.id) === String(selectedUpazila))
    
    const distNameBn = districtObj?.bangla_name || districtObj?.name_bn || districtObj?.name
    const upaNameBn = upazilaObj?.bangla_name || upazilaObj?.name_bn || upazilaObj?.name
    const distNameEn = districtObj?.name || districtParam
    const upaNameEn = upazilaObj?.name || upazilaParam

    let canonicalPath = '/doctors'
    let title = 'বাংলাদেশের সেরা বিশেষজ্ঞ ডাক্তার তালিকা ও সিরিয়াল বুকিং | MedConnect'
    let description = 'বাংলাদেশের শীর্ষস্থানীয় বিশেষজ্ঞ ডাক্তারদের তালিকা, চেম্বার সময়সূচী ও অনলাইন সিরিয়াল বুকিং সেবা।'

    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Doctors', url: '/doctors' },
    ]

    if (districtParam) {
      canonicalPath = `/doctors/${districtParam}`
      title = `${distNameBn || distNameEn} জেলার সেরা বিশেষজ্ঞ ডাক্তার তালিকা | MedConnect`
      description = `${distNameBn || distNameEn} জেলার অভিজ্ঞ ডাক্তারদের তালিকা, বিশেষজ্ঞ বিভাগ, চেম্বার লোকেশন ও অনলাইন অ্যাপয়েন্টমেন্ট।`
      breadcrumbs.push({ name: distNameEn || 'District', url: `/doctors/${districtParam}` })

      if (upazilaParam) {
        canonicalPath = `/doctors/${districtParam}/${upazilaParam}`
        title = `${upaNameBn || upaNameEn}, ${distNameBn || distNameEn} — বিশেষজ্ঞ ডাক্তারদের তালিকা ও অ্যাপয়েন্টমেন্ট | MedConnect`
        description = `${upaNameBn || upaNameEn}, ${distNameBn || distNameEn} এলাকার শীর্ষ বিশেষজ্ঞ ডাক্তারদের তালিকা, ওপিডি চেম্বার শিডিউল ও সিরিয়াল বুকিং।`
        breadcrumbs.push({ name: upaNameEn || 'Upazila', url: `/doctors/${districtParam}/${upazilaParam}` })
      }
    }

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description: description,
      url: `https://medconnect.com.bd${canonicalPath}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: doctors.slice(0, 12).map((doc, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: doc.name || doc.name_bn,
          url: doc.canonical_url ? `https://medconnect.com.bd${doc.canonical_url}` : undefined,
        })),
      },
    }

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: crumb.name,
        item: `https://medconnect.com.bd${crumb.url}`,
      })),
    }

    return {
      title,
      description,
      canonicalUrl: `https://medconnect.com.bd${canonicalPath}`,
      schema: [collectionSchema, breadcrumbSchema],
    }
  }, [districtParam, upazilaParam, districts, upazilas, selectedDistrict, selectedUpazila, doctors])

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingTop: 'var(--header-height, 110px)', paddingBottom: 60, fontFamily: "'Inter', sans-serif" }}>
      <SeoHead
        title={seoData.title}
        description={seoData.description}
        canonicalUrl={seoData.canonicalUrl}
        schema={seoData.schema}
      />
      
      {/* ── RESPONSIVE FILTER DRAWER & LAYOUT CSS ── */}
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
          .doc-desktop-search {
            display: none !important;
          }
          .doc-mobile-search-bar {
            display: block !important;
          }
        }
        @media (min-width: 992px) {
          .doc-mobile-search-bar {
            display: none !important;
          }
        }
      `}</style>

      {/* ── MOBILE STICKY SEARCH & FILTER BAR (<992px) ── */}
      <div className="doc-mobile-search-bar" style={{
        position: 'sticky',
        top: 'calc(var(--header-height, 68px) - 1px)',
        zIndex: 1040,
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        padding: '8px 16px'
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', flex: 1, margin: 0 }}>
            <input
              type="text"
              placeholder="ডাক্তারের নাম বা বিশেষজ্ঞ লিখুন..."
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
              <button type="button" onClick={handleClearSearch} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <IconX size={18} />
              </button>
            ) : (
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>
                <IconSearch size={18} />
              </span>
            )}
          </form>

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
              <span
                key={f.key}
                onClick={f.clear}
                style={{
                  background: '#00B875',
                  color: 'white',
                  border: '1px solid #00B875',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {f.label}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); f.clear() }}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex' }}
                >
                  <IconX size={13} />
                </button>
              </span>
            ))}
          </div>
          <button type="button" onClick={handleClearAllFilters} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Clear All ✕
          </button>
        </div>
      )}

      <Container fluid style={{ maxWidth: 1380, padding: '20px 24px' }}>
        
        {/* ── BREADCRUMB ── */}
        <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link to="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: '#0F172A', fontWeight: 600 }}>Doctor Listings</span>
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
              <span style={{ textTransform: 'capitalize' }}>{locationHeadingText}</span> — <span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>ডাক্তার তালিকা</span>
            </>
          ) : (
            <span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>সকল ডাক্তার তালিকা</span>
          )}
        </h1>

        {/* ── DESKTOP FULL WIDTH SEARCH BAR (≥992px) ── */}
        <form onSubmit={handleSearchSubmit} className="doc-desktop-search" style={{
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
            placeholder="Search by doctor name, specialty, hospital, area..."
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
            <button type="button" onClick={handleClearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}>
              <IconX size={16} />
            </button>
          )}
          <button type="submit" style={{
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
        </form>

        {/* ── POPULAR DEPARTMENTS CHIP STRIP ── */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16, scrollbarWidth: 'none' }}>
          {POPULAR_DEPARTMENTS.map((dept, idx) => {
            const matchedSpec = specialties.find(s => (s.name || '').toLowerCase().includes(dept.searchKey) || (s.name_bn || '').includes(dept.bnKey))
            const specId = matchedSpec ? String(matchedSpec.id) : null
            const isSelected = selectedSpecialty === specId && specId !== null
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedSpecialty(isSelected ? '' : specId)}
                style={{
                  background: isSelected ? '#00B875' : 'white',
                  color: isSelected ? 'white' : '#334155',
                  border: isSelected ? '1px solid #00B875' : '1px solid #E2E8F0',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Hind Siliguri', sans-serif",
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                <span>{dept.icon}</span>
                <span>{dept.bnName}</span>
              </button>
            )
          })}
        </div>

        {/* ── RESULTS SUMMARY BAR & SORT ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ color: '#64748B', fontSize: 13, fontWeight: 500 }}>
            Showing <strong style={{ color: '#0F172A' }}>{sortedDoctors.length}</strong> out of <strong style={{ color: '#0F172A' }}>{total || sortedDoctors.length}</strong> doctors
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, minWidth: 260, gap: 10 }}>
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
                  padding: '6px 8px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: 150
                }}
              >
                <option value="relevance">Relevance</option>
                <option value="fee_low">Fee: Low to High</option>
                <option value="fee_high">Fee: High to Low</option>
                <option value="exp_high">Experience: High to Low</option>
              </select>
            </div>

            {/* View Mode Toggle Buttons (Aligned to Right Edge) */}
            <div style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden', background: 'white', flexShrink: 0, marginLeft: 'auto' }}>
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
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT AREA (2 COLUMNS IN DESKTOP) ── */}
        <Row className="g-4">

          {/* ── LEFT COLUMN: FILTERS SIDEBAR PANEL (Desktop Only ≥992px) ── */}
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
                      Showing <strong style={{ color: '#0F172A' }}>{sortedDoctors.length}</strong> doctors
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
                      <span
                        key={f.key}
                        onClick={f.clear}
                        style={{
                          background: '#00B875',
                          color: 'white',
                          borderRadius: 4,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        {f.label}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); f.clear() }}
                          style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex' }}
                        >
                          <IconX size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Accordion 1: Department / Specialty */}
              <div style={{ marginBottom: 14, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                <div onClick={() => toggleAccordion('specialty')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Department / Specialty</span>
                  {openAccordions.specialty ? <IconChevronUp size={16} color="#64748B" /> : <IconChevronDown size={16} color="#64748B" />}
                </div>
                {openAccordions.specialty && (
                  <div style={{ marginTop: 10 }}>
                    <input
                      type="text"
                      placeholder="খুঁজুন..."
                      value={specialtySearch}
                      onChange={e => setSpecialtySearch(e.target.value)}
                      style={{ width: '100%', padding: '5px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, marginBottom: 8, outline: 'none' }}
                    />
                    <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {filteredSpecialties.map(s => {
                        const isChecked = String(selectedSpecialty) === String(s.id)
                        return (
                          <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, color: '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => setSelectedSpecialty(isChecked ? '' : String(s.id))}
                              style={{ width: 15, height: 15, accentColor: '#00B875', borderRadius: 4 }}
                            />
                            <span>{s.name_bn || s.name}</span>
                          </label>
                        )
                      })}
                    </div>
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

              {/* Accordion 3: Consultation Fee */}
              <div style={{ marginBottom: 14, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                <div onClick={() => toggleAccordion('fee')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Consultation Fee</span>
                  {openAccordions.fee ? <IconChevronUp size={16} color="#64748B" /> : <IconChevronDown size={16} color="#64748B" />}
                </div>
                {openAccordions.fee && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {FEE_RANGES.map(f => {
                      const isChecked = selectedFee === f.id
                      return (
                        <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setSelectedFee(isChecked ? '' : f.id)}
                            style={{ width: 16, height: 16, accentColor: '#00B875', borderRadius: 4 }}
                          />
                          <span>{f.label}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Accordion 4: Experience */}
              <div style={{ marginBottom: 14, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                <div onClick={() => toggleAccordion('exp')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Experience</span>
                  {openAccordions.exp ? <IconChevronUp size={16} color="#64748B" /> : <IconChevronDown size={16} color="#64748B" />}
                </div>
                {openAccordions.exp && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {EXP_RANGES.map(e => {
                      const isChecked = selectedExp === e.id
                      return (
                        <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setSelectedExp(isChecked ? '' : e.id)}
                            style={{ width: 16, height: 16, accentColor: '#00B875', borderRadius: 4 }}
                          />
                          <span>{e.label}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Accordion 5: Special Features */}
              <div style={{ marginBottom: 4 }}>
                <div onClick={() => toggleAccordion('extras')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Services & Availability</span>
                  {openAccordions.extras ? <IconChevronUp size={16} color="#64748B" /> : <IconChevronDown size={16} color="#64748B" />}
                </div>
                {openAccordions.extras && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: telemedicineOnly ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      <input
                        type="checkbox"
                        checked={telemedicineOnly}
                        onChange={() => setTelemedicineOnly(v => !v)}
                        style={{ width: 16, height: 16, accentColor: '#00B875', borderRadius: 4 }}
                      />
                      <span>অনলাইন ভিডিও কনসালটেশন</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: availableToday ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      <input
                        type="checkbox"
                        checked={availableToday}
                        onChange={() => setAvailableToday(v => !v)}
                        style={{ width: 16, height: 16, accentColor: '#00B875', borderRadius: 4 }}
                      />
                      <span>আজ উপলব্ধ</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </Col>

          {/* ── RIGHT COLUMN: DOCTORS GRID / LIST ── */}
          <Col xs={12} lg={9}>
            {loading && <DoctorGridSkeleton count={6} />}

            {error && !loading && (
              <ErrorState
                title="ডাক্তারদের তথ্য লোড করা যায়নি"
                message={error}
                onRetry={refresh}
                retryText="পুনরায় চেষ্টা করুন"
                onSecondary={handleClearAllFilters}
                secondaryText="ফিল্টার রিসেট করুন"
              />
            )}

            {!loading && sortedDoctors.length > 0 && (
              <Row className="g-3">
                {sortedDoctors.map(doctor => (
                  <Col key={doctor.id} xs={12} md={viewMode === 'grid' ? 6 : 12} xl={viewMode === 'grid' ? 4 : 12}>
                    <DoctorCard doctor={doctor} showBookingButton={true} viewMode={viewMode} />
                  </Col>
                ))}
              </Row>
            )}

            {!loading && !error && sortedDoctors.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ width: 70, height: 70, background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <IconStethoscope size={36} color="#64748B" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>কোনো ডাক্তার পাওয়া যায়নি</h3>
                <p style={{ color: '#64748B', fontSize: 14, maxWidth: 360, margin: '0 auto 20px', fontFamily: "'Hind Siliguri', sans-serif" }}>আপনার নির্বাচিত ফিল্টার অনুযায়ী কোনো ডাক্তার খুঁজে পাওয়া যায়নি।</p>
                <button onClick={handleClearAllFilters} style={{ background: '#0B192C', color: 'white', border: 'none', borderRadius: 6, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: "'Hind Siliguri', sans-serif" }}>
                  ফিল্টার মুছুন
                </button>
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} style={{ height: 30, marginTop: 20 }} />
            {fetchingNext && <div style={{ paddingTop: 10 }}><DoctorGridSkeleton count={3} /></div>}
          </Col>
        </Row>
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
          {/* Specialty */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>বিশেষজ্ঞ বিভাগ</span>
            <input
              type="text"
              placeholder="বিভাগ খুঁজুন..."
              value={specialtySearch}
              onChange={e => setSpecialtySearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, marginBottom: 10, outline: 'none' }}
            />
            <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredSpecialties.map(s => {
                const isChecked = String(selectedSpecialty) === String(s.id)
                return (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setSelectedSpecialty(isChecked ? '' : String(s.id))}
                      style={{ width: 16, height: 16, accentColor: '#00B875', borderRadius: 4 }}
                    />
                    <span>{s.name_bn || s.name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>লোকেশন</span>
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

          {/* Fee Ranges */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>ফি সীমার মধ্যে</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEE_RANGES.map(f => {
                const isChecked = selectedFee === f.id
                return (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setSelectedFee(isChecked ? '' : f.id)}
                      style={{ width: 16, height: 16, accentColor: '#0B192C', borderRadius: 4 }}
                    />
                    <span>{f.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Experience */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>অভিজ্ঞতা</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EXP_RANGES.map(e => {
                const isChecked = selectedExp === e.id
                return (
                  <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setSelectedExp(isChecked ? '' : e.id)}
                      style={{ width: 16, height: 16, accentColor: '#0B192C', borderRadius: 4 }}
                    />
                    <span>{e.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Special Features */}
          <div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>বিশেষ সেবা</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#334155', fontWeight: telemedicineOnly ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                <input
                  type="checkbox"
                  checked={telemedicineOnly}
                  onChange={() => setTelemedicineOnly(v => !v)}
                  style={{ width: 16, height: 16, accentColor: '#0B192C', borderRadius: 4 }}
                />
                <span>অনলাইন ভিডিও পরামর্শ</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#334155', fontWeight: availableToday ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                <input
                  type="checkbox"
                  checked={availableToday}
                  onChange={() => setAvailableToday(v => !v)}
                  style={{ width: 16, height: 16, accentColor: '#0B192C', borderRadius: 4 }}
                />
                <span>আজ উপলব্ধ</span>
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
            প্রয়োগ করুন ({sortedDoctors.length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default DoctorsPage

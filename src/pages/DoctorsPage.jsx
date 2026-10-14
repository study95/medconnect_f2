import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Container, Row, Col, Modal } from 'react-bootstrap'
import { useParams, useSearchParams, Link } from 'react-router-dom'

import DoctorCard from '../components/common/DoctorCard'
import CustomCheckbox from '../components/common/CustomCheckbox'
import ErrorState from '../components/common/ErrorState'
import { DoctorGridSkeleton } from '../components/common/Skeletons'
import SeoHead from '../components/common/SeoHead'
import DoctorDetailPage from './DoctorDetailPage'
import AvailabilityDateFilter from '../components/common/AvailabilityDateFilter'
import useInfiniteDoctors from '../hooks/useInfiniteDoctors'
import useLocations from '../hooks/useLocations'
import useSpecialties from '../hooks/useSpecialties'
import useHospitals from '../hooks/useHospitals'
import useDebounce from '../hooks/useDebounce'
import useUserLocation from '../hooks/useUserLocation'
import LocationPromptBanner from '../components/common/LocationPromptBanner'
import { formatDistance, calculateDistance } from '../utils/geoUtils'
import { toast } from 'react-hot-toast'
import {
  IconSearch, IconStethoscope, IconHeart, IconEye, IconBone,
  IconMoodSmile, IconBabyCarriage, IconDroplet, IconShieldCheck,
  IconLock, IconClock, IconHeadset, IconChevronLeft, IconChevronRight,
  IconAdjustmentsHorizontal, IconX, IconMapPin, IconChevronDown, IconChevronUp, IconBrain, IconGenderFemale, IconDental,
  IconBuildingHospital, IconStar, IconTrash, IconActivity, IconCheck, IconVideo, IconCalendarCheck, IconListDetails, IconGridDots,
  IconCurrentLocation, IconNavigation, IconLoader2, IconMicrophone, IconAlertTriangle, IconRefresh
} from '@tabler/icons-react'

const getSpecialtyIcon = (name = '', slug = '', isSelected = false) => {
  const text = (String(name) + ' ' + String(slug)).toLowerCase()

  if (text.includes('cardio') || text.includes('heart') || text.includes('হৃদ')) {
    return <IconHeart size={18} color={isSelected ? 'white' : '#EF4444'} />
  }
  if (text.includes('med') || text.includes('মেডিসিন') || text.includes('সাধারণ')) {
    return <IconStethoscope size={18} color={isSelected ? 'white' : '#2563EB'} />
  }
  if (text.includes('derma') || text.includes('skin') || text.includes('চর্ম')) {
    return <IconDroplet size={18} color={isSelected ? 'white' : '#D97706'} />
  }
  if (text.includes('neuro') || text.includes('brain') || text.includes('স্নায়ু')) {
    return <IconBrain size={18} color={isSelected ? 'white' : '#9333EA'} />
  }
  if (text.includes('pedia') || text.includes('child') || text.includes('শিশু')) {
    return <IconBabyCarriage size={18} color={isSelected ? 'white' : '#0284C7'} />
  }
  if (text.includes('gyne') || text.includes('female') || text.includes('woman') || text.includes('স্ত্রী') || text.includes('প্রসূতি')) {
    return <IconGenderFemale size={18} color={isSelected ? 'white' : '#DB2777'} />
  }
  if (text.includes('dent') || text.includes('দন্ত') || text.includes('দাঁত')) {
    return <IconDental size={18} color={isSelected ? 'white' : '#16A34A'} />
  }
  if (text.includes('ortho') || text.includes('bone') || text.includes('অর্থোপেডিক্স') || text.includes('হাড়')) {
    return <IconBone size={18} color={isSelected ? 'white' : '#EA580C'} />
  }
  if (text.includes('eye') || text.includes('ophthalm') || text.includes('চক্ষু') || text.includes('চোখ')) {
    return <IconEye size={18} color={isSelected ? 'white' : '#0D9488'} />
  }
  if (text.includes('psychi') || text.includes('mind') || text.includes('মানসিক')) {
    return <IconMoodSmile size={18} color={isSelected ? 'white' : '#8B5CF6'} />
  }

  return <IconStethoscope size={18} color={isSelected ? 'white' : '#00B875'} />
}

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

const RADIUS_OPTIONS = [
  { id: '',   label: 'সকল দূরত্ব (যেকোনো দূরত্ব)' },
  { id: '5',  label: '৫ কিমি এর মধ্যে' },
  { id: '10', label: '১০ কিমি এর মধ্যে' },
  { id: '25', label: '২৫ কিমি এর মধ্যে' },
  { id: '50', label: '৫০ কিমি এর মধ্যে' },
]

const enToBnDigits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBengaliNumber = (str) => (str !== null && str !== undefined && str !== '') ? String(str).replace(/\d/g, d => enToBnDigits[d] || d) : ''
const bnMonthNames = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
]
const formatDateLabelBn = (dateVal) => {
  if (!dateVal) return ''
  if (dateVal === 'today') return 'আজ'
  if (dateVal === 'tomorrow') return 'আগামীকাল'
  if (dateVal === 'next_7_days') return 'পরবর্তী ৭ দিন'
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    try {
      const [year, month, day] = dateVal.split('-')
      const mIdx = parseInt(month, 10) - 1
      return `${toBengaliNumber(parseInt(day, 10))} ${bnMonthNames[mIdx] || month}`
    } catch {
      return dateVal
    }
  }
  return dateVal
}

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
    setAllLocations,
  } = useLocations({
    division_id: searchParams.get('division_id') || '',
    district_id: searchParams.get('district_id') || '',
    upazila_id: searchParams.get('upazila_id') || '',
    union_id: searchParams.get('union_id') || ''
  })

  const { specialties } = useSpecialties()
  const { hospitals } = useHospitals({ per_page: 100 })

  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty_id') || '')
  const [selectedHospital, setSelectedHospital]   = useState((searchParams.get('hospital_id') && searchParams.get('hospital_id') !== 'undefined') ? searchParams.get('hospital_id') : '')
  const [selectedFee, setSelectedFee]             = useState(searchParams.get('fee_range') || '')
  const [selectedExp, setSelectedExp]             = useState(searchParams.get('exp_range') || '')
  const [selectedDate, setSelectedDate]           = useState(searchParams.get('date') || '')
  const [searchText, setSearchText]               = useState(searchParams.get('search') || '')
  const debouncedSearchText                       = useDebounce(searchText, 350)
  const [availableToday, setAvailableToday]       = useState(false)
  const [telemedicineOnly, setTelemedicineOnly]   = useState(false)
  const [specialtySearch, setSpecialtySearch]     = useState('')
  const [hospitalSearch, setHospitalSearch]       = useState('')

  const [isAllSpecialtiesModalOpen, setIsAllSpecialtiesModalOpen] = useState(false)
  const [modalSpecialtySearch, setModalSpecialtySearch]         = useState('')

  // Dynamically sort specialties by popularity (doctors_count) or name
  const sortedPopularSpecialties = useMemo(() => {
    if (!specialties || specialties.length === 0) return []
    return [...specialties].sort((a, b) => {
      const cntA = Number(a.doctors_count ?? a.doctor_count ?? 0)
      const cntB = Number(b.doctors_count ?? b.doctor_count ?? 0)
      if (cntB !== cntA) return cntB - cntA
      const nameA = a.name_bn || a.name || ''
      const nameB = b.name_bn || b.name || ''
      return nameA.localeCompare(nameB, 'bn')
    })
  }, [specialties])

  const popularChipSpecialties = useMemo(() => {
    return sortedPopularSpecialties.slice(0, 10)
  }, [sortedPopularSpecialties])

  // Desktop Horizontal Scroll State & Arrow Handlers
  const chipContainerRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = chipContainerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 5)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5)
  }, [])

  useEffect(() => {
    const el = chipContainerRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll, popularChipSpecialties])

  const scrollChips = (direction) => {
    const el = chipContainerRef.current
    if (!el) return
    const amount = direction === 'left' ? -280 : 280
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const handleChipWheel = (e) => {
    const el = chipContainerRef.current
    if (!el) return
    if (e.deltaY !== 0) {
      el.scrollLeft += e.deltaY
    }
  }

  const [sortBy, setSortBy]   = useState(searchParams.get('sort') || 'relevance')

  const {
    location: userLocation,
    loading: locationLoading,
    requestLocation,
    hasLocation,
    error: locationError,
    permissionStatus,
  } = useUserLocation()

  const [isNearMeActive, setIsNearMeActive] = useState(() => {
    return searchParams.get('near_me') === '1' || searchParams.get('sort') === 'nearest'
  })
  const [locationInlineError, setLocationInlineError] = useState(false)
  const [distanceRadius, setDistanceRadius] = useState(searchParams.get('radius') || '')

  const [viewMode, setViewModeState] = useState(() => {
    try {
      return localStorage.getItem('doctors_view_mode') || 'grid'
    } catch {
      return 'grid'
    }
  })

  const setViewMode = (mode) => {
    setViewModeState(mode)
    try {
      localStorage.setItem('doctors_view_mode', mode)
    } catch {
      // ignore
    }
  }
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Mobile Filter Bottom Sheet Drag-to-dismiss (Hardware Accelerated)
  const docFilterSheetRef = useRef(null)
  const docFilterOverlayRef = useRef(null)
  const docSheetTouchStartY = useRef(0)
  const docSheetCurrentY = useRef(0)
  const isDocSheetDragging = useRef(false)

  const closeMobileFilter = useCallback(() => {
    if (docFilterSheetRef.current) {
      docFilterSheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
      docFilterSheetRef.current.style.transform = 'translateY(100%)'
    }
    if (docFilterOverlayRef.current) {
      docFilterOverlayRef.current.style.transition = 'opacity 0.25s ease'
      docFilterOverlayRef.current.style.opacity = '0'
    }
    setTimeout(() => {
      setIsMobileFilterOpen(false)
      docSheetCurrentY.current = 0
      if (docFilterSheetRef.current) {
        docFilterSheetRef.current.style.transform = ''
      }
    }, 260)
  }, [])

  const handleDocSheetTouchStart = (e) => {
    docSheetTouchStartY.current = e.touches[0].clientY
    docSheetCurrentY.current = 0
    isDocSheetDragging.current = true
    if (docFilterSheetRef.current) {
      docFilterSheetRef.current.style.transition = 'none'
    }
    if (docFilterOverlayRef.current) {
      docFilterOverlayRef.current.style.transition = 'none'
    }
  }

  const handleDocSheetTouchMove = (e) => {
    if (!isDocSheetDragging.current) return
    const deltaY = e.touches[0].clientY - docSheetTouchStartY.current
    if (deltaY > 0) {
      docSheetCurrentY.current = deltaY
      if (docFilterSheetRef.current) {
        docFilterSheetRef.current.style.transform = `translateY(${deltaY}px)`
      }
      if (docFilterOverlayRef.current) {
        const opacity = Math.max(0, 1 - deltaY / 450)
        docFilterOverlayRef.current.style.opacity = opacity
      }
    }
  }

  const handleDocSheetTouchEnd = () => {
    if (!isDocSheetDragging.current) return
    isDocSheetDragging.current = false
    if (docFilterSheetRef.current) {
      docFilterSheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
    }
    if (docFilterOverlayRef.current) {
      docFilterOverlayRef.current.style.transition = 'opacity 0.28s ease'
    }

    if (docSheetCurrentY.current > 100) {
      closeMobileFilter()
    } else {
      if (docFilterSheetRef.current) {
        docFilterSheetRef.current.style.transform = 'translateY(0px)'
      }
      if (docFilterOverlayRef.current) {
        docFilterOverlayRef.current.style.opacity = '1'
      }
      docSheetCurrentY.current = 0
    }
  }

  // Prevent background scroll when mobile filter bottom sheet is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileFilterOpen])

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState({
    distance: true,
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

  // Near Me Toggle Handler
  const handleToggleNearMe = async () => {
    if (isNearMeActive) {
      setIsNearMeActive(false)
      setLocationInlineError(false)
      setDistanceRadius('')
      if (sortBy === 'nearest') {
        setSortBy('relevance')
        updateUrlParams({ near_me: '', radius: '', sort: '' })
      } else {
        updateUrlParams({ near_me: '', radius: '' })
      }
      return
    }

    try {
      await requestLocation()
      setLocationInlineError(false)
      setIsNearMeActive(true)
      setSortBy('nearest')
      updateUrlParams({ near_me: '1', sort: 'nearest' })
    } catch {
      setLocationInlineError(true)
    }
  }

  // Sort change handler with location prompt on 'nearest'
  const handleSortChange = async (newSort) => {
    if (newSort === 'nearest') {
      if (!hasLocation) {
        try {
          await requestLocation()
          setLocationInlineError(false)
          setIsNearMeActive(true)
          setSortBy('nearest')
          updateUrlParams({ sort: 'nearest', near_me: '1' })
        } catch {
          setLocationInlineError(true)
        }
      } else {
        setLocationInlineError(false)
        setIsNearMeActive(true)
        setSortBy('nearest')
        updateUrlParams({ sort: 'nearest', near_me: '1' })
      }
    } else {
      setSortBy(newSort)
      updateUrlParams({ sort: newSort })
    }
  }

  // Location Banner Success Callback
  const handleLocationBannerSuccess = () => {
    setLocationInlineError(false)
    setIsNearMeActive(true)
    setSortBy('nearest')
    updateUrlParams({ near_me: '1', sort: 'nearest' })
  }

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

  // Date filter change handler
  const handleDateChange = useCallback((dateVal) => {
    setSelectedDate(dateVal)
    updateUrlParams({ date: dateVal })
  }, [updateUrlParams])

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
    const hospId  = (searchParams.get('hospital_id') && searchParams.get('hospital_id') !== 'undefined') ? searchParams.get('hospital_id') : ''
    const fee     = searchParams.get('fee_range') || ''
    const exp     = searchParams.get('exp_range') || ''
    const qDate   = searchParams.get('date') || ''

    setAllLocations({ division_id: divId, district_id: distId, upazila_id: upaId, union_id: uniId })
    setSearchText(qSearch)
    setSelectedSpecialty(specId)
    setSelectedHospital(hospId)
    setSelectedFee(fee)
    setSelectedExp(exp)
    setSelectedDate(qDate)
  }, [searchParams, setAllLocations])

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
    if (selectedDate)              p.date          = selectedDate
    if (telemedicineOnly)          p.available_telemedicine = 'yes'
    if (availableToday)            p.available_today = true
    if (effectiveSearch)           p.search        = effectiveSearch
    if (isNearMeActive && userLocation?.latitude && userLocation?.longitude) {
      p.latitude = userLocation.latitude
      p.longitude = userLocation.longitude
      if (distanceRadius) p.radius = distanceRadius
    }
    if (sortBy)                    p.sort          = sortBy
    return p
  }, [districtParam, upazilaParam, selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, selectedSpecialty, selectedHospital, selectedFee, selectedExp, selectedDate, telemedicineOnly, availableToday, effectiveSearch, isNearMeActive, userLocation, distanceRadius, sortBy])

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

    if (sortBy === 'nearest' && userLocation?.latitude && userLocation?.longitude) {
      return list.sort((a, b) => {
        const da = a.matched_chamber?.distance_km ?? a.distance_km ?? 999999
        const db = b.matched_chamber?.distance_km ?? b.distance_km ?? 999999
        return da - db
      })
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
  }, [doctors, sortBy, selectedFee, selectedExp, telemedicineOnly, userLocation])

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

  // Voice search handler
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = 'bn-BD'
        recognition.onresult = (event) => {
          const text = event.results?.[0]?.[0]?.transcript
          if (text) {
            setSearchText(text)
            updateUrlParams({ search: text })
          }
        }
        recognition.start()
      } catch (err) {
        console.error(err)
      }
    } else {
      const el = document.querySelector('.doc-mobile-search-input')
      if (el) el.focus()
    }
  }

  // Active filters list
  const activeFilters = useMemo(() => {
    const list = []
    if (selectedSpecialty) {
      const item = specialties.find(s => String(s.id) === String(selectedSpecialty))
      const passedName = searchParams.get('specialty_name') || searchParams.get('specialty')
      list.push({
        key: 'specialty',
        label: item ? (item.name_bn || item.name) : (passedName || 'বিশেষজ্ঞতা'),
        clear: () => {
          setSelectedSpecialty('')
          updateUrlParams({ specialty_id: '', specialty_name: '' })
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
    if (selectedHospital && selectedHospital !== 'undefined') {
      const item = hospitals.find(h => 
        String(h.id) === String(selectedHospital) || 
        String(h.public_id) === String(selectedHospital) || 
        String(h.slug) === String(selectedHospital)
      )
      const passedName = searchParams.get('hospital_name') || searchParams.get('hospital')
      list.push({
        key: 'hospital',
        label: item ? (item.name || item.name_bn) : (passedName || 'হাসপাতাল'),
        clear: () => {
          setSelectedHospital(''); updateUrlParams({ hospital_name: '' })
          updateUrlParams({ hospital_id: '', hospital_name: '' })
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
    if (selectedDate) {
      list.push({
        key: 'date',
        label: formatDateLabelBn(selectedDate),
        clear: () => handleDateChange('')
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
    if (isNearMeActive) {
      list.push({
        key: 'near_me',
        label: `নিকটবর্তী${distanceRadius ? ` (${distanceRadius} কিমি)` : ''}`,
        clear: handleToggleNearMe
      })
    }
    return list
  }, [
    selectedSpecialty, selectedDivision, selectedDistrict, selectedUpazila, selectedUnion,
    selectedHospital, selectedFee, selectedExp, selectedDate, telemedicineOnly, availableToday, searchText,
    isNearMeActive, distanceRadius, handleToggleNearMe,
    specialties, divisions, districts, upazilas, unions, hospitals, updateUrlParams, handleDateChange
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
    setSelectedDate('')
    setTelemedicineOnly(false)
    setAvailableToday(false)
    setSearchText('')
    setIsNearMeActive(false)
    setLocationInlineError(false)
    setDistanceRadius('')
    setSortBy('relevance')
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
        @keyframes docSheetFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes docSheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .filter-drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: docSheetFadeIn 0.28s ease;
          touch-action: none;
        }

        .filter-drawer {
          background: #FFFFFF;
          width: 100%;
          max-width: 520px;
          height: 84vh;
          height: 84dvh;
          max-height: 88vh;
          border-radius: 24px 24px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.28);
          animation: docSheetSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
          touch-action: pan-y;
          position: relative;
        }

        .doc-sheet-drag-zone {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 0 6px 0;
          cursor: grab;
          touch-action: none;
          user-select: none;
          background: #FFFFFF;
          flex-shrink: 0;
        }

        .doc-sheet-drag-zone:active {
          cursor: grabbing;
        }

        .doc-sheet-drag-bar {
          width: 44px;
          height: 4.5px;
          border-radius: 999px;
          background: #CBD5E1;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .doc-sheet-drag-zone:hover .doc-sheet-drag-bar,
        .doc-sheet-drag-zone:active .doc-sheet-drag-bar {
          background: #94A3B8;
          transform: scaleY(1.2);
        }

        .doc-mobile-sheet-header {
          padding: 4px 20px 12px 20px;
          border-bottom: 1px solid #F1F5F9;
          background: #FFFFFF;
          flex-shrink: 0;
          touch-action: none;
          cursor: grab;
          user-select: none;
        }

        .drawer-scroll-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 14px 20px 20px 20px;
        }

        /* ── Page Layout & Spacings (Desktop & Mobile Responsive) ── */
        .doc-main-container {
          padding: 20px 24px;
        }
        .doc-breadcrumb {
          font-size: 13px;
          color: #64748B;
          font-weight: 500;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .doc-page-heading {
          font-size: 28px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }
        .doc-chips-wrapper {
          position: relative;
          margin-bottom: 16px;
        }
        .doc-chips-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          padding-top: 4px;
          padding-left: 4px;
          padding-right: 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          align-items: center;
          scroll-behavior: smooth;
        }
        .doc-results-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .doc-active-filters-bar {
          background: rgba(248, 250, 252, 0.95);
          border-bottom: none;
          padding: 8px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        @media (max-width: 991px) {
          .doc-active-filters-bar {
            padding: 2px 16px 8px 16px !important;
          }
          .doc-main-container {
            padding: 8px 16px 20px !important;
          }
          .doc-breadcrumb {
            margin-bottom: 4px !important;
            font-size: 12px !important;
          }
          .doc-page-heading {
            font-size: 20px !important;
            margin-bottom: 8px !important;
          }
          .doc-chips-wrapper {
            margin-bottom: 8px !important;
          }
          .doc-chips-scroll {
            padding-top: 2px !important;
            padding-bottom: 4px !important;
          }
          .doc-results-bar {
            margin-bottom: 10px !important;
          }
          .doc-desktop-search {
            display: none !important;
          }
          .doc-mobile-search-bar {
            display: block !important;
            padding: 8px 16px 4px !important;
          }
          .doc-chip-scroll-btn {
            display: none !important;
          }
        }
        @media (min-width: 992px) {
          .doc-mobile-search-bar {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .doc-results-bar {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .doc-results-controls {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .doc-view-toggle {
            margin-left: auto !important;
          }
        }

        /* ── Mobile Search & Filter (Matching Home Page 1no Image Design) ── */
        .doc-mobile-search-pill {
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
        .doc-mobile-search-pill:focus-within {
          border-color: #00B875;
          box-shadow: 0 2px 12px rgba(0, 184, 117, 0.14);
        }
        .doc-mobile-search-icon {
          color: #00B875;
          flex-shrink: 0;
        }
        .doc-mobile-search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13.5px;
          font-weight: 600;
          color: #1E293B;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .doc-mobile-search-input::placeholder {
          color: #64748B;
          font-weight: 500;
          opacity: 1;
        }
        .doc-mobile-mic-btn {
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
        .doc-mobile-mic-btn:active {
          transform: scale(0.9);
        }
        .doc-mobile-clear-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .doc-mobile-clear-btn:hover {
          color: #475569;
        }
        .doc-mobile-filter-btn {
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
        .doc-mobile-filter-btn:active {
          transform: scale(0.96);
          background: #F8FAFC;
        }
        .doc-mobile-filter-btn.active {
          border-color: #00B875;
          background: #E8F8F0;
          color: #00803D;
        }
        .doc-mobile-filter-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #00B875;
          color: #FFFFFF;
          border-radius: 50%;
          min-width: 19px;
          height: 19px;
          padding: 0 4px;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 6px rgba(0, 184, 117, 0.35);
          font-family: 'Inter', system-ui, sans-serif;
        }
      `}</style>

      {/* ── MOBILE STICKY SEARCH & FILTER BAR (<992px) ── */}
      <div className="doc-mobile-search-bar" style={{
        position: 'sticky',
        top: 'calc(var(--header-height, 68px) - 1px)',
        zIndex: 1040,
        background: 'rgba(248, 250, 252, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: 'none',
        padding: '10px 16px 6px'
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, margin: 0 }}>
            <div className="doc-mobile-search-pill">
              <IconSearch size={20} className="doc-mobile-search-icon" />
              <input
                type="text"
                placeholder="ডাক্তার, বিশেষজ্ঞতা বা হাসপাতাল..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="doc-mobile-search-input"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="doc-mobile-clear-btn"
                  title="মুছুন"
                >
                  <IconX size={17} />
                </button>
              )}
              <button
                type="button"
                onClick={handleVoiceSearch}
                className="doc-mobile-mic-btn"
                title="ভয়েস সার্চ"
              >
                <IconMicrophone size={19} />
              </button>
            </div>
          </form>

          {/* Filter Icon Button (Matching Image 1 design) */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className={`doc-mobile-filter-btn ${activeCount > 0 ? 'active' : ''}`}
            title="ফিল্টার"
          >
            <IconAdjustmentsHorizontal size={22} />
            {activeCount > 0 && (
              <span className="doc-mobile-filter-badge">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── TOP NAV BAR WITH ACTIVE FILTER PILLS ── */}
      {activeCount > 0 && (
        <div className="doc-active-filters-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {activeFilters.map(f => (
              <span
                key={f.key}
                onClick={f.clear}
                style={{
                  background: '#00B875',
                  color: 'white',
                  border: '1px solid #00B875',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  userSelect: 'none',
                  boxShadow: '0 1px 3px rgba(0, 184, 117, 0.25)'
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

      <Container fluid className="doc-main-container" style={{ maxWidth: 1380 }}>
        
        {/* ── BREADCRUMB ── */}
        <div className="doc-breadcrumb">
          <Link to="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: '#0F172A', fontWeight: 600 }}>Doctor Listings</span>
        </div>

        {/* ── HEADING TITLE ── */}
        <h1 className="doc-page-heading">
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

        {/* ── POPULAR DEPARTMENTS CHIP STRIP (DYNAMIC WITH DESKTOP SCROLL & ARROWS) ── */}
        <div className="doc-chips-wrapper">
          {/* Left Arrow Button (Desktop Only) */}
          {canScrollLeft && (
            <button
              type="button"
              className="doc-chip-scroll-btn"
              onClick={() => scrollChips('left')}
              aria-label="Scroll Left"
              style={{
                position: 'absolute',
                left: -14,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'white',
                border: '1px solid #CBD5E1',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#0F172A',
                transition: 'all 0.2s ease'
              }}
            >
              <IconChevronLeft size={18} />
            </button>
          )}

          {/* Right Arrow Button (Desktop Only) */}
          {canScrollRight && (
            <button
              type="button"
              className="doc-chip-scroll-btn"
              onClick={() => scrollChips('right')}
              aria-label="Scroll Right"
              style={{
                position: 'absolute',
                right: -14,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'white',
                border: '1px solid #CBD5E1',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#0F172A',
                transition: 'all 0.2s ease'
              }}
            >
              <IconChevronRight size={18} />
            </button>
          )}

          <div
            ref={chipContainerRef}
            onWheel={handleChipWheel}
            className="doc-chips-scroll"
          >
            {popularChipSpecialties.map((spec) => {
              const specId = String(spec.id)
              const isSelected = selectedSpecialty === specId
              const displayName = spec.name_bn || spec.name || 'বিশেষজ্ঞ'
              const docCount = spec.doctors_count ?? spec.doctor_count

              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => setSelectedSpecialty(isSelected ? '' : specId)}
                  style={{
                    background: isSelected ? '#00B875' : 'white',
                    color: isSelected ? 'white' : '#334155',
                    border: isSelected ? '1px solid #00B875' : '1px solid #CBD5E1',
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
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  <span>{getSpecialtyIcon(displayName, spec.slug, isSelected)}</span>
                  <span>{displayName}</span>
                  {docCount !== undefined && docCount !== null && (
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: isSelected ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                      color: isSelected ? 'white' : '#64748B',
                      padding: '1px 7px',
                      borderRadius: 10,
                      marginLeft: 2
                    }}>
                      {toBengaliNumber(docCount)}
                    </span>
                  )}
                </button>
              )
            })}

            {/* "সকল বিভাগ ❯" Trigger Button */}
            {specialties?.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAllSpecialtiesModalOpen(true)}
                style={{
                  background: '#F0FDF4',
                  color: '#00B875',
                  border: '1.5px dashed #00B875',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 12.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Hind Siliguri', sans-serif",
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                <span>সকল বিভাগ ❯</span>
              </button>
            )}
          </div>
        </div>

        {/* ── AVAILABILITY DATE FILTER (DESKTOP ONLY - MOVED INSIDE FILTER DRAWER ON MOBILE) ── */}
        <div className="d-none d-lg-block">
          <AvailabilityDateFilter
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>

        {/* ── RESULTS SUMMARY BAR & SORT ── */}
        <div className="doc-results-bar">
          <div style={{ color: '#64748B', fontSize: 13.5, fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>
            <strong style={{ color: '#0F172A', fontSize: 14 }}>{toBengaliNumber(sortedDoctors.length)}</strong> জন ডাক্তার
          </div>

          <div className="doc-results-controls" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: "'Hind Siliguri', sans-serif" }}>সাজান:</span>
              <select
                value={sortBy}
                onChange={e => handleSortChange(e.target.value)}
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
                  maxWidth: 180,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}
              >
                <option value="relevance">প্রাসঙ্গিকতা</option>
                <option value="nearest">নিকটবর্তী চেম্বার</option>
                <option value="fee_low">ফি: কম থেকে বেশি</option>
                <option value="fee_high">ফি: বেশি থেকে কম</option>
                <option value="exp_high">অভিজ্ঞতা: বেশি থেকে কম</option>
              </select>
            </div>

            {/* View Mode Toggle Buttons (Aligned to Right Edge) */}
            <div className="doc-view-toggle" style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden', background: 'white', flexShrink: 0 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconAdjustmentsHorizontal size={18} color="#0F172A" />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Filters</h3>
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

                {/* Live Location / Near Me (Desktop Sidebar - Firstly) */}
                <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>নিকটবর্তী ডাক্তার</span>
                  <button
                    type="button"
                    onClick={handleToggleNearMe}
                    disabled={locationLoading}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      borderRadius: 8,
                      background: isNearMeActive ? '#059669' : '#F1F5F9',
                      color: isNearMeActive ? 'white' : '#334155',
                      border: isNearMeActive ? 'none' : '1px solid #CBD5E1',
                      fontWeight: 700,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      marginBottom: isNearMeActive ? 12 : 0,
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}
                  >
                    {locationLoading ? <IconLoader2 size={16} className="spin-animation" /> : <IconCurrentLocation size={16} color={isNearMeActive ? 'white' : '#00B875'} />}
                    <span>{isNearMeActive ? 'নিকটবর্তী সক্রিয় (বন্ধ করতে ট্যাপ করুন)' : 'আপনার কাছের ডাক্তার খুঁজুন'}</span>
                  </button>

                  {/* Non-intrusive Inline Location Guidance Card */}
                  {locationInlineError && !isNearMeActive && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        boxShadow: '0 1px 3px rgba(239, 68, 68, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                        <IconAlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                            আপনার লোকেশন বন্ধ রয়েছে
                          </div>
                          <div style={{ fontSize: 11.5, color: '#7F1D1D', margin: '4px 0 0', lineHeight: 1.5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                            <div>১. ডিভাইসের নোটিফিকেশন বার নামিয়ে <strong>GPS / Location</strong> অন করুন।</div>
                            <div style={{ marginTop: 2 }}>২. ব্রাউজারের ওপরে অ্যাড্রেস বারের <strong>🔒 (লক)</strong> আইকনে চাপ দিয়ে Location <strong>Allow</strong> করুন।</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                        <button
                          type="button"
                          onClick={handleToggleNearMe}
                          disabled={locationLoading}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '7px 6px',
                            borderRadius: 6,
                            background: '#059669',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: 11.5,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontFamily: "'Hind Siliguri', sans-serif"
                          }}
                        >
                          {locationLoading ? <IconLoader2 size={13} className="spin-animation" style={{ flexShrink: 0 }} /> : <IconRefresh size={13} style={{ flexShrink: 0 }} />}
                          <span style={{ whiteSpace: 'nowrap' }}>আবার চেষ্টা করুন</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setLocationInlineError(false)
                            setOpenAccordions(prev => ({ ...prev, location: true }))
                            const target = document.getElementById('doc-location-accordion-desktop')
                            if (target) {
                              target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          }}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '7px 6px',
                            borderRadius: 6,
                            background: '#FFFFFF',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            fontSize: 11.5,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontFamily: "'Hind Siliguri', sans-serif"
                          }}
                        >
                          <IconMapPin size={13} style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap' }}>জেলা সিলেক্ট করুন</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isNearMeActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>দূরত্ব সিলেক্ট করুন:</span>
                      {RADIUS_OPTIONS.map(r => {
                        const isChecked = distanceRadius === r.id
                        return (
                          <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: isChecked ? '#059669' : '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                            <input
                              type="radio"
                              name="desktop_doc_distance_radius"
                              checked={isChecked}
                              onChange={() => {
                                setDistanceRadius(r.id)
                                updateUrlParams({ radius: r.id })
                              }}
                              style={{ width: 16, height: 16, accentColor: '#059669', cursor: 'pointer' }}
                            />
                            <span>{r.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

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
                            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, color: isChecked ? '#0F172A' : '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif", userSelect: 'none' }}>
                              <CustomCheckbox
                                checked={isChecked}
                                onChange={() => setSelectedSpecialty(isChecked ? '' : String(s.id))}
                                size={17}
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
                <div id="doc-location-accordion-desktop" style={{ marginBottom: 4 }}>
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
                    <DoctorCard doctor={doctor} showBookingButton={true} viewMode={viewMode} userLocation={userLocation} />
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

      {/* ── MOBILE FILTER BOTTOM SHEET MODAL (Portal to body) ── */}
      {isMobileFilterOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={docFilterOverlayRef}
          className="filter-drawer-backdrop"
          onClick={closeMobileFilter}
        >
          <div
            ref={docFilterSheetRef}
            className="filter-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Indicator Handle Bar (Swipe down to dismiss) */}
            <div
              className="doc-sheet-drag-zone"
              onTouchStart={handleDocSheetTouchStart}
              onTouchMove={handleDocSheetTouchMove}
              onTouchEnd={handleDocSheetTouchEnd}
            >
              <div className="doc-sheet-drag-bar" />
            </div>

            {/* Sheet Header (Swipeable, with filter count badge, without close X button per design preference) */}
            <div
              className="doc-mobile-sheet-header"
              onTouchStart={handleDocSheetTouchStart}
              onTouchMove={handleDocSheetTouchMove}
              onTouchEnd={handleDocSheetTouchEnd}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h5 style={{ fontWeight: 800, fontSize: 17, color: '#0F172A', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      ফিল্টার সমূহ
                    </h5>
                    {activeCount > 0 && (
                      <span style={{
                        background: '#E8F8F0',
                        color: '#00803D',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 20,
                        fontFamily: "'Hind Siliguri', sans-serif"
                      }}>
                        {toBengaliNumber(activeCount)}টি সক্রিয়
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#64748B', margin: '2px 0 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    পছন্দের বিভাগ, অবস্থান বা দূরত্ব ফিল্টার করুন
                  </p>
                </div>
              </div>
            </div>

        {/* Drawer Scroll Body */}
        <div className="drawer-scroll-body">
          {/* Near Me & Distance Radius (Mobile Drawer) */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>নিকটবর্তী ডাক্তার</span>
            <button
              type="button"
              onClick={handleToggleNearMe}
              disabled={locationLoading}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: 8,
                background: isNearMeActive ? '#059669' : '#F1F5F9',
                color: isNearMeActive ? 'white' : '#334155',
                border: isNearMeActive ? 'none' : '1px solid #CBD5E1',
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                marginBottom: isNearMeActive ? 12 : 0,
                fontFamily: "'Hind Siliguri', sans-serif"
              }}
            >
              {locationLoading ? <IconLoader2 size={16} className="spin-animation" /> : <IconCurrentLocation size={16} color={isNearMeActive ? 'white' : '#00B875'} />}
              <span>{isNearMeActive ? 'নিকটবর্তী সক্রিয় (বন্ধ করতে ট্যাপ করুন)' : 'আপনার কাছের ডাক্তার খুঁজুন'}</span>
            </button>

            {/* Non-intrusive Inline Location Guidance Card (Mobile) */}
            {locationInlineError && !isNearMeActive && (
              <div
                style={{
                  marginTop: 10,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: '0 1px 3px rgba(239, 68, 68, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <IconAlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#991B1B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      আপনার লোকেশন বন্ধ রয়েছে
                    </div>
                    <div style={{ fontSize: 12, color: '#7F1D1D', margin: '4px 0 0', lineHeight: 1.5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      <div>১. ফোনের নোটিফিকেশন বার নামিয়ে <strong>GPS / Location</strong> অন করুন।</div>
                      <div style={{ marginTop: 2 }}>২. ব্রাউজারের ওপরে অ্যাড্রেস বারের <strong>🔒 (লক)</strong> আইকনে চাপ দিয়ে Location <strong>Allow</strong> করুন।</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  <button
                    type="button"
                    onClick={handleToggleNearMe}
                    disabled={locationLoading}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '8px 6px',
                      borderRadius: 7,
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}
                  >
                    {locationLoading ? <IconLoader2 size={14} className="spin-animation" style={{ flexShrink: 0 }} /> : <IconRefresh size={14} style={{ flexShrink: 0 }} />}
                    <span style={{ whiteSpace: 'nowrap' }}>আবার চেষ্টা করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationInlineError(false)
                      const target = document.getElementById('doc-location-section-mobile')
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '8px 6px',
                      borderRadius: 7,
                      background: '#FFFFFF',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}
                  >
                    <IconMapPin size={14} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap' }}>জেলা সিলেক্ট করুন</span>
                  </button>
                </div>
              </div>
            )}

            {isNearMeActive && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>দূরত্ব সিলেক্ট করুন:</span>
                {RADIUS_OPTIONS.map(r => {
                  const isChecked = distanceRadius === r.id
                  return (
                    <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: isChecked ? '#059669' : '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      <input
                        type="radio"
                        name="mobile_distance_radius"
                        checked={isChecked}
                        onChange={() => {
                          setDistanceRadius(r.id)
                          updateUrlParams({ radius: r.id })
                        }}
                        style={{ width: 16, height: 16, accentColor: '#059669', cursor: 'pointer' }}
                      />
                      <span>{r.label}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Availability Date Filter (Mobile Drawer) */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <AvailabilityDateFilter
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>

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
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: isChecked ? '#0F172A' : '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif", userSelect: 'none' }}>
                    <CustomCheckbox
                      checked={isChecked}
                      onChange={() => setSelectedSpecialty(isChecked ? '' : String(s.id))}
                    />
                    <span>{s.name_bn || s.name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Location */}
          <div id="doc-location-section-mobile" style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
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
        </div>

        {/* Sheet Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 20px calc(12px + env(safe-area-inset-bottom))', borderTop: '1px solid #F1F5F9', background: 'white' }}>
          <button
            type="button"
            onClick={handleClearAllFilters}
            style={{ flex: 1, height: 44, borderRadius: 12, border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif" }}
          >
            রিসেট
          </button>
          <button
            type="button"
            onClick={closeMobileFilter}
            style={{ flex: 2, height: 44, borderRadius: 12, background: '#00803D', border: 'none', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif", boxShadow: '0 4px 12px rgba(0, 128, 61, 0.25)' }}
          >
            প্রয়োগ করুন
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}

      {/* Floating Smart Location Prompt Banner */}
      <LocationPromptBanner
        userLocation={userLocation}
        loading={locationLoading}
        error={locationError}
        permissionStatus={permissionStatus}
        onRequestLocation={requestLocation}
        entityType="doctor"
        onSuccess={handleLocationBannerSuccess}
      />

      {/* ── ALL SPECIALTIES MODAL ── */}
      <Modal
        show={isAllSpecialtiesModalOpen}
        onHide={() => setIsAllSpecialtiesModalOpen(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E2E8F0', padding: '16px 20px' }}>
          <Modal.Title style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
            সকল বিশেষজ্ঞ বিভাগ ({toBengaliNumber(specialties?.length || 0)})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 20, maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              type="text"
              placeholder="বিশেষজ্ঞ বিভাগের নাম দিয়ে খুঁজুন..."
              value={modalSpecialtySearch}
              onChange={(e) => setModalSpecialtySearch(e.target.value)}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 8,
                border: '1.5px solid #CBD5E1',
                padding: '0 36px 0 14px',
                fontSize: 14,
                color: '#0F172A',
                fontWeight: 600,
                outline: 'none',
                fontFamily: "'Hind Siliguri', sans-serif"
              }}
            />
            {modalSpecialtySearch ? (
              <button
                type="button"
                onClick={() => setModalSpecialtySearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <IconX size={18} />
              </button>
            ) : (
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}>
                <IconSearch size={18} />
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {specialties
              .filter(s => {
                if (!modalSpecialtySearch.trim()) return true
                const q = modalSpecialtySearch.toLowerCase()
                return (s.name || '').toLowerCase().includes(q) || (s.name_bn || '').includes(q)
              })
              .map((spec) => {
                const specId = String(spec.id)
                const isSelected = selectedSpecialty === specId
                const displayName = spec.name_bn || spec.name || 'বিশেষজ্ঞ'
                const docCount = spec.doctors_count ?? spec.doctor_count

                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => {
                      setSelectedSpecialty(isSelected ? '' : specId)
                      setIsAllSpecialtiesModalOpen(false)
                    }}
                    style={{
                      background: isSelected ? '#F0FDF4' : 'white',
                      border: isSelected ? '2px solid #00B875' : '1px solid #E2E8F0',
                      borderRadius: 8,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <span>{getSpecialtyIcon(displayName, spec.slug, false)}</span>
                      <span style={{
                        fontSize: 13,
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? '#00B875' : '#1E293B',
                        fontFamily: "'Hind Siliguri', sans-serif",
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {displayName}
                      </span>
                    </div>
                    {docCount !== undefined && docCount !== null && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: isSelected ? '#00B875' : '#64748B',
                        background: isSelected ? '#DCFCE7' : '#F1F5F9',
                        padding: '2px 8px',
                        borderRadius: 12,
                        marginLeft: 6
                      }}>
                        {toBengaliNumber(docCount)}
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default DoctorsPage

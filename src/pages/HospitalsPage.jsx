import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Container, Row, Col } from 'react-bootstrap'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'

import HospitalCard from '../components/common/HospitalCard'
import CustomCheckbox from '../components/common/CustomCheckbox'
import ErrorState from '../components/common/ErrorState'
import { HospitalGridSkeleton } from '../components/common/Skeletons'
import SeoHead from '../components/common/SeoHead'
import HospitalDetailPage from './HospitalDetailPage'
import SearchTypeaheadDropdown from '../components/common/SearchTypeaheadDropdown'
import { getHospitalUrl } from '../utils/identifierHelper'
import useLocations from '../hooks/useLocations'
import useSpecialties from '../hooks/useSpecialties'
import useInfiniteHospitals from '../hooks/useInfiniteHospitals'
import useDebounce from '../hooks/useDebounce'
import { useTypewriter } from '../hooks/useTypewriter'

const HOSPITAL_SEARCH_PHRASES = [
  'হাসপাতালের নাম লিখুন... (যেমন: অ্যাপোলো, ঢাকা মেডিকেল)',
  'ধরন লিখুন... (যেমন: ডায়াগনস্টিক, ক্লিনিক, ট্রমা)',
  'এলাকা দিয়ে খুঁজুন... (যেমন: উত্তরা, সিলেট সদর)',
  'হাসপাতাল বা ক্লিনিক খুঁজুন...'
]
import useUserLocation from '../hooks/useUserLocation'
import LocationPromptBanner from '../components/common/LocationPromptBanner'
import { calculateDistance } from '../utils/geoUtils'
import { toast } from 'react-hot-toast'
import {
  IconBuildingHospital, IconShieldCheck, IconSearch,
  IconChevronRight, IconChevronLeft, IconClock, IconHeadset, IconLock,
  IconAdjustmentsHorizontal, IconX, IconCheck, IconTrash, IconMapPin,
  IconChevronUp, IconChevronDown, IconStethoscope, IconAlertTriangle,
  IconCalendarCheck, IconStar, IconListDetails, IconGridDots,
  IconCurrentLocation, IconNavigation, IconLoader2, IconMicrophone, IconRefresh
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

const RADIUS_OPTIONS = [
  { id: '',   label: 'সকল দূরত্ব (যেকোনো দূরত্ব)' },
  { id: '5',  label: '৫ কিমি এর মধ্যে' },
  { id: '10', label: '১০ কিমি এর মধ্যে' },
  { id: '25', label: '২৫ কিমি এর মধ্যে' },
  { id: '50', label: '৫০ কিমি এর মধ্যে' },
]

const enToBnDigits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBengaliNumber = (str) => (str !== null && str !== undefined && str !== '') ? String(str).replace(/\d/g, d => enToBnDigits[d] || d) : ''

function HospitalsPage() {
  const { district: districtParam, upazila: upazilaParam } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isDesktopTypeaheadOpen, setIsDesktopTypeaheadOpen] = useState(false)
  const [isMobileTypeaheadOpen, setIsMobileTypeaheadOpen] = useState(false)

  // 1-segment legacy fallback disambiguation:
  // If route matched /hospitals/:district and the token is purely numeric or ULID, delegate to HospitalDetailPage
  const isLegacyIdentifier = !upazilaParam && (
    districtParam && (/^\d+$/.test(districtParam) || (districtParam.length === 26 && /^[0-9A-HJ-KM-NP-TV-Z]+$/i.test(districtParam)))
  )

  if (isLegacyIdentifier) {
    return <HospitalDetailPage />
  }

  const getInitialHospitalParam = (key) => {
    const val = searchParams.get(key)
    if (val !== null && val !== undefined && val !== '') return val
    if (!districtParam && !upazilaParam) {
      try {
        const saved = sessionStorage.getItem('hospitals_filter_query')
        if (saved) {
          const sp = new URLSearchParams(saved)
          return sp.get(key) || ''
        }
      } catch {}
    }
    return ''
  }

  const {
    divisions, districts, upazilas, unions,
    selectedDivision, selectedDistrict, selectedUpazila, selectedUnion,
    setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion,
  } = useLocations({
    division_id: getInitialHospitalParam('division_id'),
    district_id: getInitialHospitalParam('district_id'),
    upazila_id: getInitialHospitalParam('upazila_id'),
    union_id: getInitialHospitalParam('union_id')
  })

  const { specialties } = useSpecialties()

  const [hospitalType, setHospitalType]           = useState(() => getInitialHospitalParam('type'))
  const [selectedSpecialty, setSelectedSpecialty] = useState(() => getInitialHospitalParam('specialty_id'))
  const [selectedBeds, setSelectedBeds]           = useState(() => getInitialHospitalParam('beds'))
  const [emergencyOnly, setEmergencyOnly]         = useState(() => {
    const em = getInitialHospitalParam('emergency')
    return em === '1' || em === 'true' || getInitialHospitalParam('emergency_24h') === '1'
  })
  const [openTodayOnly, setOpenTodayOnly]         = useState(() => {
    const ot = getInitialHospitalParam('open_today')
    return ot === '1' || ot === 'true'
  })
  const [searchText, setSearchText]               = useState(() => getInitialHospitalParam('search'))
  const [appliedSearch, setAppliedSearch]         = useState(() => getInitialHospitalParam('search'))
  const [isSearching, setIsSearching]             = useState(false)
  const animatedPlaceholder                       = useTypewriter(HOSPITAL_SEARCH_PHRASES, 70, 35, 1800)
  const [specialtySearch, setSpecialtySearch]     = useState('')

  const [sortBy, setSortBy]   = useState(() => getInitialHospitalParam('sort') || 'newest')

  const {
    location: userLocation,
    loading: locationLoading,
    requestLocation,
    hasLocation,
    error: locationError,
    permissionStatus,
  } = useUserLocation()

  const [isNearMeActive, setIsNearMeActive] = useState(() => {
    return getInitialHospitalParam('near_me') === '1' || getInitialHospitalParam('sort') === 'nearest'
  })
  const [locationInlineError, setLocationInlineError] = useState(false)
  const [distanceRadius, setDistanceRadius] = useState(() => getInitialHospitalParam('radius') || '')

  const [viewMode, setViewModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('hospitals_view_mode')
      return (saved === 'grid' || saved === 'list') ? saved : 'list'
    } catch {
      return 'list'
    }
  })

  const setViewMode = (mode) => {
    setViewModeState(mode)
    try {
      localStorage.setItem('hospitals_view_mode', mode)
    } catch {
      // ignore
    }
  }
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Mobile Filter Bottom Sheet Drag-to-dismiss (Hardware Accelerated)
  const hospFilterSheetRef = useRef(null)
  const hospFilterOverlayRef = useRef(null)
  const hospSheetTouchStartY = useRef(0)
  const hospSheetCurrentY = useRef(0)
  const isHospSheetDragging = useRef(false)

  const closeMobileFilter = useCallback(() => {
    if (hospFilterSheetRef.current) {
      hospFilterSheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
      hospFilterSheetRef.current.style.transform = 'translateY(100%)'
    }
    if (hospFilterOverlayRef.current) {
      hospFilterOverlayRef.current.style.transition = 'opacity 0.25s ease'
      hospFilterOverlayRef.current.style.opacity = '0'
    }
    setTimeout(() => {
      setIsMobileFilterOpen(false)
      hospSheetCurrentY.current = 0
      if (hospFilterSheetRef.current) {
        hospFilterSheetRef.current.style.transform = ''
      }
    }, 260)
  }, [])

  const handleHospSheetTouchStart = (e) => {
    hospSheetTouchStartY.current = e.touches[0].clientY
    hospSheetCurrentY.current = 0
    isHospSheetDragging.current = true
    if (hospFilterSheetRef.current) {
      hospFilterSheetRef.current.style.transition = 'none'
    }
    if (hospFilterOverlayRef.current) {
      hospFilterOverlayRef.current.style.transition = 'none'
    }
  }

  const handleHospSheetTouchMove = (e) => {
    if (!isHospSheetDragging.current) return
    const deltaY = e.touches[0].clientY - hospSheetTouchStartY.current
    if (deltaY > 0) {
      hospSheetCurrentY.current = deltaY
      if (hospFilterSheetRef.current) {
        hospFilterSheetRef.current.style.transform = `translateY(${deltaY}px)`
      }
      if (hospFilterOverlayRef.current) {
        const opacity = Math.max(0, 1 - deltaY / 450)
        hospFilterOverlayRef.current.style.opacity = opacity
      }
    }
  }

  const handleHospSheetTouchEnd = () => {
    if (!isHospSheetDragging.current) return
    isHospSheetDragging.current = false
    if (hospFilterSheetRef.current) {
      hospFilterSheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
    }
    if (hospFilterOverlayRef.current) {
      hospFilterOverlayRef.current.style.transition = 'opacity 0.28s ease'
    }

    if (hospSheetCurrentY.current > 100) {
      closeMobileFilter()
    } else {
      if (hospFilterSheetRef.current) {
        hospFilterSheetRef.current.style.transform = 'translateY(0px)'
      }
      if (hospFilterOverlayRef.current) {
        hospFilterOverlayRef.current.style.opacity = '1'
      }
      hospSheetCurrentY.current = 0
    }
  }

  // Prevent background scroll when mobile filter is open
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
            setAppliedSearch(text)
            updateUrlParams({ search: text })
          }
        }
        recognition.start()
      } catch (err) {
        console.error(err)
        toast.error('ভয়েস সার্চ শুরু করা যায়নি')
      }
    } else {
      toast.error('আপনার ব্রাউজার ভয়েস সার্চ সমর্থন করে না')
    }
  }

  // Accordion open/close state inside left filter panel & mobile drawer
  const [openAccordions, setOpenAccordions] = useState({
    distance: true,
    type: true,
    location: true,
    beds: true,
    specialty: false,
    extras: true,
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
        setSortBy('newest')
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

  // Disambiguate if districtParam is actually a division slug
  const matchedDivision = useMemo(() => {
    if (!districtParam) return null
    const p = districtParam.trim().toLowerCase()
    const knownDivisionMap = {
      'dhaka': 1,
      'sylhet': 2,
      'rangpur': 3,
      'barisal': 4,
      'barishal': 4,
      'chattogram': 5,
      'chittagong': 5,
      'chhatagram': 5,
      'rajshahi': 6,
      'khulna': 7,
      'kulna': 7,
      'mymensingh': 8,
      'maimonshigh': 8,
    }
    if (knownDivisionMap[p]) {
      const foundInList = divisions?.find(d => Number(d.id) === knownDivisionMap[p])
      return foundInList || { id: knownDivisionMap[p], name: districtParam }
    }
    if (divisions?.length > 0) {
      return divisions.find(d => {
        const n = (d.name || '').toLowerCase()
        const s = (d.slug || '').toLowerCase()
        return s === p || n === p
      })
    }
    return null
  }, [districtParam, divisions])

  // Sync regional URL params with useLocations
  useEffect(() => {
    if (matchedDivision && !selectedDivision) {
      setSelectedDivision(String(matchedDivision.id))
      return
    }
    if (districtParam && !matchedDivision && districts?.length > 0 && !selectedDistrict) {
      const match = districts.find(d => d.slug === districtParam)
      if (match) setSelectedDistrict(String(match.id))
    }
  }, [districtParam, matchedDivision, selectedDivision, setSelectedDivision, districts, selectedDistrict, setSelectedDistrict])

  useEffect(() => {
    if (upazilaParam && upazilas?.length > 0 && !selectedUpazila) {
      const match = upazilas.find(u => u.slug === upazilaParam)
      if (match) setSelectedUpazila(String(match.id))
    }
  }, [upazilaParam, upazilas, selectedUpazila, setSelectedUpazila])

  // Flag to avoid loop when syncing internal state FROM external URL navigation
  const isSyncingFromUrlRef = useRef(false)

  // On mount, restore saved filters from sessionStorage if visiting bare /hospitals
  useEffect(() => {
    if (!searchParams.toString() && !districtParam && !upazilaParam) {
      const savedQuery = sessionStorage.getItem('hospitals_filter_query')
      if (savedQuery) {
        prevParamsRef.current = savedQuery
        setSearchParams(new URLSearchParams(savedQuery), { replace: true })
      }
    }
  }, [])

  useEffect(() => {
    const currentStr = searchParams.toString()
    if (prevParamsRef.current === currentStr) return
    prevParamsRef.current = currentStr
    isSyncingFromUrlRef.current = true

    // If navigated to bare /hospitals (e.g. via Navbar menu click), restore saved session filters
    if (!currentStr && !districtParam && !upazilaParam) {
      const savedQuery = sessionStorage.getItem('hospitals_filter_query')
      if (savedQuery) {
        prevParamsRef.current = savedQuery
        setSearchParams(new URLSearchParams(savedQuery), { replace: true })
        return
      }
    }

    const divId   = searchParams.get('division_id') || ''
    const distId  = searchParams.get('district_id') || ''
    const upaId   = searchParams.get('upazila_id') || ''
    const uniId   = searchParams.get('union_id') || ''
    const qSearch = searchParams.get('search') || ''
    const type    = searchParams.get('type') || ''
    const specId  = searchParams.get('specialty_id') || ''
    const beds    = searchParams.get('beds') || ''
    const emerg   = searchParams.get('emergency') === '1' || searchParams.get('emergency_24h') === '1'
    const openTod = searchParams.get('open_today') === '1'
    const qSort   = searchParams.get('sort') || 'newest'
    const nearMe  = searchParams.get('near_me') === '1' || qSort === 'nearest'
    const radius  = searchParams.get('radius') || ''

    setSelectedDivision(divId)
    setSelectedDistrict(distId)
    setSelectedUpazila(upaId)
    setSelectedUnion(uniId)
    setSearchText(qSearch)
    setAppliedSearch(qSearch)
    setHospitalType(type)
    setSelectedSpecialty(specId)
    setSelectedBeds(beds)
    setEmergencyOnly(emerg)
    setOpenTodayOnly(openTod)
    setSortBy(qSort)
    setIsNearMeActive(nearMe)
    setDistanceRadius(radius)
  }, [searchParams, setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion])

  // Synchronize state changes to URL query parameters
  useEffect(() => {
    if (isSyncingFromUrlRef.current) {
      isSyncingFromUrlRef.current = false
      return
    }

    const next = new URLSearchParams()

    const setIfVal = (key, val) => {
      if (val !== undefined && val !== null && val !== '') {
        next.set(key, String(val))
      }
    }

    setIfVal('division_id', selectedDivision)
    setIfVal('district_id', selectedDistrict)
    setIfVal('upazila_id', selectedUpazila)
    setIfVal('union_id', selectedUnion)
    setIfVal('type', hospitalType)
    setIfVal('specialty_id', selectedSpecialty)
    setIfVal('beds', selectedBeds)
    if (appliedSearch && appliedSearch.trim()) {
      next.set('search', appliedSearch.trim())
    }
    if (emergencyOnly) next.set('emergency', '1')
    if (openTodayOnly) next.set('open_today', '1')
    if (sortBy && sortBy !== 'newest') {
      next.set('sort', sortBy)
    }
    if (isNearMeActive) {
      next.set('near_me', '1')
      if (distanceRadius) next.set('radius', distanceRadius)
    }

    const currentStr = searchParams.toString()
    const nextStr = next.toString()
    if (nextStr) {
      sessionStorage.setItem('hospitals_filter_query', nextStr)
    } else {
      sessionStorage.removeItem('hospitals_filter_query')
    }
    if (currentStr !== nextStr) {
      prevParamsRef.current = nextStr
      setSearchParams(next, { replace: true })
    }
  }, [
    selectedDivision,
    selectedDistrict,
    selectedUpazila,
    selectedUnion,
    hospitalType,
    selectedSpecialty,
    selectedBeds,
    appliedSearch,
    emergencyOnly,
    openTodayOnly,
    sortBy,
    isNearMeActive,
    distanceRadius,
    searchParams,
    setSearchParams
  ])

  // Effective search keyword: only triggers when user submits search or clears it
  const effectiveSearch = appliedSearch.trim()

  const appliedFilters = useMemo(() => {
    const p = {}
    if (districtParam) {
      if (matchedDivision) {
        p.division_id = matchedDivision.id
      } else {
        p.district_slug = districtParam
      }
    }
    if (upazilaParam)              p.upazila_slug  = upazilaParam
    if (selectedDivision && !p.division_id) p.division_id   = selectedDivision
    if (selectedDistrict)          p.district_id   = selectedDistrict
    if (selectedUpazila)           p.upazila_id    = selectedUpazila
    if (selectedUnion)             p.union_id      = selectedUnion
    if (hospitalType)              p.hospital_type = hospitalType
    if (selectedSpecialty)         p.specialty_id  = selectedSpecialty
    if (selectedBeds)              p.bed_range     = selectedBeds
    if (emergencyOnly)             p.emergency_only = true
    if (openTodayOnly)             p.open_today    = true
    if (effectiveSearch)           p.search        = effectiveSearch
    if (isNearMeActive && userLocation?.latitude && userLocation?.longitude) {
      p.latitude = userLocation.latitude
      p.longitude = userLocation.longitude
      if (distanceRadius) p.radius = distanceRadius
    }
    if (sortBy)                    p.sort          = sortBy
    return p
  }, [districtParam, matchedDivision, upazilaParam, selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, hospitalType, selectedSpecialty, selectedBeds, emergencyOnly, openTodayOnly, effectiveSearch, isNearMeActive, userLocation, distanceRadius, sortBy])

  const { hospitals, total, loading, fetchingNext, hasMore, fetchMore, error, refresh } = useInfiniteHospitals(appliedFilters)

  const sortedHospitals = useMemo(() => {
    const list = [...hospitals]
    if (sortBy === 'name_asc')  return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    if (sortBy === 'name_desc') return list.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    if (sortBy === 'nearest' && userLocation?.latitude && userLocation?.longitude) {
      return list.sort((a, b) => {
        const da = a.distance_km ?? (a.latitude && a.longitude ? calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) : 999999)
        const db = b.distance_km ?? (b.latitude && b.longitude ? calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude) : 999999)
        return da - db
      })
    }
    return list
  }, [hospitals, sortBy, userLocation])

  // Helper for location display name
  const getLocName = (item, fallback) => {
    if (!item) return fallback
    if (typeof item.name === 'object' && item.name !== null) {
      return item.name.bn || item.name.en || fallback
    }
    return item.name || item.name_bn || item.bangla_name || fallback
  }

  const handleSearchChange = (val) => {
    setSearchText(val)
    window.dispatchEvent(new CustomEvent('sync-listing-search', { detail: val }))
  }

  const handleClearSearch = () => {
    setSearchText('')
    setAppliedSearch('')
    setIsDesktopTypeaheadOpen(false)
    setIsMobileTypeaheadOpen(false)
    window.dispatchEvent(new CustomEvent('sync-listing-search', { detail: '' }))
    updateUrlParams({ search: '' })
  }

  const handleSelectSearchAll = (q) => {
    setIsDesktopTypeaheadOpen(false)
    setIsMobileTypeaheadOpen(false)
    setSearchText(q)
    setAppliedSearch(q)
    setIsSearching(true)
    updateUrlParams({ search: q })
    window.dispatchEvent(new CustomEvent('sync-listing-search', { detail: q }))
    window.dispatchEvent(new CustomEvent('listing-search-loading', { detail: true }))
    setTimeout(() => {
      setIsSearching(false)
      window.dispatchEvent(new CustomEvent('listing-search-loading', { detail: false }))
    }, 600)
  }

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setIsDesktopTypeaheadOpen(false)
    setIsMobileTypeaheadOpen(false)
    setIsSearching(true)
    const q = searchText.trim()
    setAppliedSearch(q)
    updateUrlParams({ search: q })
    window.dispatchEvent(new CustomEvent('sync-listing-search', { detail: searchText }))
    window.dispatchEvent(new CustomEvent('listing-search-loading', { detail: true }))
    setTimeout(() => {
      setIsSearching(false)
      window.dispatchEvent(new CustomEvent('listing-search-loading', { detail: false }))
    }, 600)
  }

  // Real-time bidirectional search sync with sticky navbar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('listing-typeahead-active', { detail: isDesktopTypeaheadOpen }))
  }, [isDesktopTypeaheadOpen])

  useEffect(() => {
    const handleWindowScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop
      if (scrollY > 50) {
        setIsDesktopTypeaheadOpen(false)
      }
    }
    window.addEventListener('scroll', handleWindowScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleWindowScroll)
  }, [])

  useEffect(() => {
    const handleSyncFromNav = (e) => {
      if (typeof e.detail === 'string') {
        setSearchText(e.detail)
      }
    }
    const handleRequestSearch = () => {
      window.dispatchEvent(new CustomEvent('sync-listing-search', { detail: searchText }))
    }
    const handleExternalSubmit = (e) => {
      setIsSearching(true)
      const q = typeof e.detail === 'string' ? e.detail : searchText
      const trimmed = q.trim()
      setSearchText(q)
      setAppliedSearch(trimmed)
      updateUrlParams({ search: trimmed })
      setTimeout(() => setIsSearching(false), 600)
    }

    window.addEventListener('sync-nav-search', handleSyncFromNav)
    window.addEventListener('request-listing-search', handleRequestSearch)
    window.addEventListener('submit-listing-search', handleExternalSubmit)

    if (searchText) {
      window.dispatchEvent(new CustomEvent('sync-listing-search', { detail: searchText }))
    }

    return () => {
      window.removeEventListener('sync-nav-search', handleSyncFromNav)
      window.removeEventListener('request-listing-search', handleRequestSearch)
      window.removeEventListener('submit-listing-search', handleExternalSubmit)
    }
  }, [searchText, updateUrlParams])

  // Active filters list
  const activeFilters = useMemo(() => {
    const list = []
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
    if (hospitalType) {
      const item = HOSPITAL_TYPES.find(t => t.id === hospitalType)
      list.push({
        key: 'type',
        label: item ? item.label : hospitalType,
        clear: () => {
          setHospitalType('')
          updateUrlParams({ type: '' })
        }
      })
    }
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
    if (selectedBeds) {
      const item = BED_RANGES.find(b => b.id === selectedBeds)
      list.push({
        key: 'beds',
        label: item ? item.label : selectedBeds,
        clear: () => {
          setSelectedBeds('')
          updateUrlParams({ beds: '' })
        }
      })
    }
    if (emergencyOnly) {
      list.push({ key: 'emergency', label: '24/7 Emergency', clear: () => setEmergencyOnly(false) })
    }
    if (openTodayOnly) {
      list.push({ key: 'open_today', label: 'Open Today', clear: () => setOpenTodayOnly(false) })
    }
    if (isNearMeActive && userLocation?.latitude) {
      list.push({
        key: 'near_me',
        label: `নিকটবর্তী ${distanceRadius ? `(${distanceRadius} কিমি)` : ''}`,
        clear: () => {
          setIsNearMeActive(false)
          setDistanceRadius('')
          if (sortBy === 'nearest') setSortBy('newest')
          updateUrlParams({ near_me: '', radius: '', sort: '' })
        }
      })
    }
    if (appliedSearch.trim()) {
      list.push({
        key: 'search',
        label: `"${appliedSearch.trim()}"`,
        clear: handleClearSearch
      })
    }
    return list
  }, [
    selectedDivision, selectedDistrict, selectedUpazila, selectedUnion,
    hospitalType, selectedSpecialty, selectedBeds, emergencyOnly, openTodayOnly, appliedSearch,
    divisions, districts, upazilas, unions, specialties, updateUrlParams,
    isNearMeActive, userLocation, distanceRadius, sortBy
  ])

  const activeCount = activeFilters.length

  const handleClearAllFilters = () => {
    sessionStorage.removeItem('hospitals_filter_query')
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
    setAppliedSearch('')
    window.dispatchEvent(new CustomEvent('sync-listing-search', { detail: '' }))
    setIsNearMeActive(false)
    setLocationInlineError(false)
    setDistanceRadius('')
    if (sortBy === 'nearest') setSortBy('newest')
    prevParamsRef.current = ''
    setSearchParams({}, { replace: true })
  }

  // Dual-scroll and layout refs
  const headerBlockRef = useRef(null)
  const leftPaneRef = useRef(null)
  const rightPaneRef = useRef(null)
  const sentinelRef = useRef(null)

  // Infinite scroll sentinel (desktop: observe inside the results pane; mobile: observe the viewport)
  useEffect(() => {
    if (!sentinelRef.current) return
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 992
    const rootEl = isDesktop && rightPaneRef.current ? rightPaneRef.current : null
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !fetchingNext) fetchMore() },
      { root: rootEl, rootMargin: '250px', threshold: 0.05 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, fetchingNext, fetchMore])

  // Desktop wheel coordination for the dual-pane layout:
  //  - Scrolling DOWN over either pane: first scroll the page until the header block is hidden
  //    (panes then rest just below the navbar), after that the pane itself scrolls.
  //  - Scrolling UP: the pane scrolls first; once it reaches its top, the browser naturally
  //    chains the scroll to the page and the header block is revealed again.
  useEffect(() => {
    const handleWheel = (e) => {
      if (window.innerWidth < 992 || e.deltaY <= 0) return
      const leftEl = leftPaneRef.current
      const rightEl = rightPaneRef.current
      const overPane = (leftEl && leftEl.contains(e.target)) || (rightEl && rightEl.contains(e.target))
      if (!overPane) return

      const maxPageScroll = document.documentElement.scrollHeight - window.innerHeight
      const remaining = maxPageScroll - window.scrollY
      if (remaining > 1) {
        e.preventDefault()
        window.scrollBy({ top: Math.min(e.deltaY, remaining), behavior: 'auto' })
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

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

  // Dynamic SEO metadata computation for national, district, and upazila listing hubs
  const seoData = useMemo(() => {
    const districtObj = districts?.find(d => d.slug === districtParam || String(d.id) === String(selectedDistrict))
    const upazilaObj = upazilas?.find(u => u.slug === upazilaParam || String(u.id) === String(selectedUpazila))
    
    const distNameBn = districtObj?.bangla_name || districtObj?.name_bn || districtObj?.name
    const upaNameBn = upazilaObj?.bangla_name || upazilaObj?.name_bn || upazilaObj?.name
    const distNameEn = districtObj?.name || districtParam
    const upaNameEn = upazilaObj?.name || upazilaParam

    let canonicalPath = '/hospitals'
    let title = 'বাংলাদেশের সেরা হাসপাতাল ও ক্লিনিক তালিকা | MedConnect'
    let description = 'বাংলাদেশের শীর্ষস্থানীয় সরকারি ও বেসরকারি হাসপাতাল, ক্লিনিক এবং ডায়াগনস্টিক সেন্টারের তালিকা, জরুরি সেবা ও ওপিডি শিডিউল।'

    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Hospitals', url: '/hospitals' },
    ]

    if (matchedDivision) {
      const divNameBn = matchedDivision.bangla_name || matchedDivision.name_bn || matchedDivision.name
      const divNameEn = matchedDivision.name || districtParam
      canonicalPath = `/hospitals/${districtParam}`
      title = `${divNameBn || divNameEn} বিভাগ সেরা হাসপাতাল ও ক্লিনিক তালিকা | MedConnect`
      description = `${divNameBn || divNameEn} বিভাগের শীর্ষ হাসপাতাল, বিশেষজ্ঞ ডাক্তার, আইসিইউ ও জরুরি স্বাস্থ্যসেবার তালিকা।`
      breadcrumbs.push({ name: divNameEn || 'Division', url: `/hospitals/${districtParam}` })
    } else if (districtParam) {
      canonicalPath = `/hospitals/${districtParam}`
      title = `${distNameBn || distNameEn} জেলার সেরা হাসপাতাল ও ক্লিনিক তালিকা | MedConnect`
      description = `${distNameBn || distNameEn} জেলার শীর্ষ হাসপাতাল, বিশেষজ্ঞ ডাক্তার, আইসিইউ ও জরুরি এম্বুলেন্স সেবা সমূহের পূর্ণাঙ্গ তালিকা।`
      breadcrumbs.push({ name: distNameEn || 'District', url: `/hospitals/${districtParam}` })

      if (upazilaParam) {
        canonicalPath = `/hospitals/${districtParam}/${upazilaParam}`
        title = `${upaNameBn || upaNameEn}, ${distNameBn || distNameEn} — হাসপাতাল ও বিশেষজ্ঞ স্বাস্থ্যসেবা | MedConnect`
        description = `${upaNameBn || upaNameEn}, ${distNameBn || distNameEn} এলাকার সকল হাসপাতাল, ডায়াগনস্টিক সেন্টার, বেড সংখ্যা ও জরুরি সেবা সমূহের তালিকা।`
        breadcrumbs.push({ name: upaNameEn || 'Upazila', url: `/hospitals/${districtParam}/${upazilaParam}` })
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
        itemListElement: hospitals.slice(0, 12).map((hosp, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: hosp.name || hosp.name_bn,
          url: hosp.canonical_url ? `https://medconnect.com.bd${hosp.canonical_url}` : undefined,
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
  }, [districtParam, matchedDivision, upazilaParam, districts, upazilas, selectedDistrict, selectedUpazila, hospitals])

  return (
    <div className="page-wrapper hosp-page-root" style={{ background: '#F8FAFC', minHeight: '100vh', paddingTop: 'var(--header-height, 110px)', paddingBottom: 60, fontFamily: "'Inter', sans-serif" }}>
      <SeoHead
        title={seoData.title}
        description={seoData.description}
        canonicalUrl={seoData.canonicalUrl}
        schema={seoData.schema}
      />
      
      {/* ── RESPONSIVE FILTER DRAWER CSS ── */}
      <style>{`
        @keyframes hospSheetFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes hospSheetSlideUp {
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
          animation: hospSheetFadeIn 0.28s ease;
          touch-action: none;
        }

        .filter-drawer {
          background: #FFFFFF;
          width: 100%;
          max-width: 520px;
          height: 75vh;
          height: 75dvh;
          max-height: 78vh;
          border-radius: 16px 16px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.28);
          animation: hospSheetSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
          touch-action: pan-y;
          position: relative;
        }

        .hosp-sheet-drag-zone {
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

        .hosp-sheet-drag-zone:active {
          cursor: grabbing;
        }

        .hosp-sheet-drag-bar {
          width: 44px;
          height: 4.5px;
          border-radius: 999px;
          background: #CBD5E1;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .hosp-sheet-drag-zone:hover .hosp-sheet-drag-bar,
        .hosp-sheet-drag-zone:active .hosp-sheet-drag-bar {
          background: #94A3B8;
          transform: scaleY(1.2);
        }

        .hosp-mobile-sheet-header {
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
        .hosp-main-container {
          padding: 20px 24px;
        }
        .hosp-page-heading {
          font-size: 28px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }
        .hosp-results-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (max-width: 991px) {
          .hosp-main-container {
            padding: 8px 16px 20px !important;
          }
          .hosp-page-heading {
            font-size: 20px !important;
            margin-bottom: 8px !important;
          }
          .hosp-results-bar {
            margin-bottom: 10px !important;
          }
          .hosp-desktop-search {
            display: none !important;
          }
          .hosp-mobile-search-bar {
            display: block !important;
            padding: 8px 16px 4px !important;
            transition: top 0.28s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
        }
        @media (min-width: 992px) {
          .hosp-mobile-search-bar {
            display: none !important;
          }
          .hosp-main-row {
            margin: 0 !important;
          }
          .hosp-col-left {
            padding-left: 0 !important;
            padding-right: 12px !important;
          }
          .hosp-col-right {
            padding-left: 12px !important;
            padding-right: 0 !important;
          }
          /* ── Desktop dual-pane layout ──
             Both panes have a fixed height = viewport - (66px scrolled navbar + 24px gap) - 20px container bottom padding.
             The page itself only scrolls far enough to hide the header block; at that point both panes rest
             exactly 24px below the navbar, and each pane scrolls independently inside itself. */
          .hosp-page-root {
            padding-bottom: 0 !important;
          }
          .hosp-filter-sidebar,
          .hosp-results-scroll-pane {
            height: calc(100vh - 90px - 20px) !important;
            max-height: calc(100vh - 90px - 20px) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            scrollbar-width: thin;
            scrollbar-color: #CBD5E1 transparent;
          }
          .hosp-filter-sidebar {
            padding-right: 6px;
          }
          .hosp-filter-sidebar::-webkit-scrollbar {
            width: 6px;
          }
          .hosp-filter-sidebar::-webkit-scrollbar-track {
            background: transparent;
          }
          .hosp-filter-sidebar::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 99px;
          }
          .hosp-filter-sidebar::-webkit-scrollbar-thumb:hover {
            background: #94A3B8;
          }

          .hosp-results-scroll-pane {
            padding-right: 8px;
            padding-bottom: 24px;
          }
          .hosp-results-scroll-pane::-webkit-scrollbar {
            width: 6px;
          }
          .hosp-results-scroll-pane::-webkit-scrollbar-track {
            background: transparent;
          }
          .hosp-results-scroll-pane::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 99px;
          }
          .hosp-results-scroll-pane::-webkit-scrollbar-thumb:hover {
            background: #94A3B8;
          }

          .hosp-desktop-search-btn {
            background: #00B875;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 24px;
            font-weight: 800;
            font-size: 14px;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.15s ease;
            box-shadow: 0 2px 6px rgba(0, 184, 117, 0.3);
          }
          .hosp-desktop-search-btn:hover {
            background: #009E64 !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 184, 117, 0.4) !important;
          }
          .hosp-desktop-search-btn:active {
            transform: scale(0.95) !important;
            background: #008754 !important;
          }
          .hosp-desktop-search-btn:disabled {
            opacity: 0.82 !important;
            cursor: not-allowed !important;
            transform: none !important;
          }
        }
        @media (max-width: 767px) {
          .hosp-results-bar {
            margin-bottom: 8px !important;
          }
          .hosp-results-controls {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .hosp-view-toggle {
            margin-left: auto !important;
          }
        }

        /* ── Mobile Search & Filter (Matching Home & Doctors Page Design) ── */
        .hosp-mobile-search-pill {
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
        .hosp-mobile-search-pill:focus-within {
          border-color: #00B875;
          box-shadow: 0 2px 12px rgba(0, 184, 117, 0.14);
        }
        .hosp-mobile-search-icon {
          color: #00B875;
          flex-shrink: 0;
        }
        .hosp-mobile-search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13.5px;
          font-weight: 600;
          color: #1E293B;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .hosp-mobile-search-input::placeholder {
          color: #64748B;
          font-weight: 500;
          opacity: 1;
        }
        .hosp-mobile-mic-btn {
          background: none;
          border: none;
          padding: 0;
          color: #00B875;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .hosp-mobile-clear-btn {
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
        .hosp-mobile-clear-btn:hover {
          color: #475569;
        }
        .hosp-mobile-filter-btn {
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
        .hosp-mobile-filter-btn:active {
          transform: scale(0.96);
          background: #F8FAFC;
        }
        .hosp-mobile-filter-btn.active {
          border-color: #00B875;
          background: #E8F8F0;
          color: #00803D;
        }
        .hosp-mobile-filter-badge {
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
      <div className="hosp-mobile-search-bar" style={{
        position: 'sticky',
        top: 'var(--mobile-search-top, 0px)',
        zIndex: 1040,
        background: 'rgba(248, 250, 252, 0.96)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid #E2E8F0',
        padding: '10px 16px 8px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        transition: 'top 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, margin: 0 }}>
            <form onSubmit={handleSearchSubmit} style={{ margin: 0 }}>
              <div className="hosp-mobile-search-pill">
                <button
                  type="submit"
                  title="সার্চ করুন"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <IconSearch size={20} className="hosp-mobile-search-icon" />
                </button>
                <input
                  type="text"
                  placeholder={animatedPlaceholder || "হাসপাতাল, ক্লিনিক বা ধরন খুঁজুন..."}
                  value={searchText}
                  onChange={e => {
                    handleSearchChange(e.target.value)
                    setIsMobileTypeaheadOpen(true)
                  }}
                  onFocus={() => setIsMobileTypeaheadOpen(true)}
                  className="hosp-mobile-search-input"
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="hosp-mobile-clear-btn"
                    title="মুছুন"
                  >
                    <IconX size={17} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className="hosp-mobile-mic-btn"
                  title="ভয়েস সার্চ"
                >
                  <IconMicrophone size={19} />
                </button>
              </div>
            </form>

            <SearchTypeaheadDropdown
              query={searchText}
              isOpen={isMobileTypeaheadOpen}
              onClose={() => setIsMobileTypeaheadOpen(false)}
              onSelectSearchAll={handleSelectSearchAll}
              type="hospital"
            />
          </div>

          {/* Filter Icon Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className={`hosp-mobile-filter-btn ${activeCount > 0 ? 'active' : ''}`}
            title="ফিল্টার"
          >
            <IconAdjustmentsHorizontal size={22} />
            {activeCount > 0 && (
              <span className="hosp-mobile-filter-badge">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <Container fluid className="hosp-main-container" style={{ maxWidth: 1380 }}>
        
        {/* ── HEADER BLOCK (Heading, Desktop Search, Results Bar) ── */}
        <div ref={headerBlockRef} className="hosp-header-block">
          {/* ── HEADING TITLE ── */}
          <h1 className="hosp-page-heading" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {locationHeadingText ? (
              <>
                <span style={{ textTransform: 'capitalize' }}>{locationHeadingText}</span> — <span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>হাসপাতাল তালিকা</span>
              </>
            ) : (
              <span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>সকল হাসপাতাল তালিকা</span>
            )}
            <span className="d-lg-none" style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 20,
              background: '#E8F8F0',
              color: '#00803D',
              border: '1px solid #A7F3D0',
              fontFamily: "'Hind Siliguri', sans-serif",
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              verticalAlign: 'middle',
              letterSpacing: '0.01em',
              lineHeight: '1.4'
            }}>
              {(loading && sortedHospitals.length === 0) ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                  <span style={{ fontSize: 11 }}>লোড হচ্ছে...</span>
                </>
              ) : (
                `${toBengaliNumber(sortedHospitals.length)} টি হাসপাতাল`
              )}
            </span>
          </h1>

          {/* ── DESKTOP FULL WIDTH SEARCH BAR (≥992px) ── */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <form onSubmit={handleSearchSubmit} className="hosp-desktop-search" style={{
              background: 'white',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              padding: '4px 6px 4px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              marginBottom: 0
            }}>
              <button
                type="submit"
                title="সার্চ করুন"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#94A3B8'
                }}
              >
                <IconSearch size={18} />
              </button>
              <input
                type="text"
                placeholder={animatedPlaceholder || "হাসপাতাল বা ক্লিনিক খুঁজুন..."}
                value={searchText}
                onChange={e => {
                  handleSearchChange(e.target.value)
                  setIsDesktopTypeaheadOpen(true)
                }}
                onFocus={() => setIsDesktopTypeaheadOpen(true)}
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
              <button
                type="submit"
                disabled={isSearching}
                className="hosp-desktop-search-btn"
              >
                {isSearching ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    <span>Searching...</span>
                  </>
                ) : (
                  <span>Search</span>
                )}
              </button>
            </form>

            <SearchTypeaheadDropdown
              query={searchText}
              isOpen={isDesktopTypeaheadOpen}
              onClose={() => setIsDesktopTypeaheadOpen(false)}
              onSelectSearchAll={handleSelectSearchAll}
              type="hospital"
            />
          </div>

          {/* ── RESULTS SUMMARY BAR & VIEW MODE SWITCHER ── */}
          <div className="hosp-results-bar">
            {/* Desktop Count (≥992px) */}
            <div className="d-none d-lg-flex align-items-center gap-2">
              <span style={{ fontSize: 13.5, color: '#1E293B', fontWeight: 700, fontFamily: "'Hind Siliguri', sans-serif" }}>
                {(loading && sortedHospitals.length === 0) ? (
                  <span style={{ color: '#64748B' }}>লোড হচ্ছে...</span>
                ) : (
                  `${toBengaliNumber(sortedHospitals.length)} টি হাসপাতাল`
                )}
              </span>
            </div>

            <div className="hosp-results-controls" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
                    padding: '6px 10px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  <option value="newest">সর্বশেষ যুক্ত</option>
                  <option value="nearest">নিকটবর্তী হাসপাতাল</option>
                  <option value="name_asc">নাম (A - Z)</option>
                  <option value="name_desc">নাম (Z - A)</option>
                </select>
              </div>

              {/* View Mode Toggle Buttons (List :== , Grid :::) */}
              <div className="hosp-view-toggle" style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden', background: 'white', flexShrink: 0 }}>
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
        </div>

        {/* ── MAIN CONTENT AREA (LIST & GRID VIEW) ── */}
        <Row className="hosp-main-row g-4">

            {/* ── LEFT COLUMN: FILTERS PANEL (Desktop Only ≥992px) ── */}
            <Col xs={12} lg={3} className="d-none d-lg-block hosp-col-left">
              <div ref={leftPaneRef} className="hosp-filter-sidebar" style={{
                background: 'white',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                {/* Filter Sidebar Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <IconAdjustmentsHorizontal size={18} color="#0F172A" />
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Filters</h3>
                    {activeCount > 0 && total !== undefined && total !== null && (
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: '#E8F8F2',
                        color: '#009E64',
                        border: '1px solid #A7F3D0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        lineHeight: 1.4
                      }}>
                        {loading ? (
                          <span className="spinner-border spinner-border-sm" role="status" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                        ) : (
                          `${toBengaliNumber(total)}টি পাওয়া গেছে`
                        )}
                      </span>
                    )}
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
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>নিকটবর্তী হাসপাতাল</span>
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
                    <span>{isNearMeActive ? 'নিকটবর্তী সক্রিয় (বন্ধ করতে ট্যাপ করুন)' : 'আপনার কাছের হাসপাতাল খুঁজুন'}</span>
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
                            const target = document.getElementById('hosp-location-accordion-desktop')
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
                              name="desktop_hospital_distance_radius"
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
                          <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: isChecked ? '#0F172A' : '#334155', fontWeight: isChecked ? 700 : 500, userSelect: 'none' }}>
                            <CustomCheckbox
                              checked={isChecked}
                              onChange={() => setHospitalType(isChecked ? '' : t.id)}
                            />
                            <span>{t.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Accordion 2: Location */}
                <div id="hosp-location-accordion-desktop" style={{ marginBottom: 4 }}>
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
              </div>
            </Col>

            {/* ── RIGHT COLUMN: LIST / GRID HOSPITAL LISTINGS AREA ── */}
            <Col xs={12} lg={9} className="hosp-col-right">
              <div ref={rightPaneRef} className="hosp-results-scroll-pane">
                {loading && <HospitalGridSkeleton count={4} />}

                {error && !loading && (
                  <ErrorState
                    title="হাসপাতালের তথ্য লোড করা যায়নি"
                    message={error}
                    onRetry={refresh}
                    retryText="পুনরায় চেষ্টা করুন"
                    onSecondary={handleClearAllFilters}
                    secondaryText="ফিল্টার রিসেট করুন"
                  />
                )}

                {!loading && sortedHospitals.length > 0 && (
                  <>
                    {viewMode === 'grid' ? (
                      <Row className="g-3">
                        {sortedHospitals.map((h, i) => (
                          <Col key={h.id} xs={12} md={6} xl={4}>
                            <HospitalCard hospital={h} index={i} viewMode="grid" userLocation={userLocation} />
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      /* DEFAULT LIST VIEW (Matching screenshot) */
                      <div>
                        {sortedHospitals.map((h, i) => (
                          <HospitalCard key={h.id} hospital={h} index={i} viewMode="list" userLocation={userLocation} />
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
              </div>
            </Col>
          </Row>
      </Container>

      {/* ── MOBILE FILTER BOTTOM SHEET MODAL (Portal to body) ── */}
      {isMobileFilterOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={hospFilterOverlayRef}
          className="filter-drawer-backdrop"
          onClick={closeMobileFilter}
        >
          <div
            ref={hospFilterSheetRef}
            className="filter-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Indicator Handle Bar (Swipe down to dismiss) */}
            <div
              className="hosp-sheet-drag-zone"
              onTouchStart={handleHospSheetTouchStart}
              onTouchMove={handleHospSheetTouchMove}
              onTouchEnd={handleHospSheetTouchEnd}
            >
              <div className="hosp-sheet-drag-bar" />
            </div>

            {/* Sheet Header (Swipeable, with filter count badge, without close X button per design preference) */}
            <div
              className="hosp-mobile-sheet-header"
              onTouchStart={handleHospSheetTouchStart}
              onTouchMove={handleHospSheetTouchMove}
              onTouchEnd={handleHospSheetTouchEnd}
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
                    পছন্দের ধরন, অবস্থান বা দূরত্ব ফিল্টার করুন
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeMobileFilter}
                  aria-label="Close"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#F1F5F9',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#E2E8F0'
                    e.currentTarget.style.color = '#0F172A'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F1F5F9'
                    e.currentTarget.style.color = '#475569'
                  }}
                >
                  <IconX size={19} stroke={2.2} />
                </button>
              </div>
            </div>

        {/* Drawer Scroll Body */}
        <div className="drawer-scroll-body">
            {/* Near Me & Distance (Mobile) */}
            <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>নিকটবর্তী হাসপাতাল</span>
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
                <span>{isNearMeActive ? 'নিকটবর্তী সক্রিয় (বন্ধ করতে ট্যাপ করুন)' : 'আপনার কাছের হাসপাতাল খুঁজুন'}</span>
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
                        const target = document.getElementById('hosp-location-section-mobile')
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

            {/* Hospital Type */}
            <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>হাসপাতাল ধরন</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {HOSPITAL_TYPES.map(t => {
                  const isChecked = hospitalType === t.id
                  return (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: isChecked ? '#0F172A' : '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif", userSelect: 'none' }}>
                      <CustomCheckbox
                        checked={isChecked}
                        onChange={() => setHospitalType(isChecked ? '' : t.id)}
                      />
                      <span>{t.icon} {t.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Location */}
            <div id="hosp-location-section-mobile" style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
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
        entityType="hospital"
        onSuccess={handleLocationBannerSuccess}
      />
    </div>
  )
}

export default HospitalsPage

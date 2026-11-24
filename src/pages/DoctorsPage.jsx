import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Container, Row, Col, Modal } from 'react-bootstrap'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'

import DoctorCard from '../components/common/DoctorCard'
import CustomCheckbox from '../components/common/CustomCheckbox'
import ErrorState from '../components/common/ErrorState'
import { DoctorGridSkeleton } from '../components/common/Skeletons'
import SeoHead from '../components/common/SeoHead'
import DoctorDetailPage from './DoctorDetailPage'
import AvailabilityDateFilter from '../components/common/AvailabilityDateFilter'
import SearchTypeaheadDropdown from '../components/common/SearchTypeaheadDropdown'
import useInfiniteDoctors from '../hooks/useInfiniteDoctors'
import useLocations from '../hooks/useLocations'
import useSpecialties from '../hooks/useSpecialties'
import useHospitals from '../hooks/useHospitals'
import { useQuery } from '@tanstack/react-query'
import { getHospitalById } from '../api/hospitalApi'
import useDebounce from '../hooks/useDebounce'
import { useTypewriter } from '../hooks/useTypewriter'

const DOCTOR_SEARCH_PHRASES_DESKTOP = [
  'ডাক্তারের নাম লিখুন... (যেমন: ডাঃ শফিকুল ইসলাম)',
  'বিশেষজ্ঞতা দিয়ে খুঁজুন... (যেমন: মেডিসিন, হৃদরোগ)',
  'হাসপাতাল লিখুন... (যেমন: স্কয়ার, পপুলার)',
  'এলাকা বা শহর দিয়ে খুঁজুন... (যেমন: ধানমন্ডি, সিলেট)',
  'ডাক্তার, বিশেষজ্ঞতা বা হাসপাতাল খুঁজুন...'
]

const DOCTOR_SEARCH_PHRASES_MOBILE = [
  'ডাক্তার খুঁজুন... (মেডিসিন)',
  'ডাক্তারের নাম লিখুন...',
  'হাসপাতাল খুঁজুন... (স্কয়ার)',
  'বিশেষজ্ঞতা দিয়ে খুঁজুন...',
  'এলাকা খুঁজুন... (ধানমন্ডি)'
]
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
  const navigate = useNavigate()
  const [isDesktopTypeaheadOpen, setIsDesktopTypeaheadOpen] = useState(false)
  const [isMobileTypeaheadOpen, setIsMobileTypeaheadOpen] = useState(false)
  const desktopPlaceholder = useTypewriter(DOCTOR_SEARCH_PHRASES_DESKTOP, 70, 35, 1800)
  const mobilePlaceholder = useTypewriter(DOCTOR_SEARCH_PHRASES_MOBILE, 70, 35, 1800)

  // 1-segment legacy fallback disambiguation:
  // If route matched /doctors/:district and the token is purely numeric or ULID, delegate to DoctorDetailPage
  const isLegacyIdentifier = !upazilaParam && (
    districtParam && (/^\d+$/.test(districtParam) || (districtParam.length === 26 && /^[0-9A-HJ-KM-NP-TV-Z]+$/i.test(districtParam)))
  )

  if (isLegacyIdentifier) {
    return <DoctorDetailPage />
  }

  const getInitialDoctorParam = (key) => {
    const fromUrl = searchParams.get(key)
    if (fromUrl !== null && fromUrl !== undefined && fromUrl !== '') return fromUrl
    if (!districtParam && !upazilaParam) {
      try {
        const saved = sessionStorage.getItem('doctors_filter_query')
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
    setAllLocations,
  } = useLocations({
    division_id: getInitialDoctorParam('division_id'),
    district_id: getInitialDoctorParam('district_id'),
    upazila_id: getInitialDoctorParam('upazila_id'),
    union_id: getInitialDoctorParam('union_id')
  })

  const { specialties } = useSpecialties()

  const [selectedSpecialty, setSelectedSpecialty] = useState(() => getInitialDoctorParam('specialty_id'))
  const [selectedHospital, setSelectedHospital]   = useState(() => {
    const h = getInitialDoctorParam('hospital_id')
    return (h && h !== 'undefined') ? h : ''
  })

  const { hospitals } = useHospitals({ per_page: 200 })
  const [hospitalSearch, setHospitalSearch] = useState('')

  // Auto-resolve department/specialty name or slug from URL to specialty_id (e.g. from homepage department clicks)
  useEffect(() => {
    const rawDept = searchParams.get('department') || searchParams.get('specialty') || searchParams.get('specialty_name')
    if (!selectedSpecialty && rawDept && specialties?.length > 0) {
      const clean = rawDept.trim().toLowerCase()
      const match = specialties.find(s => 
        String(s.id) === clean ||
        (s.slug || '').toLowerCase() === clean ||
        (s.name_bn || '').trim().toLowerCase() === clean ||
        (s.bangla_name || '').trim().toLowerCase() === clean ||
        (s.name || '').trim().toLowerCase() === clean
      )
      if (match) {
        setSelectedSpecialty(String(match.id))
      }
    }
  }, [searchParams, specialties, selectedSpecialty])

  const filteredHospitals = useMemo(() => {
    if (!hospitals || hospitals.length === 0) return []
    let list = hospitals
    if (!hospitalSearch.trim()) return list
    const q = hospitalSearch.trim().toLowerCase()
    return list.filter(h => 
      (h.name || '').toLowerCase().includes(q) || 
      (h.name_bn || '').toLowerCase().includes(q)
    )
  }, [hospitals, hospitalSearch])

  // Lazy single-item fetch for active hospital filter badge ONLY when hospital_id filter is active
  const { data: selectedHospitalData } = useQuery({
    queryKey: ['hospital-badge', selectedHospital],
    queryFn: async () => {
      if (!selectedHospital) return null
      const res = await getHospitalById(selectedHospital)
      return res.data?.data || res.data || null
    },
    enabled: Boolean(selectedHospital && selectedHospital !== 'undefined'),
    staleTime: 10 * 60 * 1000,
  })

  const [selectedFee, setSelectedFee]             = useState(() => getInitialDoctorParam('fee_range'))
  const [selectedExp, setSelectedExp]             = useState(() => getInitialDoctorParam('exp_range'))
  const [selectedDate, setSelectedDate]           = useState(() => getInitialDoctorParam('date'))
  const [searchText, setSearchText]               = useState(() => getInitialDoctorParam('search'))
  const [appliedSearch, setAppliedSearch]         = useState(() => getInitialDoctorParam('search'))
  const [isSearching, setIsSearching]             = useState(false)
  const debouncedSearchText                       = useDebounce(searchText, 350)
  const [availableToday, setAvailableToday]       = useState(() => {
    const at = getInitialDoctorParam('available_today')
    return at === '1' || at === 'true'
  })
  const [telemedicineOnly, setTelemedicineOnly]   = useState(() => {
    const tm = getInitialDoctorParam('telemedicine')
    return tm === '1' || tm === 'true' || getInitialDoctorParam('available_telemedicine') === 'yes'
  })
  const [specialtySearch, setSpecialtySearch]     = useState('')

  const [isAllSpecialtiesModalOpen, setIsAllSpecialtiesModalOpen] = useState(false)
  const [modalSpecialtySearch, setModalSpecialtySearch]         = useState('')
  const [isAllSpecExpanded, setIsAllSpecExpanded]               = useState(false)
  const isAllSpecExpandedRef                                    = useRef(false)
  const lastAllSpecDragEndTimeRef                               = useRef(0)
  const allSpecSheetRef                                         = useRef(null)
  const allSpecOverlayRef                                       = useRef(null)
  const allSpecBodyRef                                          = useRef(null)

  useEffect(() => {
    isAllSpecExpandedRef.current = isAllSpecExpanded
  }, [isAllSpecExpanded])

  const closeAllSpecialtiesModal = useCallback(() => {
    if (allSpecSheetRef.current) {
      allSpecSheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
      allSpecSheetRef.current.style.transform = 'translateY(100%)'
    }
    if (allSpecOverlayRef.current) {
      allSpecOverlayRef.current.style.transition = 'opacity 0.25s ease'
      allSpecOverlayRef.current.style.opacity = '0'
    }
    setTimeout(() => {
      setIsAllSpecialtiesModalOpen(false)
      setIsAllSpecExpanded(false)
      isAllSpecExpandedRef.current = false
      setModalSpecialtySearch('')
      if (allSpecSheetRef.current) {
        allSpecSheetRef.current.style.transform = ''
        allSpecSheetRef.current.style.height = ''
        allSpecSheetRef.current.style.maxHeight = ''
        allSpecSheetRef.current.style.transition = ''
      }
    }, 260)
  }, [])

  // ── YOUTUBE / FB STYLE 2-STAGE SNAP GESTURES FOR ALL SPECIALTIES DRAWER ──
  useEffect(() => {
    if (!isAllSpecialtiesModalOpen) return
    const sheet = allSpecSheetRef.current
    const overlay = allSpecOverlayRef.current
    const body = allSpecBodyRef.current
    if (!sheet) return

    let startY = 0
    let startX = 0
    let initialHeight = 0
    let isDragging = false
    let dragMode = null // 'expand' | 'collapse' | 'dismiss'
    let startScrollTop = 0
    let isHandleTouch = false
    let currentDeltaY = 0

    const getMinHeight = () => Math.round(window.innerHeight * 0.70)
    const getMaxHeight = () => Math.round(window.innerHeight * 0.92)

    // Touch
    const handleTouchStart = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type === 'text') return
      if (e.target.closest('button') || e.target.closest('a')) return

      const touch = e.touches[0]
      startY = touch.clientY
      startX = touch.clientX
      currentDeltaY = 0

      isHandleTouch = Boolean(
        e.target.closest('.doc-sheet-drag-zone') ||
        e.target.closest('.all-spec-sheet-header')
      )

      const isInsideBody = body && body.contains(e.target)
      startScrollTop = isInsideBody ? body.scrollTop : 0

      initialHeight = sheet.getBoundingClientRect().height
      isDragging = false
      dragMode = null
    }

    const handleTouchMove = (e) => {
      if (e.touches.length > 1) return
      const touch = e.touches[0]
      const deltaY = touch.clientY - startY
      const deltaX = touch.clientX - startX

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10 && !isDragging) return

      const minH = getMinHeight()
      const maxH = getMaxHeight()
      const isExpanded = isAllSpecExpandedRef.current

      // Drag up: only expand from handle/header
      if (deltaY < -5) {
        if (!isExpanded && isHandleTouch) {
          if (e.cancelable) e.preventDefault()
          isDragging = true
          dragMode = 'expand'
          currentDeltaY = deltaY
          const targetH = Math.min(maxH, initialHeight - deltaY)
          sheet.style.transition = 'none'
          sheet.style.height = `${targetH}px`
          sheet.style.maxHeight = `${targetH}px`
          sheet.style.transform = ''
        }
      }
      // Drag down
      else if (deltaY > 5) {
        if (isExpanded) {
          if (isHandleTouch || startScrollTop <= 0) {
            if (e.cancelable) e.preventDefault()
            isDragging = true
            dragMode = 'collapse'
            currentDeltaY = deltaY
            const targetH = Math.max(minH, initialHeight - deltaY)
            sheet.style.transition = 'none'
            sheet.style.height = `${targetH}px`
            sheet.style.maxHeight = `${targetH}px`
            sheet.style.transform = ''
          }
        } else {
          if (isHandleTouch || startScrollTop <= 0) {
            if (e.cancelable) e.preventDefault()
            isDragging = true
            dragMode = 'dismiss'
            currentDeltaY = deltaY
            sheet.style.transition = 'none'
            sheet.style.transform = `translateY(${deltaY}px)`
            if (overlay) {
              overlay.style.opacity = Math.max(0, 1 - deltaY / 300)
            }
          }
        }
      }
    }

    const handleTouchEnd = (e) => {
      if (!isDragging) return
      isDragging = false
      lastAllSpecDragEndTimeRef.current = Date.now()

      const endTouch = e.changedTouches ? e.changedTouches[0] : null
      const finalDeltaY = Math.abs(currentDeltaY) > 0 ? currentDeltaY : (endTouch ? endTouch.clientY - startY : 0)

      if (dragMode === 'expand') {
        sheet.style.transition = 'height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
        if (finalDeltaY < -30) {
          sheet.style.height = '92dvh'
          sheet.style.maxHeight = '92dvh'
          setIsAllSpecExpanded(true)
          isAllSpecExpandedRef.current = true
        } else {
          sheet.style.height = '70dvh'
          sheet.style.maxHeight = '70dvh'
          setIsAllSpecExpanded(false)
          isAllSpecExpandedRef.current = false
        }
      } else if (dragMode === 'collapse') {
        sheet.style.transition = 'height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
        if (finalDeltaY > 35) {
          sheet.style.height = '70dvh'
          sheet.style.maxHeight = '70dvh'
          setIsAllSpecExpanded(false)
          isAllSpecExpandedRef.current = false
        } else {
          sheet.style.height = '92dvh'
          sheet.style.maxHeight = '92dvh'
          setIsAllSpecExpanded(true)
          isAllSpecExpandedRef.current = true
        }
      } else if (dragMode === 'dismiss') {
        if (finalDeltaY > 55) {
          closeAllSpecialtiesModal()
        } else {
          sheet.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
          sheet.style.transform = ''
          if (overlay) {
            overlay.style.transition = 'opacity 0.28s ease'
            overlay.style.opacity = '1'
          }
        }
      }
    }

    // Mouse
    const handleMouseDown = (e) => {
      if (e.button !== 0) return
      if (e.target.tagName === 'INPUT' && e.target.type === 'text') return
      if (e.target.closest('button') || e.target.closest('a')) return

      startY = e.clientY
      startX = e.clientX
      currentDeltaY = 0

      isHandleTouch = Boolean(
        e.target.closest('.doc-sheet-drag-zone') ||
        e.target.closest('.all-spec-sheet-header')
      )

      const isInsideBody = body && body.contains(e.target)
      startScrollTop = isInsideBody ? body.scrollTop : 0

      initialHeight = sheet.getBoundingClientRect().height
      isDragging = false
      dragMode = null

      const handleMouseMove = (moveEvent) => {
        const deltaY = moveEvent.clientY - startY
        const deltaX = moveEvent.clientX - startX

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10 && !isDragging) return

        const minH = getMinHeight()
        const maxH = getMaxHeight()
        const isExpanded = isAllSpecExpandedRef.current

        if (deltaY < -5) {
          if (!isExpanded && isHandleTouch) {
            moveEvent.preventDefault()
            isDragging = true
            dragMode = 'expand'
            currentDeltaY = deltaY
            const targetH = Math.min(maxH, initialHeight - deltaY)
            sheet.style.transition = 'none'
            sheet.style.height = `${targetH}px`
            sheet.style.maxHeight = `${targetH}px`
            sheet.style.transform = ''
          }
        } else if (deltaY > 5) {
          if (isExpanded) {
            if (isHandleTouch || startScrollTop <= 0) {
              moveEvent.preventDefault()
              isDragging = true
              dragMode = 'collapse'
              currentDeltaY = deltaY
              const targetH = Math.max(minH, initialHeight - deltaY)
              sheet.style.transition = 'none'
              sheet.style.height = `${targetH}px`
              sheet.style.maxHeight = `${targetH}px`
              sheet.style.transform = ''
            }
          } else {
            if (isHandleTouch || startScrollTop <= 0) {
              moveEvent.preventDefault()
              isDragging = true
              dragMode = 'dismiss'
              currentDeltaY = deltaY
              sheet.style.transition = 'none'
              sheet.style.transform = `translateY(${deltaY}px)`
              if (overlay) {
                overlay.style.opacity = Math.max(0, 1 - deltaY / 300)
              }
            }
          }
        }
      }

      const handleMouseUp = (upEvent) => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)

        if (!isDragging) return
        isDragging = false
        lastAllSpecDragEndTimeRef.current = Date.now()

        const finalDeltaY = Math.abs(currentDeltaY) > 0 ? currentDeltaY : (upEvent.clientY - startY)

        if (dragMode === 'expand') {
          sheet.style.transition = 'height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
          if (finalDeltaY < -30) {
            sheet.style.height = '92dvh'
            sheet.style.maxHeight = '92dvh'
            setIsAllSpecExpanded(true)
            isAllSpecExpandedRef.current = true
          } else {
            sheet.style.height = '70dvh'
            sheet.style.maxHeight = '70dvh'
            setIsAllSpecExpanded(false)
            isAllSpecExpandedRef.current = false
          }
        } else if (dragMode === 'collapse') {
          sheet.style.transition = 'height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
          if (finalDeltaY > 35) {
            sheet.style.height = '70dvh'
            sheet.style.maxHeight = '70dvh'
            setIsAllSpecExpanded(false)
            isAllSpecExpandedRef.current = false
          } else {
            sheet.style.height = '92dvh'
            sheet.style.maxHeight = '92dvh'
            setIsAllSpecExpanded(true)
            isAllSpecExpandedRef.current = true
          }
        } else if (dragMode === 'dismiss') {
          if (finalDeltaY > 55) {
            closeAllSpecialtiesModal()
          } else {
            sheet.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
            sheet.style.transform = ''
            if (overlay) {
              overlay.style.transition = 'opacity 0.28s ease'
              overlay.style.opacity = '1'
            }
          }
        }
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true })
    sheet.addEventListener('touchmove', handleTouchMove, { passive: false })
    sheet.addEventListener('touchend', handleTouchEnd, { passive: true })
    sheet.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    sheet.addEventListener('mousedown', handleMouseDown)

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart)
      sheet.removeEventListener('touchmove', handleTouchMove)
      sheet.removeEventListener('touchend', handleTouchEnd)
      sheet.removeEventListener('touchcancel', handleTouchEnd)
      sheet.removeEventListener('mousedown', handleMouseDown)
    }
  }, [isAllSpecialtiesModalOpen, closeAllSpecialtiesModal])

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

  const [sortBy, setSortBy]   = useState(() => getInitialDoctorParam('sort') || 'relevance')

  const {
    location: userLocation,
    loading: locationLoading,
    requestLocation,
    hasLocation,
    error: locationError,
    permissionStatus,
  } = useUserLocation()

  const [isNearMeActive, setIsNearMeActive] = useState(() => {
    return getInitialDoctorParam('near_me') === '1' || getInitialDoctorParam('sort') === 'nearest'
  })
  const [locationInlineError, setLocationInlineError] = useState(false)
  const [distanceRadius, setDistanceRadius] = useState(() => getInitialDoctorParam('radius') || '')

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
  const [isDocSheetExpanded, setIsDocSheetExpanded] = useState(false)
  const isDocSheetExpandedRef = useRef(false)
  const lastDocDragEndTimeRef = useRef(0)

  useEffect(() => {
    isDocSheetExpandedRef.current = isDocSheetExpanded
  }, [isDocSheetExpanded])

  // Mobile Filter Bottom Sheet Drag & Expand Gestures (Smooth real-time touch tracking)
  const docFilterSheetRef = useRef(null)
  const docFilterOverlayRef = useRef(null)
  const docScrollBodyRef = useRef(null)

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
      setIsDocSheetExpanded(false)
      isDocSheetExpandedRef.current = false
      if (docFilterSheetRef.current) {
        docFilterSheetRef.current.style.transform = ''
        docFilterSheetRef.current.style.height = ''
        docFilterSheetRef.current.style.maxHeight = ''
        docFilterSheetRef.current.style.transition = ''
      }
    }, 260)
  }, [])

  // ── YOUTUBE / FB STYLE BOTTOM SHEET GESTURES (2-STAGE SNAP: 70dvh <-> 92dvh, NO CONTENT-SCROLL EXPANSION, SWIPE DOWN TO RESTORE THEN CLOSE) ──
  useEffect(() => {
    if (!isMobileFilterOpen) return
    const sheet = docFilterSheetRef.current
    const scrollBody = docScrollBodyRef.current
    const overlay = docFilterOverlayRef.current
    if (!sheet) return

    let startY = 0
    let startX = 0
    let initialHeight = 0
    let isDragging = false
    let dragMode = null // 'expand' | 'collapse' | 'dismiss'
    let startScrollTop = 0
    let isHandleTouch = false
    let currentDeltaY = 0

    const getMinHeight = () => Math.round(window.innerHeight * 0.70)
    const getMaxHeight = () => Math.round(window.innerHeight * 0.92)

    // ── TOUCH GESTURES (Mobile / Touch Devices) ──
    const handleTouchStart = (e) => {
      // Don't intercept if user is typing or clicking buttons
      if (e.target.tagName === 'INPUT' && e.target.type === 'text') return
      if (e.target.closest('button') || e.target.closest('a')) return

      const touch = e.touches[0]
      startY = touch.clientY
      startX = touch.clientX
      currentDeltaY = 0

      // Drag can be initiated from the top drag handle bar or the top sheet header
      isHandleTouch = Boolean(
        e.target.closest('.doc-sheet-drag-zone') ||
        e.target.closest('.doc-mobile-sheet-header')
      )

      const isInsideScrollBody = scrollBody && scrollBody.contains(e.target)
      startScrollTop = isInsideScrollBody ? scrollBody.scrollTop : 0

      initialHeight = sheet.getBoundingClientRect().height
      isDragging = false
      dragMode = null
    }

    const handleTouchMove = (e) => {
      if (e.touches.length > 1) return
      const touch = e.touches[0]
      const deltaY = touch.clientY - startY
      const deltaX = touch.clientX - startX

      // Ignore horizontal scrolls
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10 && !isDragging) return

      const minH = getMinHeight()
      const maxH = getMaxHeight()
      const isExpanded = isDocSheetExpandedRef.current

      // 1. DRAG UP (deltaY < -5):
      // YouTube style: ONLY dragging the top bar/handle expands drawer to 92dvh. Scrolling inside content does NOT expand!
      if (deltaY < -5) {
        if (!isExpanded && isHandleTouch) {
          if (e.cancelable) e.preventDefault()
          isDragging = true
          dragMode = 'expand'
          currentDeltaY = deltaY
          const targetH = Math.min(maxH, initialHeight - deltaY)
          sheet.style.transition = 'none'
          sheet.style.height = `${targetH}px`
          sheet.style.maxHeight = `${targetH}px`
          sheet.style.transform = ''
        }
      }

      // 2. DRAG DOWN (deltaY > 5):
      else if (deltaY > 5) {
        // Stage 2 (When already expanded at 92dvh): Pulling down collapses back to normal 70dvh without closing!
        if (isExpanded) {
          if (isHandleTouch || startScrollTop <= 0) {
            if (e.cancelable) e.preventDefault()
            isDragging = true
            dragMode = 'collapse'
            currentDeltaY = deltaY
            const targetH = Math.max(minH, initialHeight - deltaY)
            sheet.style.transition = 'none'
            sheet.style.height = `${targetH}px`
            sheet.style.maxHeight = `${targetH}px`
            sheet.style.transform = ''
          }
        }
        // Stage 1 (When at normal 70dvh): Pulling down dismisses / closes drawer
        else {
          if (isHandleTouch || startScrollTop <= 0) {
            if (e.cancelable) e.preventDefault()
            isDragging = true
            dragMode = 'dismiss'
            currentDeltaY = deltaY
            sheet.style.transition = 'none'
            sheet.style.transform = `translateY(${deltaY}px)`
            if (overlay) {
              overlay.style.opacity = Math.max(0, 1 - deltaY / 300)
            }
          }
        }
      }
    }

    const handleTouchEnd = (e) => {
      if (!isDragging) return
      isDragging = false
      lastDocDragEndTimeRef.current = Date.now()

      const endTouch = e.changedTouches ? e.changedTouches[0] : null
      const finalDeltaY = Math.abs(currentDeltaY) > 0 ? currentDeltaY : (endTouch ? endTouch.clientY - startY : 0)

      if (dragMode === 'expand') {
        sheet.style.transition = 'height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
        if (finalDeltaY < -30) {
          sheet.style.height = '92dvh'
          sheet.style.maxHeight = '92dvh'
          setIsDocSheetExpanded(true)
          isDocSheetExpandedRef.current = true
        } else {
          sheet.style.height = '70dvh'
          sheet.style.maxHeight = '70dvh'
          setIsDocSheetExpanded(false)
          isDocSheetExpandedRef.current = false
        }
      } else if (dragMode === 'collapse') {
        sheet.style.transition = 'height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
        if (finalDeltaY > 35) {
          sheet.style.height = '70dvh'
          sheet.style.maxHeight = '70dvh'
          setIsDocSheetExpanded(false)
          isDocSheetExpandedRef.current = false
        } else {
          sheet.style.height = '92dvh'
          sheet.style.maxHeight = '92dvh'
          setIsDocSheetExpanded(true)
          isDocSheetExpandedRef.current = true
        }
      } else if (dragMode === 'dismiss') {
        if (finalDeltaY > 55) {
          closeMobileFilter()
        } else {
          sheet.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
          sheet.style.transform = ''
          if (overlay) {
            overlay.style.transition = 'opacity 0.28s ease'
            overlay.style.opacity = '1'
          }
        }
      }
    }

    // ── MOUSE GESTURES (Desktop DevTools mobile mode / mouse drag) ──
    const handleMouseDown = (e) => {
      if (e.button !== 0) return
      if (e.target.tagName === 'INPUT' && e.target.type === 'text') return
      if (e.target.closest('button') || e.target.closest('a')) return

      startY = e.clientY
      startX = e.clientX
      currentDeltaY = 0

      isHandleTouch = Boolean(
        e.target.closest('.doc-sheet-drag-zone') ||
        e.target.closest('.doc-mobile-sheet-header')
      )

      const isInsideScrollBody = scrollBody && scrollBody.contains(e.target)
      startScrollTop = isInsideScrollBody ? scrollBody.scrollTop : 0

      initialHeight = sheet.getBoundingClientRect().height
      isDragging = false
      dragMode = null

      const handleMouseMove = (moveEvent) => {
        const deltaY = moveEvent.clientY - startY
        const deltaX = moveEvent.clientX - startX

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10 && !isDragging) return

        const minH = getMinHeight()
        const maxH = getMaxHeight()
        const isExpanded = isDocSheetExpandedRef.current

        if (deltaY < -5) {
          if (!isExpanded && isHandleTouch) {
            moveEvent.preventDefault()
            isDragging = true
            dragMode = 'expand'
            currentDeltaY = deltaY
            const targetH = Math.min(maxH, initialHeight - deltaY)
            sheet.style.transition = 'none'
            sheet.style.height = `${targetH}px`
            sheet.style.maxHeight = `${targetH}px`
            sheet.style.transform = ''
          }
        } else if (deltaY > 5) {
          if (isExpanded) {
            if (isHandleTouch || startScrollTop <= 0) {
              moveEvent.preventDefault()
              isDragging = true
              dragMode = 'collapse'
              currentDeltaY = deltaY
              const targetH = Math.max(minH, initialHeight - deltaY)
              sheet.style.transition = 'none'
              sheet.style.height = `${targetH}px`
              sheet.style.maxHeight = `${targetH}px`
              sheet.style.transform = ''
            }
          } else {
            if (isHandleTouch || startScrollTop <= 0) {
              moveEvent.preventDefault()
              isDragging = true
              dragMode = 'dismiss'
              currentDeltaY = deltaY
              sheet.style.transition = 'none'
              sheet.style.transform = `translateY(${deltaY}px)`
              if (overlay) {
                overlay.style.opacity = Math.max(0, 1 - deltaY / 300)
              }
            }
          }
        }
      }

      const handleMouseUp = (upEvent) => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)

        if (!isDragging) return
        isDragging = false
        lastDocDragEndTimeRef.current = Date.now()

        const finalDeltaY = Math.abs(currentDeltaY) > 0 ? currentDeltaY : (upEvent.clientY - startY)

        if (dragMode === 'expand') {
          sheet.style.transition = 'height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
          if (finalDeltaY < -30) {
            sheet.style.height = '92dvh'
            sheet.style.maxHeight = '92dvh'
            setIsDocSheetExpanded(true)
            isDocSheetExpandedRef.current = true
          } else {
            sheet.style.height = '70dvh'
            sheet.style.maxHeight = '70dvh'
            setIsDocSheetExpanded(false)
            isDocSheetExpandedRef.current = false
          }
        } else if (dragMode === 'collapse') {
          sheet.style.transition = 'height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
          if (finalDeltaY > 35) {
            sheet.style.height = '70dvh'
            sheet.style.maxHeight = '70dvh'
            setIsDocSheetExpanded(false)
            isDocSheetExpandedRef.current = false
          } else {
            sheet.style.height = '92dvh'
            sheet.style.maxHeight = '92dvh'
            setIsDocSheetExpanded(true)
            isDocSheetExpandedRef.current = true
          }
        } else if (dragMode === 'dismiss') {
          if (finalDeltaY > 55) {
            closeMobileFilter()
          } else {
            sheet.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
            sheet.style.transform = ''
            if (overlay) {
              overlay.style.transition = 'opacity 0.28s ease'
              overlay.style.opacity = '1'
            }
          }
        }
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true })
    sheet.addEventListener('touchmove', handleTouchMove, { passive: false })
    sheet.addEventListener('touchend', handleTouchEnd, { passive: true })
    sheet.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    sheet.addEventListener('mousedown', handleMouseDown)

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart)
      sheet.removeEventListener('touchmove', handleTouchMove)
      sheet.removeEventListener('touchend', handleTouchEnd)
      sheet.removeEventListener('touchcancel', handleTouchEnd)
      sheet.removeEventListener('mousedown', handleMouseDown)
    }
  }, [isMobileFilterOpen, closeMobileFilter])

  // Prevent background scroll when mobile filter bottom sheet or specialties drawer is open
  useEffect(() => {
    if (isMobileFilterOpen || isAllSpecialtiesModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileFilterOpen, isAllSpecialtiesModalOpen])

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState({
    distance: true,
    specialty: true,
    hospital: true,
    location: true,
    fee: true,
    exp: false,
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

  // Date filter change handler
  const handleDateChange = useCallback((dateVal) => {
    setSelectedDate(dateVal)
    updateUrlParams({ date: dateVal })
  }, [updateUrlParams])

  // Flag to avoid loop when syncing internal state FROM external URL navigation
  const isSyncingFromUrlRef = useRef(false)

  // On mount, restore saved filters from sessionStorage if visiting bare /doctors
  useEffect(() => {
    if (!searchParams.toString() && !districtParam && !upazilaParam) {
      const savedQuery = sessionStorage.getItem('doctors_filter_query')
      if (savedQuery) {
        prevParamsRef.current = savedQuery
        setSearchParams(new URLSearchParams(savedQuery), { replace: true })
      }
    }
  }, [])

  // Sync state when URL params change from external navigation (e.g. Browser Back / Forward)
  useEffect(() => {
    const currentStr = searchParams.toString()
    if (prevParamsRef.current === currentStr) return
    prevParamsRef.current = currentStr
    isSyncingFromUrlRef.current = true

    // If navigated to bare /doctors (e.g. via Navbar menu click), restore saved session filters
    if (!currentStr && !districtParam && !upazilaParam) {
      const savedQuery = sessionStorage.getItem('doctors_filter_query')
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
    const specId  = searchParams.get('specialty_id') || ''
    const rawDept = searchParams.get('department') || searchParams.get('specialty') || searchParams.get('specialty_name') || ''
    const hospId  = (searchParams.get('hospital_id') && searchParams.get('hospital_id') !== 'undefined') ? searchParams.get('hospital_id') : ''
    const fee     = searchParams.get('fee_range') || ''
    const exp     = searchParams.get('exp_range') || ''
    const qDate   = searchParams.get('date') || ''
    const availToday = searchParams.get('available_today') === '1' || searchParams.get('available_today') === 'true'
    const teleOnly   = searchParams.get('telemedicine') === '1' || searchParams.get('available_telemedicine') === 'yes'
    const qSort      = searchParams.get('sort') || 'relevance'
    const nearMe     = searchParams.get('near_me') === '1' || qSort === 'nearest'
    const radius     = searchParams.get('radius') || ''

    setAllLocations({ division_id: divId, district_id: distId, upazila_id: upaId, union_id: uniId })
    setSearchText(qSearch)
    setAppliedSearch(qSearch)
    if (specId) {
      setSelectedSpecialty(specId)
    } else if (rawDept && specialties?.length > 0) {
      const clean = rawDept.trim().toLowerCase()
      const match = specialties.find(s => 
        String(s.id) === clean ||
        (s.slug || '').toLowerCase() === clean ||
        (s.name_bn || '').trim().toLowerCase() === clean ||
        (s.bangla_name || '').trim().toLowerCase() === clean ||
        (s.name || '').trim().toLowerCase() === clean
      )
      if (match) setSelectedSpecialty(String(match.id))
      else setSelectedSpecialty('')
    } else {
      setSelectedSpecialty('')
    }
    setSelectedHospital(hospId)
    setSelectedFee(fee)
    setSelectedExp(exp)
    setSelectedDate(qDate)
    setAvailableToday(availToday)
    setTelemedicineOnly(teleOnly)
    setSortBy(qSort)
    setIsNearMeActive(nearMe)
    setDistanceRadius(radius)
  }, [searchParams, setAllLocations, specialties])

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
    setIfVal('specialty_id', selectedSpecialty)
    setIfVal('hospital_id', selectedHospital)
    setIfVal('fee_range', selectedFee)
    setIfVal('exp_range', selectedExp)
    setIfVal('date', selectedDate)
    if (appliedSearch && appliedSearch.trim()) {
      next.set('search', appliedSearch.trim())
    }
    if (availableToday) next.set('available_today', '1')
    if (telemedicineOnly) next.set('telemedicine', '1')
    if (sortBy && sortBy !== 'relevance') {
      next.set('sort', sortBy)
    }
    if (isNearMeActive) {
      next.set('near_me', '1')
      if (distanceRadius) next.set('radius', distanceRadius)
    }

    const currentStr = searchParams.toString()
    const nextStr = next.toString()
    if (nextStr) {
      sessionStorage.setItem('doctors_filter_query', nextStr)
    } else {
      sessionStorage.removeItem('doctors_filter_query')
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
    selectedSpecialty,
    selectedHospital,
    selectedFee,
    selectedExp,
    selectedDate,
    appliedSearch,
    availableToday,
    telemedicineOnly,
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
    if (selectedDivision && !p.division_id) p.division_id = selectedDivision
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
  }, [districtParam, matchedDivision, upazilaParam, selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, selectedSpecialty, selectedHospital, selectedFee, selectedExp, selectedDate, telemedicineOnly, availableToday, effectiveSearch, isNearMeActive, userLocation, distanceRadius, sortBy])

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

  const handleSearchChange = (val) => {
    setSearchText(val)
    window.dispatchEvent(new CustomEvent('sync-listing-search', { detail: val }))
  }

  // Clear single search handler
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
            window.dispatchEvent(new CustomEvent('sync-listing-search', { detail: text }))
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
      const passedName = searchParams.get('specialty_name') || searchParams.get('specialty') || searchParams.get('department')
      list.push({
        key: 'specialty',
        label: item ? (item.name_bn || item.name) : (passedName || 'বিশেষজ্ঞতা'),
        clear: () => {
          setSelectedSpecialty('')
          updateUrlParams({ specialty_id: '', specialty_name: '', specialty: '', department: '' })
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
      const passedName = searchParams.get('hospital_name') || searchParams.get('hospital')
      const matchedHosp = hospitals?.find(h => String(h.id) === String(selectedHospital) || String(h.public_id) === String(selectedHospital))
      const hospName = matchedHosp?.name_bn || matchedHosp?.name || selectedHospitalData?.name || selectedHospitalData?.name_bn || passedName || 'হাসপাতাল'
      list.push({
        key: 'hospital',
        label: hospName,
        clear: () => {
          setSelectedHospital('')
          updateUrlParams({ hospital_id: '', hospital_name: '', hospital: '' })
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
    selectedHospital, selectedHospitalData, selectedFee, selectedExp, selectedDate, telemedicineOnly, availableToday, searchText,
    isNearMeActive, distanceRadius, handleToggleNearMe,
    specialties, hospitals, divisions, districts, upazilas, unions, updateUrlParams, handleDateChange, searchParams
  ])

  const activeCount = activeFilters.length

  const handleClearAllFilters = () => {
    sessionStorage.removeItem('doctors_filter_query')
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
    setAppliedSearch('')
    setSpecialtySearch('')
    setHospitalSearch('')
    setIsNearMeActive(false)
    setLocationInlineError(false)
    setDistanceRadius('')
    setSortBy('relevance')
    prevParamsRef.current = ''
    window.dispatchEvent(new CustomEvent('sync-listing-search', { detail: '' }))
    setSearchParams({}, { replace: true })
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

  // Dual-scroll and layout refs
  const headerBlockRef = useRef(null)
  const leftPaneRef = useRef(null)
  const rightPaneRef = useRef(null)
  const sentinelRef = useRef(null)

  // Infinite scroll sentinel
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

  // Dynamic location breadcrumb trail for heading
  const locationBreadcrumb = useMemo(() => {
    const steps = []
    if (selectedDivision) {
      const divObj = divisions.find(d => String(d.id) === String(selectedDivision))
      if (divObj) steps.push(getLocName(divObj, ''))
    }
    if (selectedDistrict) {
      const distObj = districts.find(d => String(d.id) === String(selectedDistrict))
      if (distObj) steps.push(getLocName(distObj, ''))
    }
    if (selectedUpazila) {
      const upaObj = upazilas.find(u => String(u.id) === String(selectedUpazila))
      if (upaObj) steps.push(getLocName(upaObj, ''))
    }
    if (selectedUnion) {
      const uniObj = unions.find(u => String(u.id) === String(selectedUnion))
      if (uniObj) steps.push(getLocName(uniObj, ''))
    }
    return steps.filter(Boolean)
  }, [selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, divisions, districts, upazilas, unions])

  const filteredSpecialties = useMemo(() => {
    if (!specialtySearch.trim()) return specialties
    const q = specialtySearch.toLowerCase()
    return specialties.filter(s => (s.name || '').toLowerCase().includes(q) || (s.name_bn || '').toLowerCase().includes(q))
  }, [specialties, specialtySearch])

  // Dynamic SEO metadata computation for national, district, and upazila doctor listing hubs
  const seoData = useMemo(() => {
    const districtObj = districts?.find(d => d.slug === districtParam || String(d.id) === String(selectedDistrict))
    const upazilaObj = upazilas?.find(u => u.slug === upazilaParam || String(u.id) === String(selectedUpazila))
    
    const distNameBn = districtObj?.bangla_name || districtObj?.name_bn || districtObj?.name
    const upaNameBn = upazilaObj?.bangla_name || upazilaObj?.name_bn || upazilaObj?.name
    const distNameEn = districtObj?.name || districtParam
    const upaNameEn = upazilaObj?.name || upazilaParam

    let canonicalPath = '/doctors'
    let title = 'বাংলাদেশের সেরা বিশেষজ্ঞ ডাক্তার তালিকা ও সিরিয়াল বুকিং | Doctor Booklet'
    let description = 'বাংলাদেশের শীর্ষস্থানীয় বিশেষজ্ঞ ডাক্তারদের তালিকা, চেম্বার সময়সূচী ও অনলাইন সিরিয়াল বুকিং সেবা।'

    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Doctors', url: '/doctors' },
    ]

    if (matchedDivision) {
      const divNameBn = matchedDivision.bangla_name || matchedDivision.name_bn || matchedDivision.name
      const divNameEn = matchedDivision.name || districtParam
      canonicalPath = `/doctors/${districtParam}`
      title = `${divNameBn || divNameEn} বিভাগ সকল ডাক্তার তালিকা | Doctor Booklet`
      description = `${divNameBn || divNameEn} বিভাগের সকল বিশেষজ্ঞ ডাক্তারদের তালিকা, চেম্বার সময়সূচী ও অনলাইন সিরিয়াল বুকিং সেবা।`
      breadcrumbs.push({ name: divNameEn || 'Division', url: `/doctors/${districtParam}` })
    } else if (districtParam) {
      canonicalPath = `/doctors/${districtParam}`
      title = `${distNameBn || distNameEn} জেলার সেরা বিশেষজ্ঞ ডাক্তার তালিকা | Doctor Booklet`
      description = `${distNameBn || distNameEn} জেলার অভিজ্ঞ ডাক্তারদের তালিকা, বিশেষজ্ঞ বিভাগ, চেম্বার লোকেশন ও অনলাইন অ্যাপয়েন্টমেন্ট।`
      breadcrumbs.push({ name: distNameEn || 'District', url: `/doctors/${districtParam}` })

      if (upazilaParam) {
        canonicalPath = `/doctors/${districtParam}/${upazilaParam}`
        title = `${upaNameBn || upaNameEn}, ${distNameBn || distNameEn} — বিশেষজ্ঞ ডাক্তারদের তালিকা ও অ্যাপয়েন্টমেন্ট | Doctor Booklet`
        description = `${upaNameBn || upaNameEn}, ${distNameBn || distNameEn} এলাকার শীর্ষ বিশেষজ্ঞ ডাক্তারদের তালিকা, ওপিডি চেম্বার শিডিউল ও সিরিয়াল বুকিং।`
        breadcrumbs.push({ name: upaNameEn || 'Upazila', url: `/doctors/${districtParam}/${upazilaParam}` })
      }
    }

    const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://doctorbooklet.com'

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description: description,
      url: `${siteOrigin}${canonicalPath}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: doctors.slice(0, 12).map((doc, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: doc.name || doc.name_bn,
          url: doc.canonical_url ? `${siteOrigin}${doc.canonical_url}` : undefined,
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
        item: `${siteOrigin}${crumb.url}`,
      })),
    }

    return {
      title,
      description,
      canonicalUrl: `${siteOrigin}${canonicalPath}`,
      schema: [collectionSchema, breadcrumbSchema],
    }
  }, [districtParam, matchedDivision, upazilaParam, districts, upazilas, selectedDistrict, selectedUpazila, doctors])

  return (
    <div className="page-wrapper doc-page-root" style={{ background: '#F8FAFC', minHeight: '100vh', paddingTop: 'var(--header-height, 110px)', paddingBottom: 60, fontFamily: "'Inter', sans-serif" }}>
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
          z-index: 99999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: docSheetFadeIn 0.28s ease;
          touch-action: none;
          overscroll-behavior: none;
          overscroll-behavior-y: none;
        }

        .filter-drawer {
          background: #FFFFFF;
          width: 100%;
          max-width: 520px;
          height: 70vh;
          height: 70dvh;
          max-height: 72dvh;
          border-radius: 16px 16px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.28);
          animation: docSheetSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          transition: height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          overscroll-behavior: none;
          overscroll-behavior-y: none;
        }

        .filter-drawer.is-expanded {
          height: 92vh;
          height: 92dvh;
          max-height: 94dvh;
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

        /* ── Specialties Bottom Sheet Drawer ── */
        .specialties-drawer-backdrop {
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

        .specialties-drawer {
          background: #FFFFFF;
          width: 100%;
          max-width: 520px;
          height: 70vh;
          height: 70dvh;
          max-height: 72dvh;
          border-radius: 20px 20px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.28);
          animation: docSheetSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          transition: height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          overscroll-behavior: none;
          overscroll-behavior-y: none;
        }

        .specialties-drawer.is-expanded {
          height: 92vh !important;
          height: 92dvh !important;
          max-height: 94dvh !important;
        }

        .specialties-drawer-grid {
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 992px) {
          .specialties-drawer-backdrop {
            align-items: center !important;
            padding: 24px !important;
          }
          .specialties-drawer {
            border-radius: 16px !important;
            max-width: 720px !important;
            height: auto !important;
            max-height: 80vh !important;
            animation: docSheetFadeIn 0.2s ease !important;
          }
          .specialties-drawer-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .specialties-drawer-grid button {
            margin-bottom: 0 !important;
          }
        }

        .drawer-scroll-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: none;
          overscroll-behavior-y: none;
          padding: 14px 20px 20px 20px;
        }

        /* ── Page Layout & Spacings (Desktop & Mobile Responsive) ── */
        .doc-main-container {
          padding: 20px 24px;
        }
        .doc-heading-row {
          margin-bottom: 16px;
        }
        .mobile-reset-pill {
          display: inline-flex;
          align-items: center;
          background: none;
          border: none;
          padding: 2px 4px;
          color: #EF4444;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Hind Siliguri', sans-serif;
          white-space: nowrap;
          line-height: 1.4;
          flex-shrink: 0;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-thickness: 1.2px;
          transition: color 0.15s ease, opacity 0.15s ease;
        }
        .mobile-reset-pill:hover, .mobile-reset-pill:active {
          color: #DC2626;
          opacity: 0.85;
        }
        .doc-page-heading {
          font-size: 28px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }
        .doc-chips-wrapper {
          display: none;
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

        @media (max-width: 991px) {
          .doc-main-container {
            padding: 8px 16px 20px !important;
          }
          .doc-heading-row {
            margin-bottom: 8px !important;
          }
          .doc-page-heading {
            font-size: 20px !important;
            margin-bottom: 0 !important;
          }
          .doc-chips-wrapper {
            display: block !important;
            margin-bottom: 8px !important;
          }
          .doc-chips-scroll {
            padding-top: 4px !important;
            padding-bottom: 8px !important;
            padding-left: 2px !important;
            padding-right: 2px !important;
          }
          .doc-results-bar {
            margin-bottom: 10px !important;
          }
          .doc-desktop-search {
            display: none !important;
          }
          .doc-mobile-search-bar {
            display: block !important;
            padding: 10px 16px !important;
            background: #FFFFFF !important;
            border-bottom: 1px solid #E2E8F0 !important;
            box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.06) !important;
            transition: top 0.28s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .doc-chip-scroll-btn {
            display: none !important;
          }
        }
        @media (min-width: 992px) {
          .doc-mobile-search-bar {
            display: none !important;
          }
          .doc-chips-wrapper {
            display: none !important;
          }
          .doc-main-row {
            margin: 0 !important;
          }
          .doc-col-left {
            padding-left: 0 !important;
            padding-right: 12px !important;
          }
          .doc-col-right {
            padding-left: 12px !important;
            padding-right: 0 !important;
          }
          /* ── Desktop dual-pane layout ──
             Both panes have a fixed height = viewport - (66px scrolled navbar + 24px gap) - 20px container bottom padding.
             The page itself only scrolls far enough to hide the header block; at that point both panes rest
             exactly 24px below the navbar, and each pane scrolls independently inside itself. */
          .doc-page-root {
            padding-bottom: 0 !important;
          }
          .doc-filter-sidebar,
          .doc-results-scroll-pane {
            height: calc(100vh - 90px - 20px) !important;
            max-height: calc(100vh - 90px - 20px) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            scrollbar-width: thin;
            scrollbar-color: #CBD5E1 transparent;
          }
          .doc-filter-sidebar {
            padding-right: 6px;
          }
          .doc-filter-sidebar::-webkit-scrollbar {
            width: 6px;
          }
          .doc-filter-sidebar::-webkit-scrollbar-track {
            background: transparent;
          }
          .doc-filter-sidebar::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 99px;
          }
          .doc-filter-sidebar::-webkit-scrollbar-thumb:hover {
            background: #94A3B8;
          }

          .doc-results-scroll-pane {
            padding-right: 8px;
            padding-bottom: 24px;
          }
          .doc-results-scroll-pane::-webkit-scrollbar {
            width: 6px;
          }
          .doc-results-scroll-pane::-webkit-scrollbar-track {
            background: transparent;
          }
          .doc-results-scroll-pane::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 99px;
          }
          .doc-results-scroll-pane::-webkit-scrollbar-thumb:hover {
            background: #94A3B8;
          }

          .doc-desktop-search-btn {
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
          .doc-desktop-search-btn:hover {
            background: #009E64 !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 184, 117, 0.4) !important;
          }
          .doc-desktop-search-btn:active {
            transform: scale(0.95) !important;
            background: #008754 !important;
          }
          .doc-desktop-search-btn:disabled {
            opacity: 0.82 !important;
            cursor: not-allowed !important;
            transform: none !important;
          }
        }
        @media (max-width: 767px) {
          .doc-results-bar {
            margin-bottom: 8px !important;
          }
          .doc-results-controls {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .doc-view-toggle {
            margin-left: auto !important;
          }
        }

        /* ── Mobile Search & Filter (Integrated App Header Design) ── */
        .doc-mobile-search-pill {
          height: 46px;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: none;
          transition: all 0.2s ease;
        }
        .doc-mobile-search-pill:focus-within {
          background: #FFFFFF;
          border-color: #00B875;
          box-shadow: 0 0 0 3px rgba(0, 184, 117, 0.12);
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
          min-width: 0;
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .doc-mobile-search-input::placeholder {
          color: #64748B;
          font-weight: 500;
          opacity: 1;
          text-overflow: ellipsis;
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
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1E293B;
          flex-shrink: 0;
          cursor: pointer;
          box-shadow: none;
          position: relative;
          transition: all 0.2s ease;
        }
        .doc-mobile-filter-btn:active {
          transform: scale(0.96);
          background: #F1F5F9;
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
        top: 'var(--mobile-search-top, 0px)',
        zIndex: 1040,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '10px 16px',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
        transition: 'top 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, margin: 0 }}>
            <form onSubmit={handleSearchSubmit} style={{ margin: 0 }}>
              <div className="doc-mobile-search-pill">
                <IconSearch size={20} className="doc-mobile-search-icon" />
                <input
                  type="text"
                  placeholder={mobilePlaceholder || ' '}
                  value={searchText}
                  onChange={e => {
                    handleSearchChange(e.target.value)
                    setIsMobileTypeaheadOpen(true)
                  }}
                  onFocus={() => setIsMobileTypeaheadOpen(true)}
                  className="doc-mobile-search-input"
                  style={{ fontFamily: "'Hind Siliguri', 'Inter', sans-serif" }}
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

            <SearchTypeaheadDropdown
              query={searchText}
              isOpen={isMobileTypeaheadOpen}
              onClose={() => setIsMobileTypeaheadOpen(false)}
              onSelectSearchAll={handleSelectSearchAll}
              type="doctor"
            />
          </div>

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

      <Container fluid className="doc-main-container" style={{ maxWidth: 1380 }}>
        
        {/* ── HEADER BLOCK (Heading, Desktop Search, Chips, Results Bar) ── */}
        <div ref={headerBlockRef} className="doc-header-block">
          {/* ── HEADING TITLE + INLINE AVAILABILITY DATE FILTER BAR (DESKTOP) ── */}
          <div className="doc-heading-row" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}>
            <h1 className="doc-page-heading" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', minWidth: 0 }}>
              <span style={{ fontFamily: "'Hind Siliguri', sans-serif", whiteSpace: 'nowrap' }}>ডাক্তার তালিকা</span>
              <span className="d-lg-none" style={{
                fontSize: 11.5,
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
                lineHeight: '1.4',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                {(loading && sortedDoctors.length === 0) ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                    <span style={{ fontSize: 11 }}>লোড হচ্ছে...</span>
                  </>
                ) : (
                  `${toBengaliNumber(sortedDoctors.length)} জন ডাক্তার`
                )}
              </span>
            </h1>

            {/* Mobile Quick Reset Button when filters active */}
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="mobile-reset-pill d-lg-none"
                title="ফিল্টার রিসেট করুন"
                aria-label="ফিল্টার রিসেট করুন"
              >
                <span>রিসেট</span>
              </button>
            )}

            <div className="d-none d-lg-block">
              <AvailabilityDateFilter
                value={selectedDate}
                onChange={handleDateChange}
                inline
              />
            </div>
          </div>

          {/* ── LOCATION BREADCRUMB TRAIL (DESKTOP ONLY) ── */}
          {locationBreadcrumb.length > 0 && (
            <div className="doc-location-trail d-none d-lg-flex" style={{
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
              marginTop: 4,
              marginBottom: 10,
              fontSize: 13,
              fontWeight: 600,
              color: '#475569',
              fontFamily: "'Hind Siliguri', sans-serif"
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#00B875', fontWeight: 700, fontSize: 12.5 }}>
                <IconMapPin size={15} color="#00B875" />
                <span>লোকেশন:</span>
              </span>
              {locationBreadcrumb.map((step, idx) => (
                <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {idx > 0 && <span style={{ color: '#94A3B8', fontWeight: 800, fontSize: 12 }}>›</span>}
                  <span style={{
                    color: idx === locationBreadcrumb.length - 1 ? '#0F172A' : '#475569',
                    fontWeight: idx === locationBreadcrumb.length - 1 ? 800 : 600,
                    background: idx === locationBreadcrumb.length - 1 ? '#F1F5F9' : 'transparent',
                    padding: idx === locationBreadcrumb.length - 1 ? '1px 8px' : '0',
                    borderRadius: 6
                  }}>
                    {step}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* ── DESKTOP FULL WIDTH SEARCH BAR (≥992px) ── */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <form onSubmit={handleSearchSubmit} className="doc-desktop-search" style={{
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
              <IconSearch size={18} color="#94A3B8" />
              <input
                type="text"
                placeholder={desktopPlaceholder || ' '}
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
                  padding: '10px 0',
                  fontFamily: "'Hind Siliguri', 'Inter', sans-serif"
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
                className="doc-desktop-search-btn"
                style={{ fontFamily: "'Hind Siliguri', 'Inter', sans-serif" }}
              >
                {isSearching ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    <span>খুঁজছেন...</span>
                  </>
                ) : (
                  <span>খুঁজুন</span>
                )}
              </button>
            </form>

            <SearchTypeaheadDropdown
              query={searchText}
              isOpen={isDesktopTypeaheadOpen}
              onClose={() => setIsDesktopTypeaheadOpen(false)}
              onSelectSearchAll={handleSelectSearchAll}
              type="doctor"
            />
          </div>

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
                    height: 36,
                    fontSize: 12.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Hind Siliguri', sans-serif",
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  <span>{getSpecialtyIcon(displayName, spec.slug, isSelected)}</span>
                  <span>{displayName}</span>
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
                  height: 36,
                  fontSize: 12.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Hind Siliguri', sans-serif",
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                <span>সকল বিভাগ ❯</span>
              </button>
            )}
          </div>
        </div>

        {/* ── RESULTS SUMMARY BAR & SORT ── */}
        <div className="doc-results-bar">
          {/* Desktop Count (≥992px) */}
          <div className="d-none d-lg-flex align-items-center gap-2">
            <span style={{ fontSize: 13.5, color: '#1E293B', fontWeight: 700, fontFamily: "'Hind Siliguri', sans-serif" }}>
              {(loading && sortedDoctors.length === 0) ? (
                <span style={{ color: '#64748B' }}>লোড হচ্ছে...</span>
              ) : (
                `${toBengaliNumber(sortedDoctors.length)} জন ডাক্তার`
              )}
            </span>
          </div>

          <div className="doc-results-controls" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: "'Hind Siliguri', sans-serif" }}>সাজান:</span>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <select
                  value={sortBy}
                  onChange={e => handleSortChange(e.target.value)}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    background: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '6px 28px 6px 10px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    outline: 'none',
                    cursor: 'pointer',
                    maxWidth: 180,
                    fontFamily: "'Hind Siliguri', sans-serif",
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#00B875'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 184, 117, 0.12)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#CBD5E1'
                    e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <option value="relevance">প্রাসঙ্গিকতা</option>
                  <option value="nearest">নিকটবর্তী চেম্বার</option>
                  <option value="fee_low">ফি: কম থেকে বেশি</option>
                  <option value="fee_high">ফি: বেশি থেকে কম</option>
                  <option value="exp_high">অভিজ্ঞতা: বেশি থেকে কম</option>
                </select>
                <IconChevronDown
                  size={15}
                  color="#64748B"
                  style={{
                    position: 'absolute',
                    right: 8,
                    pointerEvents: 'none'
                  }}
                />
              </div>
            </div>

            {/* View Mode Toggle Buttons (Aligned to Right Edge) */}
            <div className="doc-view-toggle" style={{ display: 'flex', border: '1.5px solid #CBD5E1', borderRadius: 8, overflow: 'hidden', background: 'white', flexShrink: 0 }}>
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

        {/* ── MAIN CONTENT AREA (2 COLUMNS IN DESKTOP) ── */}
        <Row className="doc-main-row g-4">

          {/* ── LEFT COLUMN: FILTERS SIDEBAR PANEL (Desktop Only ≥992px) ── */}
          <Col xs={12} lg={3} className="d-none d-lg-block doc-col-left">
            <div ref={leftPaneRef} className="doc-filter-sidebar" style={{
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
                        `${toBengaliNumber(total)} জন পাওয়া গেছে`
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

                {/* Accordion 2: Hospital */}
                <div style={{ marginBottom: 14, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                  <div onClick={() => toggleAccordion('hospital')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Hospital / হাসপাতাল</span>
                    {openAccordions.hospital ? <IconChevronUp size={16} color="#64748B" /> : <IconChevronDown size={16} color="#64748B" />}
                  </div>
                  {openAccordions.hospital && (
                    <div style={{ marginTop: 10 }}>
                      <input
                        type="text"
                        placeholder="হাসপাতাল খুঁজুন..."
                        value={hospitalSearch}
                        onChange={e => setHospitalSearch(e.target.value)}
                        style={{ width: '100%', padding: '5px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, marginBottom: 8, outline: 'none' }}
                      />
                      <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {filteredHospitals.map(h => {
                          const isChecked = String(selectedHospital) === String(h.id) || (h.public_id && String(selectedHospital) === String(h.public_id))
                          return (
                            <label key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, color: isChecked ? '#0F172A' : '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif", userSelect: 'none' }}>
                              <CustomCheckbox
                                checked={isChecked}
                                onChange={() => {
                                  const nextVal = isChecked ? '' : String(h.id)
                                  setSelectedHospital(nextVal)
                                  updateUrlParams({ hospital_id: nextVal, hospital_name: nextVal ? (h.name || h.name_bn || '') : '' })
                                }}
                                size={17}
                              />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {h.name_bn || h.name}
                              </span>
                            </label>
                          )
                        })}
                        {filteredHospitals.length === 0 && (
                          <div style={{ fontSize: 12, color: '#94A3B8', padding: '8px 0', textAlign: 'center' }}>
                            কোনো হাসপাতাল পাওয়া যায়নি
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 3: Location */}
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
          <Col xs={12} lg={9} className="doc-col-right">
            <div ref={rightPaneRef} className="doc-results-scroll-pane">
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
            </div>
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
            className={`filter-drawer ${isDocSheetExpanded ? 'is-expanded' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Indicator Handle Bar (Swipe down to dismiss, tap to expand/collapse) */}
            <div
              className="doc-sheet-drag-zone"
              onClick={() => {
                if (Date.now() - lastDocDragEndTimeRef.current < 250) return
                const next = !isDocSheetExpandedRef.current
                setIsDocSheetExpanded(next)
                isDocSheetExpandedRef.current = next
                if (docFilterSheetRef.current) {
                  docFilterSheetRef.current.style.transition = 'height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
                  docFilterSheetRef.current.style.height = next ? '92dvh' : '70dvh'
                  docFilterSheetRef.current.style.maxHeight = next ? '92dvh' : '70dvh'
                }
              }}
            >
              <div className="doc-sheet-drag-bar" />
            </div>

            {/* Sheet Header (Swipeable, with filter count badge) */}
            <div className="doc-mobile-sheet-header">
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

        {/* Drawer Scroll Body (YouTube/FB comments swipeable scroll body) */}
        <div
          ref={docScrollBodyRef}
          className="drawer-scroll-body"
        >
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

          {/* Hospital */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>হাসপাতাল</span>
            <input
              type="text"
              placeholder="হাসপাতাল খুঁজুন..."
              value={hospitalSearch}
              onChange={e => setHospitalSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, marginBottom: 10, outline: 'none' }}
            />
            <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredHospitals.map(h => {
                const isChecked = String(selectedHospital) === String(h.id) || (h.public_id && String(selectedHospital) === String(h.public_id))
                return (
                  <label key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: isChecked ? '#0F172A' : '#334155', fontWeight: isChecked ? 700 : 500, fontFamily: "'Hind Siliguri', sans-serif", userSelect: 'none' }}>
                    <CustomCheckbox
                      checked={isChecked}
                      onChange={() => {
                        const nextVal = isChecked ? '' : String(h.id)
                        setSelectedHospital(nextVal)
                        updateUrlParams({ hospital_id: nextVal, hospital_name: nextVal ? (h.name || h.name_bn || '') : '' })
                      }}
                    />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {h.name_bn || h.name}
                    </span>
                  </label>
                )
              })}
              {filteredHospitals.length === 0 && (
                <div style={{ fontSize: 13, color: '#94A3B8', padding: '10px 0', textAlign: 'center' }}>
                  কোনো হাসপাতাল পাওয়া যায়নি
                </div>
              )}
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

      {/* ── ALL SPECIALTIES RESPONSIVE BOTTOM SHEET / DRAWER ── */}
      {isAllSpecialtiesModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={allSpecOverlayRef}
          className="specialties-drawer-backdrop"
          onClick={closeAllSpecialtiesModal}
        >
          <div
            ref={allSpecSheetRef}
            className={`specialties-drawer ${isAllSpecExpanded ? 'is-expanded' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Indicator Handle (Swipe down to dismiss, tap to expand/collapse) */}
            <div
              className="doc-sheet-drag-zone d-lg-none"
              onClick={() => {
                if (Date.now() - lastAllSpecDragEndTimeRef.current < 250) return
                const next = !isAllSpecExpandedRef.current
                setIsAllSpecExpanded(next)
                isAllSpecExpandedRef.current = next
                if (allSpecSheetRef.current) {
                  allSpecSheetRef.current.style.transition = 'height 0.32s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
                  allSpecSheetRef.current.style.height = next ? '92dvh' : '70dvh'
                  allSpecSheetRef.current.style.maxHeight = next ? '92dvh' : '70dvh'
                }
              }}
            >
              <div className="doc-sheet-drag-bar" />
            </div>

            {/* Header */}
            <div
              className="all-spec-sheet-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px 10px',
                borderBottom: '1px solid #E2E8F0',
                background: '#FFFFFF',
                flexShrink: 0
              }}
            >
              <div>
                <h5 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                  সকল বিশেষজ্ঞ বিভাগ ({toBengaliNumber(specialties?.length || 0)})
                </h5>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  আপনার পছন্দের চিকিৎসা বিভাগটি নির্বাচন করুন
                </p>
              </div>
              <button
                type="button"
                onClick={closeAllSpecialtiesModal}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                title="বন্ধ করুন"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Search Input Filter */}
            <div style={{ padding: '12px 16px 8px', background: '#FFFFFF', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="বিশেষজ্ঞ বিভাগের নাম দিয়ে খুঁজুন..."
                  value={modalSpecialtySearch}
                  onChange={(e) => setModalSpecialtySearch(e.target.value)}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 12,
                    border: '1.5px solid #E2E8F0',
                    padding: '0 36px 0 14px',
                    fontSize: 13.5,
                    color: '#0F172A',
                    fontWeight: 600,
                    outline: 'none',
                    background: '#F8FAFC',
                    fontFamily: "'Hind Siliguri', sans-serif",
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = '#FFFFFF'
                    e.target.style.borderColor = '#00B875'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 184, 117, 0.12)'
                  }}
                  onBlur={(e) => {
                    e.target.style.background = '#F8FAFC'
                    e.target.style.borderColor = '#E2E8F0'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {modalSpecialtySearch ? (
                  <button
                    type="button"
                    onClick={() => setModalSpecialtySearch('')}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
                  >
                    <IconX size={17} />
                  </button>
                ) : (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', display: 'flex' }}>
                    <IconSearch size={18} />
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Specialties List */}
            <div ref={allSpecBodyRef} style={{ padding: '10px 16px 20px', flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div className="specialties-drawer-grid">
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
                          closeAllSpecialtiesModal()
                        }}
                        style={{
                          width: '100%',
                          background: isSelected ? '#F0FDF4' : '#FFFFFF',
                          border: isSelected ? '1.5px solid #00B875' : '1px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '11px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          marginBottom: 8,
                          boxShadow: isSelected ? '0 2px 8px rgba(0, 184, 117, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 18, display: 'flex', alignItems: 'center' }}>
                            {getSpecialtyIcon(displayName, spec.slug, isSelected)}
                          </span>
                          <span style={{
                            fontSize: 13.5,
                            fontWeight: isSelected ? 800 : 600,
                            color: isSelected ? '#00803D' : '#1E293B',
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
                            color: isSelected ? '#00803D' : '#64748B',
                            background: isSelected ? '#DCFCE7' : '#F1F5F9',
                            padding: '2px 8px',
                            borderRadius: 12,
                            marginLeft: 8,
                            flexShrink: 0
                          }}>
                            {toBengaliNumber(docCount)}
                          </span>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default DoctorsPage

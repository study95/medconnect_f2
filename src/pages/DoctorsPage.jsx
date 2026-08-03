import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

import DoctorCard from '../components/common/DoctorCard'
import { DoctorGridSkeleton } from '../components/common/Skeletons'
import useInfiniteDoctors from '../hooks/useInfiniteDoctors'
import useLocations from '../hooks/useLocations'
import useSpecialties from '../hooks/useSpecialties'
import useHospitals from '../hooks/useHospitals'
import useDebounce from '../hooks/useDebounce'
import {
  IconSearch, IconStethoscope, IconHeart, IconEye, IconBone,
  IconMoodSmile, IconBabyCarriage, IconDroplet, IconShieldCheck,
  IconLock, IconClock, IconHeadset, IconChevronLeft, IconChevronRight, IconArrowRight,
  IconAdjustmentsHorizontal, IconX, IconMapPin, IconChevronDown, IconChevronUp, IconBrain, IconGenderFemale, IconDental,
  IconUsers, IconBuildingHospital, IconStar, IconTrash, IconActivity, IconCheck, IconVideo, IconCalendarCheck
} from '@tabler/icons-react'
import { useTypewriter } from '../hooks/useTypewriter'

const SEARCH_PHRASES = [
  'ডাক্তারের নাম, বিশেষজ্ঞ, হাসপাতাল বা বিভাগ লিখুন...',
  'যেমন: হার্ট স্পেশালিস্ট',
  'যেমন: চক্ষু বিশেষজ্ঞ',
  'যেমন: মেডিসিন ডাক্তার',
  'যেমন: পপুলার হাসপাতাল'
]

const POPULAR_DEPARTMENTS = [
  {
    enName: 'Cardiologist',
    bnName: 'হৃদরোগ বিশেষজ্ঞ',
    searchKey: 'cardio',
    bnKey: 'হৃদরোগ',
    icon: <IconHeart size={20} color="#EF4444" />,
    iconBg: '#FEE2E2'
  },
  {
    enName: 'Medicine Specialist',
    bnName: 'মেডিসিন বিশেষজ্ঞ',
    searchKey: 'med',
    bnKey: 'মেডিসিন',
    icon: <IconStethoscope size={20} color="#2563EB" />,
    iconBg: '#DBEAFE'
  },
  {
    enName: 'Dermatologist',
    bnName: 'চর্মরোগ বিশেষজ্ঞ',
    searchKey: 'derma',
    bnKey: 'চর্মরোগ',
    icon: <IconDroplet size={20} color="#D97706" />,
    iconBg: '#FEF3C7'
  },
  {
    enName: 'Neurologist',
    bnName: 'স্নায়ুরোগ বিশেষজ্ঞ',
    searchKey: 'neuro',
    bnKey: 'স্নায়ুরোগ',
    icon: <IconBrain size={20} color="#9333EA" />,
    iconBg: '#F3E8FF'
  },
  {
    enName: 'Pediatrician',
    bnName: 'শিশু রোগ বিশেষজ্ঞ',
    searchKey: 'pedia',
    bnKey: 'শিশু',
    icon: <IconBabyCarriage size={20} color="#0284C7" />,
    iconBg: '#E0F2FE'
  },
  {
    enName: 'Gynecologist',
    bnName: 'স্ত্রী ও প্রসূতি রোগ',
    searchKey: 'gyne',
    bnKey: 'স্ত্রী',
    icon: <IconGenderFemale size={20} color="#DB2777" />,
    iconBg: '#FCE7F3'
  },
  {
    enName: 'Dentist',
    bnName: 'দন্ত বিশেষজ্ঞ',
    searchKey: 'dent',
    bnKey: 'দন্ত',
    icon: <IconDental size={20} color="#16A34A" />,
    iconBg: '#DCFCE7'
  },
  {
    enName: 'Orthopedist',
    bnName: 'অস্থিরোগ ও অর্থোপেডিক্স',
    searchKey: 'ortho',
    bnKey: 'অর্থোপেডিক্স',
    icon: <IconBone size={20} color="#EA580C" />,
    iconBg: '#FFEDD5'
  },
  {
    enName: 'Ophthalmologist',
    bnName: 'চক্ষু বিশেষজ্ঞ',
    searchKey: 'eye',
    bnKey: 'চক্ষু',
    icon: <IconEye size={20} color="#0891B2" />,
    iconBg: '#CFFAFE'
  },
  {
    enName: 'ENT Specialist',
    bnName: 'নাক, কান ও গলা',
    searchKey: 'ent',
    bnKey: 'নাক',
    icon: <IconHeadset size={20} color="#8B5CF6" />,
    iconBg: '#EDE9FE'
  },
  {
    enName: 'Gastroenterologist',
    bnName: 'পরিপাকতন্ত্র ও লিভার',
    searchKey: 'gastro',
    bnKey: 'পরিপাকতন্ত্র',
    icon: <IconActivity size={20} color="#059669" />,
    iconBg: '#D1FAE5'
  },
  {
    enName: 'Psychiatrist',
    bnName: 'মনোরোগ বিশেষজ্ঞ',
    searchKey: 'psych',
    bnKey: 'মনোরোগ',
    icon: <IconMoodSmile size={20} color="#EC4899" />,
    iconBg: '#FCE7F3'
  }
]

const FEE_RANGES = [
  { id: '0-500', label: '৳ ০ - ৫০০' },
  { id: '501-1000', label: '৳ ৫০-০ - ১০০০' },
  { id: '1001-1500', label: '৳ ১০০১ - ১৫০০' },
  { id: '1501-99999', label: '৳ ১৫০০+' }
]

const EXP_RANGES = [
  { id: '0-5', label: '০ - ৫ বছর' },
  { id: '6-10', label: '৬ - ১০ বছর' },
  { id: '11-20', label: '১১ - ২০ বছর' },
  { id: '21-99', label: '২০+ বছর' }
]

/* ─── DOCTOR HERO ───────────────────────── */
function DoctorHero({ onSearch, total, sortBy, setSortBy }) {
  const typingPlaceholder = useTypewriter(SEARCH_PHRASES)
  const popDeptScrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const {
    divisions, districts, upazilas, unions,
    selectedDivision, selectedDistrict, selectedUpazila, selectedUnion,
    setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion,
  } = useLocations()

  const [searchParams] = useSearchParams()
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty_id') || '')
  const [selectedHospital, setSelectedHospital] = useState(searchParams.get('hospital_id') || '')
  const [selectedFee, setSelectedFee] = useState(searchParams.get('fee_range') || '')
  const [selectedExp, setSelectedExp] = useState(searchParams.get('exp_range') || '')
  const [searchText, setSearchText] = useState(searchParams.get('search') || '')
  const [availableToday, setAvailableToday] = useState(false)
  const [telemedicineOnly, setTelemedicineOnly] = useState(false)
  
  const [specialtySearch, setSpecialtySearch] = useState('')
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [showAllSpecialties, setShowAllSpecialties] = useState(false)

  const { specialties } = useSpecialties()
  const { hospitals } = useHospitals({ per_page: 100 })

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Accordions state inside right side drawer
  const [openAccordions, setOpenAccordions] = useState({
    specialty: true,
    division: true,
    district: false,
    hospital: false,
    fee: true,
    exp: false
  })

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Track scroll position for left/right arrow visibility
  const handleDeptScroll = () => {
    const el = popDeptScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 5)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5)
  }

  useEffect(() => {
    const el = popDeptScrollRef.current
    if (!el) return
    // Initial check
    setCanScrollRight(el.scrollWidth > el.clientWidth)
    el.addEventListener('scroll', handleDeptScroll)
    window.addEventListener('resize', handleDeptScroll)
    return () => {
      el.removeEventListener('scroll', handleDeptScroll)
      window.removeEventListener('resize', handleDeptScroll)
    }
  }, [specialties])

  useEffect(() => {
    const divId = searchParams.get('division_id')
    const distId = searchParams.get('district_id')
    const upaId = searchParams.get('upazila_id')
    const uniId = searchParams.get('union_id')
    if (divId) setSelectedDivision(divId)
    if (distId) setSelectedDistrict(distId)
    if (upaId) setSelectedUpazila(upaId)
    if (uniId) setSelectedUnion(uniId)
  }, [searchParams, setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion])

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    const params = {}
    if (selectedDivision) params.division_id = selectedDivision
    if (selectedDistrict) params.district_id = selectedDistrict
    if (selectedUpazila) params.upazila_id = selectedUpazila
    if (selectedUnion) params.union_id = selectedUnion
    if (selectedSpecialty) params.specialty_id = selectedSpecialty
    if (selectedHospital) params.hospital_id = selectedHospital
    if (selectedFee) params.fee_range = selectedFee
    if (selectedExp) params.exp_range = selectedExp
    if (searchText.trim()) params.search = searchText.trim()
    if (availableToday) params.available_today = true
    if (telemedicineOnly) params.telemedicine = true
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
    setSelectedSpecialty('')
    setSelectedHospital('')
    setSelectedFee('')
    setSelectedExp('')
    setAvailableToday(false)
    setTelemedicineOnly(false)
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
    if (type === 'specialty' && selectedSpecialty) {
      const item = specialties.find(s => String(s.id) === String(selectedSpecialty))
      return item ? item.name || item.name_bn : ''
    }
    if (type === 'hospital' && selectedHospital) {
      const item = hospitals.find(h => String(h.id) === String(selectedHospital))
      return item ? item.name || item.name_bn : ''
    }
    if (type === 'fee' && selectedFee) {
      const item = FEE_RANGES.find(f => f.id === selectedFee)
      return item ? item.label : ''
    }
    if (type === 'exp' && selectedExp) {
      const item = EXP_RANGES.find(e => e.id === selectedExp)
      return item ? item.label : ''
    }
    return ''
  }

  // Active filters list matching demo image
  const activeFilters = useMemo(() => {
    const list = []
    if (selectedSpecialty) {
      const item = specialties.find(s => String(s.id) === String(selectedSpecialty))
      list.push({ key: 'specialty', label: item ? item.name || item.name_bn : 'Cardiology', clear: () => { setSelectedSpecialty(''); onSearch({ ...getParamObj(), specialty_id: '' }) } })
    }
    if (selectedDivision) {
      const item = divisions.find(d => String(d.id) === String(selectedDivision))
      list.push({ key: 'division', label: `${item ? item.name || item.bangla_name : 'Dhaka'} Division`, clear: () => { setSelectedDivision(''); setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion(''); onSearch({ ...getParamObj(), division_id: '', district_id: '', upazila_id: '', union_id: '' }) } })
    }
    if (selectedDistrict) {
      const item = districts.find(d => String(d.id) === String(selectedDistrict))
      list.push({ key: 'district', label: `${item ? item.name || item.bangla_name : 'District'}`, clear: () => { setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion(''); onSearch({ ...getParamObj(), district_id: '', upazila_id: '', union_id: '' }) } })
    }
    if (selectedHospital) {
      const item = hospitals.find(h => String(h.id) === String(selectedHospital))
      list.push({ key: 'hospital', label: item ? item.name || item.name_bn : 'Hospital', clear: () => { setSelectedHospital(''); onSearch({ ...getParamObj(), hospital_id: '' }) } })
    }
    if (selectedFee) {
      const item = FEE_RANGES.find(f => f.id === selectedFee)
      list.push({ key: 'fee', label: item ? item.label : selectedFee, clear: () => { setSelectedFee(''); onSearch({ ...getParamObj(), fee_range: '' }) } })
    }
    if (selectedExp) {
      const item = EXP_RANGES.find(e => e.id === selectedExp)
      list.push({ key: 'exp', label: item ? item.label : selectedExp, clear: () => { setSelectedExp(''); onSearch({ ...getParamObj(), exp_range: '' }) } })
    }
    if (availableToday) {
      list.push({ key: 'today', label: 'আজ অ্যাপয়েন্টমেন্ট', clear: () => { setAvailableToday(false); onSearch({ ...getParamObj(), available_today: false }) } })
    }
    if (telemedicineOnly) {
      list.push({ key: 'tele', label: 'ভিডিও কনসালটেশন', clear: () => { setTelemedicineOnly(false); onSearch({ ...getParamObj(), telemedicine: false }) } })
    }
    if (searchText.trim()) {
      list.push({ key: 'search', label: `Search: "${searchText.trim()}"`, clear: () => { setSearchText(''); onSearch({ ...getParamObj(), search: '' }) } })
    }
    return list
  }, [selectedSpecialty, selectedDivision, selectedDistrict, selectedHospital, selectedFee, selectedExp, availableToday, telemedicineOnly, searchText, specialties, divisions, districts, hospitals])

  const getParamObj = () => ({
    division_id: selectedDivision,
    district_id: selectedDistrict,
    upazila_id: selectedUpazila,
    union_id: selectedUnion,
    specialty_id: selectedSpecialty,
    hospital_id: selectedHospital,
    fee_range: selectedFee,
    exp_range: selectedExp,
    available_today: availableToday,
    telemedicine: telemedicineOnly,
    search: searchText.trim()
  })

  const activeCount = activeFilters.length

  // Counts fallback generator for specialties
  const mockCounts = {
    'Cardiology': 15,
    'Medicine': 32,
    'Dermatology': 18,
    'Neurology': 12,
    'Pediatrics': 22,
    'Gynecology': 16,
    'Dentistry': 14
  }

  return (
    <>
      <style>{`
        /* Hide scrollbar track on dept chips */
        .dept-scroll-inner::-webkit-scrollbar { display: none; }
        
        /* Sticky search container (Top part ONLY sticky) */
        .sticky-search-bar {
          position: sticky;
          top: var(--header-height, 72px);
          z-index: 990;
          background: rgba(248, 250, 252, 0.95);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding-top: 6px;
          padding-bottom: 6px;
          transition: all 0.2s ease;
        }

        /* Top Part Card: Search Form */
        .search-form-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          padding: 14px 18px;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        /* Bottom Part Section: Popular Departments */
        .popular-dept-section {
          padding-top: 8px;
          padding-bottom: 8px;
        }

        .popular-dept-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          padding: 12px 18px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }

        .doctor-search-form {
          display: flex;
          gap: 12px;
          align-items: center;
          width: 100%;
        }

        .search-input-wrapper {
          position: relative;
          flex: 1 1 360px;
          min-width: 220px;
        }

        .search-input-field {
          width: 100%;
          height: 48px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          padding: 0 40px 0 46px;
          font-size: 14px;
          color: #1E293B;
          font-weight: 500;
          outline: none;
          background: white;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .search-input-field:focus {
          border-color: #008767;
          box-shadow: 0 0 0 3px rgba(0, 135, 103, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .search-clear-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          display: flex;
          align-items: center;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .search-actions-wrapper {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-shrink: 0;
        }

        .search-select-wrapper {
          position: relative;
          width: 200px;
          flex-shrink: 0;
        }

        .search-select-field {
          width: 100%;
          height: 48px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          padding: 0 36px 0 42px;
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
          appearance: none;
          -webkit-appearance: none;
          background: white;
          cursor: pointer;
          outline: none;
          font-family: 'Hind Siliguri', sans-serif;
        }

        .select-icon-left {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #475569;
          display: flex;
          align-items: center;
          pointer-events: none;
          z-index: 1;
        }

        .select-icon-right {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #475569;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .search-submit-btn {
          height: 48px;
          border-radius: 10px;
          background: #008767;
          color: white;
          border: none;
          font-weight: 700;
          font-size: 16px;
          padding: 0 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 135, 103, 0.2);
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
          flex-shrink: 0;
        }
        .search-submit-btn:hover {
          background: #007559;
          transform: translateY(-1px);
        }

        .search-filter-btn {
          height: 48px;
          border-radius: 10px;
          background: white;
          color: #008767;
          border: 1.5px solid #008767;
          font-weight: 700;
          font-size: 15px;
          padding: 0 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
          flex-shrink: 0;
        }
        .search-filter-btn:hover {
          background: #F0FDF4;
        }

        /* Scroll arrow buttons for dept chips */
        .dept-scroll-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid #E2E8F0;
          background: white;
          color: #008767;
          display: flex !important;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          transition: all 0.2s ease;
          padding: 0;
        }
        .dept-scroll-arrow:hover {
          background: #008767;
          color: white;
          border-color: #008767;
          box-shadow: 0 6px 16px rgba(0, 135, 103, 0.25);
        }
        .dept-scroll-arrow.left  { left: 0px; }
        .dept-scroll-arrow.right { right: 0px; }
        .dept-scroll-arrow.hidden { opacity: 0.3; cursor: not-allowed; }

        /* Filter Drawer Overlay & Panel */
        .filter-drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
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
          padding: 12px 24px 20px 24px;
        }

        @media (max-width: 767px) {
          .doctor-hero-section {
            padding: 10px 0 4px 0 !important;
          }
          .doctor-hero-mobile-strip {
            text-align: center;
            padding: 6px 0 8px 0;
          }
          .doctor-hero-mobile-strip p {
            font-size: 11px;
            color: #64748B;
            font-weight: 600;
            margin-bottom: 2px;
            font-family: 'Hind Siliguri', sans-serif;
          }
          .doctor-hero-mobile-strip h1 {
            font-size: 17px;
            font-weight: 900;
            color: #1E293B;
            margin: 0;
            font-family: 'Hind Siliguri', sans-serif;
            line-height: 1.25;
          }
          .sticky-search-bar {
            top: 66px;
            padding-top: 6px;
            padding-bottom: 0;
          }

          .search-form-card {
            padding: 8px 10px;
            border-radius: 14px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.04);
          }
          .popular-dept-card {
            padding: 8px 8px;
            border-radius: 14px;
          }
          .dept-scroll-wrapper {
            padding: 0 24px !important;
          }
          .doctor-search-form {
            flex-direction: row !important;
            gap: 8px !important;
            align-items: center !important;
            width: 100% !important;
          }
          .search-input-wrapper {
            flex: 1 1 auto !important;
            width: auto !important;
            min-width: 0 !important;
            height: 40px !important;
          }
          .search-input-field {
            height: 40px !important;
            font-size: 13.5px;
            padding: 0 32px 0 36px !important;
            border-radius: 10px;
          }
          .search-icon {
            left: 10px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
          }
          .search-actions-wrapper {
            width: auto !important;
            display: flex !important;
            align-items: center !important;
            flex: 0 0 auto !important;
          }
          .search-select-wrapper {
            display: none !important;
          }
          .search-submit-btn {
            display: none !important;
          }
          .search-filter-btn {
            height: 40px !important;
            font-size: 13px;
            padding: 0 12px !important;
            gap: 4px;
            border-radius: 10px;
            white-space: nowrap;
            flex-shrink: 0 !important;
          }
          .results-header-row {
            display: flex !important;
            margin-bottom: 16px !important;
          }
          .results-header-row h2 {
            font-size: 18px !important;
          }
        }

        @media (max-width: 480px) {
          .search-form-card {
            padding: 6px 8px;
          }
          .doctor-search-form {
            gap: 6px !important;
          }
          .search-input-wrapper {
            height: 38px !important;
          }
          .search-input-field {
            height: 38px !important;
            font-size: 13px;
            padding: 0 28px 0 32px !important;
          }
          .search-filter-btn {
            height: 38px !important;
            font-size: 12.5px;
            padding: 0 10px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>

      {/* TOP HERO HEADER BANNER */}
      <section className="doctor-hero-section" style={{ background: 'linear-gradient(180deg, #F0FDF8 0%, #F8FAFC 100%)', padding: '16px 0 10px 0' }}>
        <Container>
          {/* Desktop Two-Column Hero Content */}
          <div className="d-none d-md-flex" style={{
            position: 'relative',
            minHeight: 250,
            alignItems: 'stretch',
            overflow: 'hidden',
            marginBottom: 16,
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #F0FDF8 0%, #E6F6F4 50%, #DCFCE7 100%)',
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 30px rgba(0, 135, 103, 0.06)'
          }}>
            {/* Left Content */}
            <div style={{ flex: '0 0 52%', display: 'flex', alignItems: 'center', padding: '28px 32px', zIndex: 3 }}>
              <div style={{ maxWidth: 500 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(0, 135, 103, 0.1)', color: '#008767',
                  fontSize: 12, fontWeight: 800, padding: '4px 12px',
                  borderRadius: 99, marginBottom: 12, fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#008767' }} />
                  সঠিক চিকিৎসা, সুস্থ জীবনের নিশ্চয়তা
                </div>
                <h1 style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 900, color: '#1E293B', lineHeight: 1.25, marginBottom: 12, fontFamily: "'Hind Siliguri', sans-serif" }}>
                  সহজে খুঁজুন <br />
                  আপনার পছন্দের <span style={{ color: '#008767' }}>বিশেষজ্ঞ ডাক্তার</span>
                </h1>
                <p style={{ color: '#64748B', fontSize: 14, fontWeight: 500, lineHeight: 1.6, margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                  বাংলাদেশের সেরা বিএমডিসি-যাচাইকৃত ডাক্তার, হাসপাতাল ও সেবা তথ্য একসাথে।
                </p>
              </div>
            </div>

            {/* Right Doctor Image */}
            <div className="d-none d-lg-block" style={{ flex: '0 0 48%', position: 'relative', overflow: 'hidden' }}>
              <img
                src="/images/doctors-header-bg.jpg"
                alt="Doctor Consultation"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 20%',
                  zIndex: 1
                }}
              />
              {/* Gradient Mask for Seamless Left Fade */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, #F0FDF8 0%, rgba(240, 253, 248, 0.65) 30%, transparent 70%)',
                zIndex: 2,
                pointerEvents: 'none'
              }} />

              {/* Top Glass Stat Badge */}
              <div style={{
                position: 'absolute', top: 16, left: 16, zIndex: 3,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
                borderRadius: 14, padding: '7px 13px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E6F7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconUsers size={18} color="#008767" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#1E293B', lineHeight: 1.1 }}>20,000+</div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>ডাক্তার</div>
                </div>
              </div>

              {/* Bottom Glass Stat Badge */}
              <div style={{
                position: 'absolute', bottom: 16, right: 16, zIndex: 3,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
                borderRadius: 14, padding: '7px 13px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E6F7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconShieldCheck size={18} color="#008767" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#1E293B', lineHeight: 1.1 }}>100%</div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>বিএমডিসি ভেরিফায়েড</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Compact Hero Strip with Doctor Background Image */}
          <div className="d-md-none doctor-hero-mobile-strip" style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            padding: '20px 16px',
            marginBottom: 8,
            background: 'linear-gradient(135deg, rgba(0,77,62,0.88) 0%, rgba(0,135,103,0.82) 100%)',
            boxShadow: '0 6px 20px rgba(0,135,103,0.15)'
          }}>
            <img
              src="/images/doctors-header-bg.jpg"
              alt="Doctor"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 20%',
                opacity: 0.22,
                zIndex: 0
              }}
            />
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <p style={{ color: '#ADFCE9', fontSize: 11.5, fontWeight: 700, marginBottom: 4, fontFamily: "'Hind Siliguri', sans-serif", letterSpacing: '0.04em' }}>
                সঠিক চিকিৎসা, সুস্থ জীবনের নিশ্চয়তা
              </p>
              <h1 style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', margin: 0, fontFamily: "'Hind Siliguri', sans-serif", lineHeight: 1.3 }}>
                সহজে খুঁজুন আপনার পছন্দের <span style={{ color: '#ADFCE9' }}>বিশেষজ্ঞ ডাক্তার</span>
              </h1>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 1. TOP STICKY SEARCH FORM ── */}
      <section className="sticky-search-bar">
        <Container>
          <div className="search-form-card">
            {/* Search Row */}
            <form onSubmit={handleSubmit} className="doctor-search-form">
              {/* 1. Search Input */}
              <div className="search-input-wrapper">
                <span className="search-icon">
                  <IconSearch size={18} />
                </span>
                <input 
                  type="text" 
                  placeholder={typingPlaceholder || "ডাক্তারের নাম, বিশেষজ্ঞ, হাসপাতাল বা বিভাগ লিখুন..."} 
                  value={searchText} 
                  onChange={e => {
                    setSearchText(e.target.value);
                    onSearch({
                      ...getParamObj(),
                      search: e.target.value.trim()
                    });
                  }} 
                  className="search-input-field"
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchText('');
                      onSearch({
                        ...getParamObj(),
                        search: ''
                      });
                    }}
                    className="search-clear-btn"
                  >
                    <IconX size={18} />
                  </button>
                )}
              </div>

              {/* Actions: Select + Buttons */}
              <div className="search-actions-wrapper">
                <div className="search-select-wrapper">
                  <span className="select-icon-left">
                    <IconStethoscope size={18} />
                  </span>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => {
                      setSelectedSpecialty(e.target.value);
                      onSearch({
                        ...getParamObj(),
                        specialty_id: e.target.value,
                      });
                    }}
                    className="search-select-field"
                  >
                    <option value="">সকল স্পেশালিস্ট</option>
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name_bn || s.name}
                      </option>
                    ))}
                  </select>
                  <span className="select-icon-right">
                    <IconChevronDown size={18} />
                  </span>
                </div>

                <button type="submit" className="search-submit-btn">খুঁজুন</button>

                <button 
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="search-filter-btn"
                >
                  <IconAdjustmentsHorizontal size={18} color="#008767" />
                  <span>ফিল্টার</span>
                  {activeCount > 0 && (
                    <span style={{
                      background: '#008767',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 2
                    }}>
                      {activeCount}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </Container>
      </section>

      {/* ── 2. ACTIVE FILTERS STRIP ON PAGE (WHEN FILTERS ARE APPLIED) ── */}
      {activeCount > 0 && (
        <section className="active-filters-strip" style={{ paddingTop: 8, paddingBottom: 4 }}>
          <Container>
            <div style={{
              background: 'white',
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  আপনার নির্বাচিত ফিল্টার সমূহ:
                </span>
                {activeFilters.map(f => (
                  <span key={f.key} style={{
                    background: '#E6F4EA',
                    color: '#008767',
                    border: '1px solid #C6E7D2',
                    borderRadius: 16,
                    padding: '4px 12px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}>
                    {f.label}
                    <button
                      type="button"
                      onClick={f.clear}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#008767', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <IconX size={13} />
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={handleClearAllFilters}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#008767',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}
              >
                সব ক্লিয়ার করুন <IconTrash size={15} />
              </button>
            </div>
          </Container>
        </section>
      )}

      {/* ── 3. BOTTOM POPULAR DEPARTMENTS CARD WITH LEFT & RIGHT ARROWS ── */}
      <section className="popular-dept-section">
        <Container>
          <div className="popular-dept-card">
            {/* Popular Departments row */}
            <div className="dept-scroll-wrapper" style={{ position: 'relative', padding: '0 36px' }}>
              {/* Left arrow */}
              <button
                type="button"
                className={`dept-scroll-arrow left ${canScrollLeft ? '' : 'hidden'}`}
                onClick={() => { if (popDeptScrollRef.current) popDeptScrollRef.current.scrollBy({ left: -260, behavior: 'smooth' }) }}
                title="Previous"
              >
                <IconChevronLeft size={18} />
              </button>

              {/* Right arrow */}
              <button
                type="button"
                className={`dept-scroll-arrow right ${canScrollRight ? '' : 'hidden'}`}
                onClick={() => { if (popDeptScrollRef.current) popDeptScrollRef.current.scrollBy({ left: 260, behavior: 'smooth' }) }}
                title="Next"
              >
                <IconChevronRight size={18} />
              </button>

              {/* Scrollable chips */}
              <div
                ref={popDeptScrollRef}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  padding: '4px 2px 6px 2px',
                }}
              >
                {POPULAR_DEPARTMENTS.map((dept, idx) => {
                  const matchedSpec = specialties.find(s => {
                    const name = (s.name || '').toLowerCase()
                    const nameBn = (s.name_bn || '')
                    return (
                      (dept.searchKey && name.includes(dept.searchKey)) ||
                      (dept.bnKey && nameBn.includes(dept.bnKey)) ||
                      name.includes(dept.enName.toLowerCase())
                    )
                  })
                  const specId = matchedSpec ? String(matchedSpec.id) : null
                  const isSelected = selectedSpecialty === specId && specId !== null

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (!specId) return;
                        const nextVal = isSelected ? '' : specId;
                        setSelectedSpecialty(nextVal);
                        onSearch({
                          ...getParamObj(),
                          specialty_id: nextVal
                        });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 14px',
                        borderRadius: 12,
                        border: isSelected ? '1.5px solid #008767' : '1px solid #E2E8F0',
                        background: isSelected ? '#F0FDF4' : '#FAFBFC',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxShadow: isSelected ? '0 2px 8px rgba(0,135,103,0.12)' : 'none'
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: dept.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {dept.icon}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B', lineHeight: 1.2, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                          {dept.enName}
                        </span>
                        <span style={{ fontSize: 10.5, fontWeight: 500, color: '#64748B', lineHeight: 1.2, fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {dept.bnName}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Sliding Filter Drawer Backdrop */}
      <div 
        className={`filter-drawer-backdrop ${isDrawerOpen ? 'open' : ''}`} 
        onClick={() => setIsDrawerOpen(false)} 
      />

      {/* ── 4. RIGHT SIDE ACCORDION FILTER DRAWER (EXACT DESIGN MATCH) ── */}
      <div className={`filter-drawer ${isDrawerOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div style={{ padding: '20px 24px 12px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h5 style={{ fontWeight: 800, fontSize: 18, color: '#1E293B', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                ফিল্টার
              </h5>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: '6px 0 0 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                নির্বাচিত ফিল্টার ({activeCount})
              </p>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(false)} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}
            >
              <IconX size={20} />
            </button>
          </div>

          {/* Active Chips inside Drawer */}
          {activeCount > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {activeFilters.map(f => (
                  <span key={f.key} style={{
                    background: '#E6F4EA',
                    color: '#008767',
                    borderRadius: 16,
                    padding: '4px 12px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}>
                    {f.label}
                    <button
                      type="button"
                      onClick={f.clear}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#008767', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <IconX size={13} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  style={{ background: 'none', border: 'none', color: '#008767', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  সব ক্লিয়ার করুন <IconTrash size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Drawer Body with Accordions */}
        <div className="drawer-scroll-body">
          {/* ACCORDION 1: Specialist */}
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: openAccordions.specialty ? 14 : 0 }}>
            <div 
              onClick={() => toggleAccordion('specialty')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconStethoscope size={18} color="#475569" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  বিশেষজ্ঞ (Speciality)
                </span>
              </div>
              {openAccordions.specialty ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>

            {openAccordions.specialty && (
              <div style={{ paddingTop: 4 }}>
                {/* Search input */}
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="বিশেষজ্ঞ খুঁজুন..."
                    value={specialtySearch}
                    onChange={e => setSpecialtySearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      background: '#FAFAFA',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}
                  />
                  <IconSearch size={15} color="#94A3B8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                </div>

                {/* Specialties Options with exact Checkbox & Count pill design */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {specialties
                    .filter(s => (s.name || s.name_bn || '').toLowerCase().includes(specialtySearch.toLowerCase()))
                    .slice(0, showAllSpecialties ? 999 : 5)
                    .map(s => {
                      const isSel = String(selectedSpecialty) === String(s.id)
                      const specName = s.name || s.name_bn
                      const countVal = mockCounts[specName] || (Math.floor(Math.abs(s.id * 7)) % 25) + 8
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSpecialty(isSel ? '' : s.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 4px',
                            cursor: 'pointer',
                            borderRadius: 6
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: 4,
                              border: isSel ? 'none' : '1.5px solid #CBD5E1',
                              background: isSel ? '#008767' : 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {isSel && <IconCheck size={13} color="white" stroke={3} />}
                            </div>
                            <span style={{ fontSize: 13.5, fontWeight: isSel ? 700 : 600, color: isSel ? '#008767' : '#1E293B', fontFamily: "system-ui, -apple-system, sans-serif" }}>
                              {specName}
                            </span>
                          </div>
                          <span style={{
                            background: '#E6F4EA',
                            color: '#008767',
                            fontSize: 11.5,
                            fontWeight: 700,
                            borderRadius: 10,
                            padding: '2px 8px',
                            fontFamily: "system-ui, -apple-system, sans-serif"
                          }}>
                            {countVal}
                          </span>
                        </div>
                      )
                    })
                  }
                </div>

                {specialties.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllSpecialties(!showAllSpecialties)}
                    style={{ background: 'none', border: 'none', color: '#008767', fontSize: 12.5, fontWeight: 700, padding: '8px 0 0 0', cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {showAllSpecialties ? 'কম দেখুন ∧' : 'আরও দেখুন ∨'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ACCORDION 2: Division */}
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: openAccordions.division ? 14 : 0 }}>
            <div 
              onClick={() => toggleAccordion('division')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconMapPin size={18} color="#475569" />
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    বিভাগ (Division)
                  </span>
                  {!openAccordions.division && getSelectedLabel('division') && (
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      {getSelectedLabel('division')}
                    </div>
                  )}
                </div>
              </div>
              {openAccordions.division ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>

            {openAccordions.division && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4 }}>
                {divisions.map(d => {
                  const isSel = String(selectedDivision) === String(d.id)
                  const divName = d.name || d.bangla_name
                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedDivision(isSel ? '' : d.id);
                        setSelectedDistrict('');
                        setSelectedUpazila('');
                        setSelectedUnion('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 4px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 4,
                          border: isSel ? 'none' : '1.5px solid #CBD5E1',
                          background: isSel ? '#008767' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isSel && <IconCheck size={13} color="white" stroke={3} />}
                        </div>
                        <span style={{ fontSize: 13.5, fontWeight: isSel ? 700 : 600, color: isSel ? '#008767' : '#1E293B', fontFamily: "system-ui, -apple-system, sans-serif" }}>
                          {divName}
                        </span>
                      </div>
                      {isSel && (
                        <span style={{
                          background: '#E6F4EA', color: '#008767',
                          fontSize: 11.5, fontWeight: 700,
                          borderRadius: 10, padding: '2px 8px'
                        }}>
                          15
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ACCORDION 3: District */}
          <div style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div 
              onClick={() => toggleAccordion('district')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconMapPin size={18} color="#475569" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    জেলা (District)
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {getSelectedLabel('district') || 'সব জেলা'}
                  </div>
                </div>
              </div>
              {openAccordions.district ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>
            {openAccordions.district && (
              <div style={{ paddingBottom: 10 }}>
                {!selectedDivision ? (
                  <div style={{ color: '#94A3B8', fontSize: 12.5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    দয়া করে প্রথমে একটি বিভাগ সিলেক্ট করুন।
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {districts.map(d => {
                      const isSel = String(selectedDistrict) === String(d.id)
                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDistrict(isSel ? '' : d.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', cursor: 'pointer' }}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: 4,
                            border: isSel ? 'none' : '1.5px solid #CBD5E1',
                            background: isSel ? '#008767' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {isSel && <IconCheck size={13} color="white" stroke={3} />}
                          </div>
                          <span style={{ fontSize: 13.5, fontWeight: isSel ? 700 : 600, color: isSel ? '#008767' : '#1E293B' }}>
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

          {/* ACCORDION 4: Hospital */}
          <div style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div 
              onClick={() => toggleAccordion('hospital')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconBuildingHospital size={18} color="#475569" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    হাসপাতাল (Hospital)
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {getSelectedLabel('hospital') || 'সব হাসপাতাল'}
                  </div>
                </div>
              </div>
              {openAccordions.hospital ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>
            {openAccordions.hospital && (
              <div style={{ paddingBottom: 10 }}>
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="হাসপাতাল খুঁজুন..."
                    value={hospitalSearch}
                    onChange={e => setHospitalSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#FAFAFA', fontSize: 13, outline: 'none', fontFamily: "'Hind Siliguri', sans-serif" }}
                  />
                  <IconSearch size={15} color="#94A3B8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {hospitals
                    .filter(h => (h.name || h.name_bn || '').toLowerCase().includes(hospitalSearch.toLowerCase()))
                    .map(h => {
                      const isSel = String(selectedHospital) === String(h.id)
                      return (
                        <div
                          key={h.id}
                          onClick={() => setSelectedHospital(isSel ? '' : h.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', cursor: 'pointer' }}
                        >
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: isSel ? 'none' : '1.5px solid #CBD5E1', background: isSel ? '#008767' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isSel && <IconCheck size={13} color="white" stroke={3} />}
                          </div>
                          <span style={{ fontSize: 13.5, fontWeight: isSel ? 700 : 600, color: isSel ? '#008767' : '#1E293B' }}>
                            {h.name || h.name_bn}
                          </span>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 5: Consultation Fee */}
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: openAccordions.fee ? 14 : 0 }}>
            <div 
              onClick={() => toggleAccordion('fee')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconLock size={18} color="#475569" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  ভিজিট ফি (Consultation Fee)
                </span>
              </div>
              {openAccordions.fee ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>

            {openAccordions.fee && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
                <div 
                  onClick={() => setSelectedFee('')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', cursor: 'pointer' }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: !selectedFee ? '2px solid #008767' : '1.5px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                    {!selectedFee && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#008767' }} />}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: !selectedFee ? 700 : 500, color: !selectedFee ? '#1E293B' : '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    সব ফি
                  </span>
                </div>
                {FEE_RANGES.map(f => {
                  const isSel = selectedFee === f.id
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFee(isSel ? '' : f.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', cursor: 'pointer' }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: isSel ? '2px solid #008767' : '1.5px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                        {isSel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#008767' }} />}
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: isSel ? 700 : 500, color: isSel ? '#1E293B' : '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>
                        {f.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ACCORDION 6: Experience */}
          <div style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div 
              onClick={() => toggleAccordion('exp')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconTrash size={18} color="#475569" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    অভিজ্ঞতা (Experience)
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {getSelectedLabel('exp') || 'সব অভিজ্ঞতা'}
                  </div>
                </div>
              </div>
              {openAccordions.exp ? <IconChevronUp size={18} color="#64748B" /> : <IconChevronDown size={18} color="#64748B" />}
            </div>
            {openAccordions.exp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 10 }}>
                {EXP_RANGES.map(e => {
                  const isSel = selectedExp === e.id
                  return (
                    <div
                      key={e.id}
                      onClick={() => setSelectedExp(isSel ? '' : e.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', cursor: 'pointer' }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: isSel ? '2px solid #008767' : '1.5px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                        {isSel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#008767' }} />}
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: isSel ? 700 : 500, color: isSel ? '#1E293B' : '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>
                        {e.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* TOGGLES: Today & Telemedicine */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>
              আজ অ্যাপয়েন্টমেন্ট আছে
            </span>
            <div 
              onClick={() => setAvailableToday(!availableToday)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: availableToday ? '#008767' : '#CBD5E1',
                padding: 2, cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center',
                justifyContent: availableToday ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>
              ভিডিও কনসালটেশন উপলব্ধ
            </span>
            <div 
              onClick={() => setTelemedicineOnly(!telemedicineOnly)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: telemedicineOnly ? '#008767' : '#CBD5E1',
                padding: 2, cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center',
                justifyContent: telemedicineOnly ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer Buttons */}
        <div style={{ display: 'flex', gap: 12, padding: '16px 24px calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid #F1F5F9', background: 'white' }}>
          <button 
            type="button"
            onClick={handleClearAllFilters}
            style={{
              flex: 1, height: 46, borderRadius: 10,
              border: '1.5px solid #E2E8F0', background: 'white',
              color: '#008767', fontWeight: 800, fontSize: 14,
              cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif"
            }}
          >
            রিসেট
          </button>
          <button 
            type="button"
            onClick={handleApplyFilters}
            style={{
              flex: 2, height: 46, borderRadius: 10,
              background: '#008767', border: 'none',
              color: 'white', fontWeight: 800, fontSize: 14,
              cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif",
              boxShadow: '0 4px 12px rgba(0, 135, 103, 0.25)'
            }}
          >
            প্রয়োগ করুন {total ? `(${total})` : ''}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── MAIN PAGE ───────────────────────── */
function DoctorsPage() {
  const [searchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('slider')
  const [filterParams, setFilterParams] = useState(() => {
    const p = {}
    if (searchParams.get('specialty_id')) p.specialty_id = searchParams.get('specialty_id')
    if (searchParams.get('division_id')) p.division_id = searchParams.get('division_id')
    if (searchParams.get('district_id')) p.district_id = searchParams.get('district_id')
    if (searchParams.get('upazila_id')) p.upazila_id = searchParams.get('upazila_id')
    if (searchParams.get('union_id')) p.union_id = searchParams.get('union_id')
    if (searchParams.get('search')) p.search = searchParams.get('search')
    if (searchParams.get('hospital_id')) p.hospital_id = searchParams.get('hospital_id')
    return p
  })

  const [sortBy, setSortBy] = useState('relevance')

  const { doctors, total, loading, fetchingNext, hasMore, fetchMore, error, refresh } = useInfiniteDoctors(filterParams)

  const sortedDoctors = useMemo(() => {
    let list = [...doctors]
    
    // Client-side filtering if backend ignores these custom params
    if (filterParams.fee_range) {
      const [minStr, maxStr] = filterParams.fee_range.split('-')
      const min = parseInt(minStr) || 0
      const max = parseInt(maxStr) || 99999
      list = list.filter(d => {
        const f = parseFloat(d.fee) || 0
        return f >= min && f <= max
      })
    }
    
    if (filterParams.exp_range) {
      const [minStr, maxStr] = filterParams.exp_range.split('-')
      const min = parseInt(minStr) || 0
      const max = parseInt(maxStr) || 99
      list = list.filter(d => {
        const eStr = String(d.experience || '0').replace(/[^0-9]/g, '')
        const e = parseInt(eStr) || 0
        return e >= min && e <= max
      })
    }

    if (filterParams.telemedicine) {
      list = list.filter(d => Boolean(d.available_telemedicine))
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
    return list // default relevance
  }, [doctors, sortBy, filterParams])

  const activeCount = Object.keys(filterParams).filter(k => filterParams[k]).length

  useEffect(() => {
    if (activeCount > 0) setViewMode('grid')
    else setViewMode('slider')
  }, [activeCount])

  const handleSearch = useCallback((params) => {
    setFilterParams(params)
    setViewMode(Object.keys(params).length > 0 ? 'grid' : 'slider')
  }, [])

  // ── Infinite scroll sentinel ──
  const sentinelRef = useRef(null)
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !fetchingNext) {
          fetchMore()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, fetchingNext, fetchMore])

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC' }}>
      <DoctorHero 
        onSearch={handleSearch} 
        total={total} 
        sortBy={sortBy} 
        setSortBy={setSortBy} 
      />

      <Container id="doctor-results" style={{ paddingTop: 16, paddingBottom: 60 }}>
        {/* DOCTOR GRID ALWAYS VISIBLE */}
        <div>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 results-header-row">
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>সকল ডাক্তার</h2>
            <div className="d-flex align-items-center gap-3">
              <p style={{ color: 'var(--mc-text-muted)', fontSize: 14, marginBottom: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                {loading ? 'লোড হচ্ছে...' : <><strong>{sortedDoctors.length}</strong> ডাক্তার দেখানো হচ্ছে {total ? `মোট ${total} এর মধ্যে` : ''}</>}
              </p>
              {activeCount > 0 && (
                <button onClick={() => handleSearch({})} style={{ background: 'transparent', border: '1px solid var(--mc-border)', borderRadius: 8, padding: '5px 14px', color: 'var(--mc-text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif" }}>✕ ফিল্টার মুছুন</button>
              )}
            </div>
          </div>

          {loading && <DoctorGridSkeleton count={6} />}
          {error && !loading && (
            <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <p style={{ color: '#c53030', marginBottom: 12 }}>⚠️ {error}</p>
              <button onClick={refresh} style={{ background: '#00A88C', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>আবার চেষ্টা করুন</button>
            </div>
          )}
          {!loading && sortedDoctors.length > 0 && (
            <Row className="g-4">
              {sortedDoctors.map(doctor => (
                <Col key={doctor.id} xs={12} md={6} xl={4}>
                  <DoctorCard doctor={doctor} showBookingButton={true} />
                </Col>
              ))}
            </Row>
          )}
          {!loading && !error && sortedDoctors.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', marginTop: 20 }}>
              <div style={{ width: 80, height: 80, background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <IconSearch size={40} color="#3B82F6" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', marginBottom: 10, fontFamily: "'Hind Siliguri', sans-serif" }}>কোনো ডাক্তার পাওয়া যায়নি</h3>
              <p style={{ color: '#64748B', fontSize: 15, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5, fontFamily: "'Hind Siliguri', sans-serif" }}>আপনার নির্বাচিত ফিল্টার অনুযায়ী কোনো ডাক্তার খুঁজে পাওয়া যায়নি।</p>
              <button onClick={() => handleSearch({})} style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif" }}>ফিল্টার মুছুন</button>
            </div>
          )}

          {/* ── Infinite scroll sentinel ── */}
          <div ref={sentinelRef} style={{ height: 40, marginTop: 20 }} />
          {fetchingNext && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <DoctorGridSkeleton count={3} />
            </div>
          )}
          {!hasMore && !loading && sortedDoctors.length > 0 && (
            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 14, marginTop: 24, fontFamily: "'Hind Siliguri', sans-serif" }}>সকল ডাক্তার দেখানো হয়েছে ✓</p>
          )}

        </div>

        {/* FEATURES BANNER */}
        <div style={{ background: '#F0FDF4', borderRadius: 24, padding: '40px', marginTop: 60, border: '1px solid #DCFCE7' }}>
          <Row className="g-4">
            {[
              { icon: <IconShieldCheck size={30} color="#00A88C" />, title: 'যাচাইকৃত ডাক্তার', desc: 'আমাদের সকল ডাক্তার যাচাইকৃত এবং অভিজ্ঞ' },
              { icon: <IconLock size={30} color="#00A88C" />, title: 'নিরাপদ অ্যাপয়েন্টমেন্ট', desc: 'নিরাপদ ও সহজ অ্যাপয়েন্টমেন্ট ব্যবস্থা' },
              { icon: <IconClock size={30} color="#00A88C" />, title: 'সময় সাশ্রয়ী', desc: 'সহজেই খুঁজে নিন কাছের ডাক্তার ও সময়' },
              { icon: <IconHeadset size={30} color="#00A88C" />, title: 'সাপোর্ট সেবা', desc: 'যেকোনো প্রয়োজনে আমাদের সাপোর্ট টিম আছে' },
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

export default DoctorsPage

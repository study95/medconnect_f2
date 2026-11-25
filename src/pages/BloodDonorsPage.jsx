import React, { useState, useEffect, useCallback } from 'react'
import { Container, Row, Col, Modal, Button, Form, Spinner, Badge } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import { 
  IconDroplet, IconHeart, IconSearch, IconMapPin, IconPhone, IconPhoneCall, 
  IconCircleCheck, IconClock, IconUserCheck, IconAlertCircle, IconRotate, 
  IconShieldCheck, IconX, IconChevronRight, IconShare, IconUsers, IconActivity,
  IconArrowRight, IconCalendar, IconChevronDown, IconChevronUp, IconAdjustmentsHorizontal,
  IconBuildingHospital, IconNavigation, IconCheck, IconGridDots, IconListDetails, IconUser,
  IconLock
} from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { getBloodDonors, revealDonorContact } from '../api/bloodDonorApi'
import { getDivisions, getDistricts, getUpazilas, getUnions } from '../api/locationApi'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined && str !== '' ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

// Return name exactly as provided from database without cutting
const getLocationRawName = (loc) => {
  if (!loc) return ''
  if (typeof loc === 'string') return loc.trim()
  return (loc.bangla_name || loc.name || '').trim()
}

// Return structured address info for a donor: primary hierarchy (exact DB values) and secondary street detail
const getDonorAddressInfo = (donor) => {
  if (!donor) return { areaHierarchy: 'ঠিকানা দেওয়া নেই', streetAddress: '' }
  const unionName = getLocationRawName(donor.union)
  const upazilaName = getLocationRawName(donor.upazila)
  const districtName = getLocationRawName(donor.district)
  const rawParts = [unionName, upazilaName, districtName].filter(Boolean)
  const uniqueParts = rawParts.filter((item, idx) => rawParts.indexOf(item) === idx)
  const areaHierarchy = uniqueParts.join(', ') || 'ঠিকানা দেওয়া নেই'

  let streetAddress = (donor.village_or_area || '').trim()
  streetAddress = streetAddress.replace(/[,.\s]+$/, '')
  return { areaHierarchy, streetAddress }
}

function BloodDonorSkeletonGrid({ count = 6, viewMode = 'grid' }) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (viewMode === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(i => (
          <div key={i} style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="blood-skeleton-box" style={{ width: 48, height: 48, borderRadius: '50%' }} />
              <div>
                <div className="blood-skeleton-box" style={{ width: 140, height: 16, marginBottom: 8 }} />
                <div className="blood-skeleton-box" style={{ width: 220, height: 12 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="blood-skeleton-box" style={{ width: 100, height: 28, borderRadius: 99 }} />
              <div className="blood-skeleton-box" style={{ width: 110, height: 38, borderRadius: 10 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Row className="g-3 g-md-4">
      {items.map(i => (
        <Col xs={12} sm={6} lg={4} key={i}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '20px 18px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="blood-skeleton-box" style={{ width: 44, height: 24, borderRadius: 8 }} />
              <div className="blood-skeleton-box" style={{ width: 90, height: 22, borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="blood-skeleton-box" style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="blood-skeleton-box" style={{ width: '70%', height: 16, marginBottom: 8 }} />
                <div className="blood-skeleton-box" style={{ width: '45%', height: 12 }} />
              </div>
            </div>
            <div className="blood-skeleton-box" style={{ width: '90%', height: 14, marginBottom: 14 }} />
            <div className="blood-skeleton-box" style={{ width: '60%', height: 14, marginBottom: 18 }} />
            <div className="blood-skeleton-box" style={{ width: '100%', height: 42, borderRadius: 12 }} />
          </div>
        </Col>
      ))}
    </Row>
  )
}

export default function BloodDonorsPage() {
  const navigate = useNavigate()

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  const [availableOnly, setAvailableOnly] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewModeState] = useState(() => {
    try {
      return localStorage.getItem('blood_donors_view_mode') || 'grid'
    } catch {
      return 'grid'
    }
  })

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const setViewMode = (mode) => {
    setViewModeState(mode)
    try {
      localStorage.setItem('blood_donors_view_mode', mode)
    } catch {}
  }

  const activeFilterCount = (selectedGroup ? 1 : 0) + 
                            (divisionId ? 1 : 0) + 
                            (districtId ? 1 : 0) + 
                            (upazilaId ? 1 : 0) + 
                            (unionId ? 1 : 0) + 
                            (!availableOnly ? 1 : 0) +
                            (debouncedSearch.trim() ? 1 : 0)

  // Location Cascade Dropdown Options
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])

  // Data & Pagination
  const [donors, setDonors] = useState([])
  const [perPage, setPerPage] = useState(10)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
  const [loading, setLoading] = useState(false)

  // Reveal Modal State
  const [revealedDonor, setRevealedDonor] = useState(null)
  const [numberCopied, setNumberCopied] = useState(false)
  const [revealLoading, setRevealLoading] = useState(false)
  const [securityNotice, setSecurityNotice] = useState(null)

  // 1. Load Divisions on Mount
  useEffect(() => {
    getDivisions()
      .then(res => setDivisions(res.data?.data || []))
      .catch(() => {})
  }, [])

  // 2. Cascade: Districts
  useEffect(() => {
    if (!divisionId) {
      setDistricts([])
      setDistrictId('')
      setUpazilas([])
      setUpazilaId('')
      setUnions([])
      setUnionId('')
      return
    }
    getDistricts({ division_id: divisionId })
      .then(res => {
        setDistricts(res.data?.data || [])
        setDistrictId('')
        setUpazilas([])
        setUpazilaId('')
        setUnions([])
        setUnionId('')
      })
      .catch(() => {})
  }, [divisionId])

  // 3. Cascade: Upazilas
  useEffect(() => {
    if (!districtId) {
      setUpazilas([])
      setUpazilaId('')
      setUnions([])
      setUnionId('')
      return
    }
    getUpazilas({ district_id: districtId })
      .then(res => {
        setUpazilas(res.data?.data || [])
        setUpazilaId('')
        setUnions([])
        setUnionId('')
      })
      .catch(() => {})
  }, [districtId])

  // 4. Cascade: Unions
  useEffect(() => {
    if (!upazilaId) {
      setUnions([])
      setUnionId('')
      return
    }
    getUnions({ upazila_id: upazilaId })
      .then(res => {
        setUnions(res.data?.data || [])
        setUnionId('')
      })
      .catch(() => {})
  }, [upazilaId])

  // 5. Fetch Donors
  const fetchDonors = useCallback(async (page = 1, currentPerPage = perPage) => {
    setLoading(true)
    try {
      const params = {
        page,
        per_page: currentPerPage,
        available_only: availableOnly,
      }
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
      if (selectedGroup) params.blood_group = selectedGroup
      if (divisionId) params.division_id = divisionId
      if (districtId) params.district_id = districtId
      if (upazilaId) params.upazila_id = upazilaId
      if (unionId) params.union_id = unionId

      const res = await getBloodDonors(params)
      if (res.data?.success) {
        setDonors(res.data.data.data || [])
        setPagination({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          total: res.data.data.total,
          from: res.data.data.from,
          to: res.data.data.to,
        })
      }
    } catch (err) {
      console.error('Failed to load blood donors:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedGroup, divisionId, districtId, upazilaId, unionId, availableOnly, perPage, debouncedSearch])

  useEffect(() => {
    fetchDonors(1)
  }, [fetchDonors])

  const handleResetFilters = () => {
    setSearchQuery('')
    setDebouncedSearch('')
    setSelectedGroup('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
    setAvailableOnly(true)
  }

  // Handle Contact Reveal
  const handleRevealContact = async (donor) => {
    setRevealLoading(true)
    toast.dismiss()
    try {
      const res = await revealDonorContact(donor.id)
      if (res.data?.success) {
        setRevealedDonor({
          ...donor,
          contact_number: res.data.contact_number,
          primary_contact_number: res.data.primary_contact_number,
          alternate_contact_number: res.data.alternate_contact_number,
          is_alternate: Boolean(res.data.is_alternate),
          remaining: res.data.remaining_reveals_hour,
        })
      }
    } catch (err) {
      toast.dismiss()
      if (err.response?.status === 429) {
        const data = err.response?.data || {}
        setSecurityNotice({
          type: 'rate_limit',
          title: 'রক্তদাতা সুরক্ষা ও নিরাপত্তা সীমা',
          subtitle: 'রক্তদাতাদের ব্যক্তিগত তথ্যের সুরক্ষা এবং স্প্যামিং প্রতিরোধে এই সীমা কার্যকর রয়েছে।',
          message: data.message,
          limit: data.limit || 5,
          isGuest: data.is_guest ?? true,
          retryAfterMinutes: data.retry_after_minutes || 60,
          retryAfterSeconds: data.retry_after_seconds || 3600,
          buttonText: 'বুঝেছি, ধন্যবাদ'
        })
      } else if (err.response?.status === 401 && err.response?.data?.requires_login) {
        setSecurityNotice({
          type: 'login_required',
          title: 'লগইন আবশ্যক',
          subtitle: 'রক্তদাতার অনুরোধক্রমে যোগাযোগ নম্বর দেখতে সাইন-ইন প্রয়োজন।',
          message: 'এই রক্তদাতার নিরাপত্তা ও অনুরোধক্রমে কন্টাক্ট নম্বর দেখার জন্য অ্যাকাউন্টে লগইন করা আবশ্যক।',
          buttonText: 'লগইন করুন',
          actionUrl: '/login?redirect=' + encodeURIComponent(window.location.pathname)
        })
      } else {
        setSecurityNotice({
          type: 'general',
          title: 'যোগাযোগ নম্বর দেখা সম্ভব হয়নি',
          subtitle: 'সার্ভার সংযোগে সাময়িক বিলম্ব দেখা দিয়েছে।',
          message: err.response?.data?.message || 'অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          buttonText: 'ঠিক আছে'
        })
      }
    } finally {
      setRevealLoading(false)
    }
  }

  return (
    <div className="blood-page-container" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 60, fontFamily: "'Hind Siliguri', 'Inter', sans-serif" }}>

      <style>{`
        @keyframes bloodCardPulse {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .blood-skeleton-box {
          background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
          background-size: 200% 100%;
          animation: bloodCardPulse 1.5s ease-in-out infinite;
          border-radius: 8px;
        }
        .donor-search-wrap:focus-within {
          border-color: #00A88C !important;
          box-shadow: 0 0 0 3px rgba(0, 168, 140, 0.12) !important;
        }

        .blood-page-container {
          padding-top: var(--header-height, 90px);
        }
        .blood-breadcrumb-wrapper > div {
          padding: 8px 0 0 !important;
        }
        .blood-breadcrumb-wrapper .container {
          padding-left: 0 !important;
          padding-right: 0 !important;
          max-width: 100% !important;
        }

        /* ── HERO BANNER STYLING ── */
        .blood-hero-wrapper {
          background: radial-gradient(circle at 10% 20%, rgba(225, 29, 72, 0.04) 0%, transparent 45%),
                      radial-gradient(circle at 90% 15%, rgba(0, 168, 140, 0.05) 0%, transparent 50%),
                      linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
          border-bottom: 1px solid #E2E8F0;
          padding: 16px 0 32px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        .blood-hero-grid-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#E2E8F0 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.5;
          pointer-events: none;
        }

        /* ── STATIC DROPLET & DRIPPING BEAD ── */
        .blood-droplet-card {
          background: #FFFFFF;
          border-radius: 24px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 12px 36px -6px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(0, 0, 0, 0.02);
          padding: 26px 24px;
          position: relative;
          text-align: center;
          transition: all 0.25s ease;
        }
        .blood-droplet-card:hover {
          box-shadow: 0 16px 42px -6px rgba(225, 29, 72, 0.09);
          border-color: #FECDD3;
        }

        .blood-drip-stage {
          position: relative;
          width: 90px;
          height: 120px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Fixed static blood droplet: NO zoom, NO scale in/out */
        .main-droplet-fixed {
          filter: drop-shadow(0 6px 14px rgba(225, 29, 72, 0.35));
        }

        /* Realistic falling drip bead */
        .drip-falling-bead {
          animation: dropFallPhysics 2.4s cubic-bezier(0.5, 0, 0.75, 0.2) infinite;
          transform-origin: 50px 94px;
        }
        @keyframes dropFallPhysics {
          0% {
            cy: 94;
            r: 2.8;
            opacity: 0;
            transform: scale(0.6);
          }
          20% {
            cy: 96;
            r: 3.8;
            opacity: 0.95;
            transform: scale(1, 1.25);
          }
          50% {
            cy: 104;
            r: 3.5;
            opacity: 1;
            transform: scale(0.9, 1.35);
          }
          65% {
            cy: 112;
            r: 4.5;
            opacity: 0.9;
            transform: scale(1.4, 0.5);
          }
          75%, 100% {
            cy: 114;
            r: 5.5;
            opacity: 0;
            transform: scale(2, 0.1);
          }
        }

        /* Impact expanding ripple rings */
        .drip-impact-ring-1 {
          animation: rippleExpand1 2.4s ease-out infinite;
          transform-origin: 50px 114px;
          opacity: 0;
        }
        @keyframes rippleExpand1 {
          0%, 58% {
            transform: scale(0.2);
            opacity: 0;
          }
          64% {
            opacity: 0.85;
            stroke: #E11D48;
          }
          85% {
            transform: scale(1.8);
            opacity: 0.35;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        .drip-impact-ring-2 {
          animation: rippleExpand2 2.4s ease-out infinite;
          transform-origin: 50px 114px;
          opacity: 0;
        }
        @keyframes rippleExpand2 {
          0%, 64% {
            transform: scale(0.2);
            opacity: 0;
          }
          70% {
            opacity: 0.65;
            stroke: #FDA4AF;
          }
          90% {
            transform: scale(2.2);
            opacity: 0.2;
          }
          100% {
            transform: scale(2.9);
            opacity: 0;
          }
        }

        /* ECG heartbeat pulse wave line */
        .ecg-line {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: ecgSweep 2.4s linear infinite;
        }
        @keyframes ecgSweep {
          0% {
            stroke-dashoffset: 200;
          }
          40%, 100% {
            stroke-dashoffset: 0;
          }
        }

        /* ── LIVE FRIENDLY PILL BADGE ── */
        .friendly-hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 99px;
          background: #FFFFFF;
          border: 1px solid #FECDD3;
          box-shadow: 0 2px 8px rgba(225, 29, 72, 0.06);
          font-size: 13px;
          font-weight: 800;
          color: #9F1239;
          margin-bottom: 16px;
        }
        .live-pulse-dot-wrap {
          position: relative;
          width: 9px;
          height: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .live-pulse-dot-ping {
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: #E11D48;
          opacity: 0.75;
          animation: pingDot 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .live-pulse-dot-core {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #E11D48;
          position: relative;
          z-index: 1;
        }
        @keyframes pingDot {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        /* ── DONOR CARDS & FILTER ELEMENTS ── */
        .filter-card-container {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 6px 24px -4px rgba(15, 23, 42, 0.05), 0 2px 8px rgba(0, 0, 0, 0.02);
          border: 1.5px solid #E2E8F0;
          transition: all 0.25s ease;
        }
        .filter-card-container:hover {
          border-color: #CBD5E1;
          box-shadow: 0 14px 38px -4px rgba(15, 23, 42, 0.08);
        }

        /* Blood Group Pills */
        .group-pill-btn {
          border-radius: 12px;
          padding: 8px 18px;
          font-weight: 800;
          font-size: 14px;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          color: #334155;
          box-shadow: 0 2px 5px rgba(15, 23, 42, 0.02);
        }
        .group-pill-btn:hover {
          transform: translateY(-2px);
          border-color: #FECDD3;
          background: #FFF1F2;
          color: #BE123C;
          box-shadow: 0 4px 12px rgba(225, 29, 72, 0.1);
        }
        .group-pill-active {
          background: linear-gradient(135deg, #E11D48 0%, #BE123C 100%) !important;
          color: #FFFFFF !important;
          border-color: #E11D48 !important;
          box-shadow: 0 4px 16px rgba(225, 29, 72, 0.35) !important;
          transform: translateY(-2px);
        }
        .group-pill-inactive {
          background: #F8FAFC;
          color: #334155;
          border-color: #E2E8F0;
        }

        /* Sleek Location Select Box with Left Icon & Custom Chevron */
        .filter-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .filter-select-icon {
          position: absolute;
          left: 14px;
          pointer-events: none;
          z-index: 2;
          display: flex;
          align-items: center;
        }
        .filter-select-arrow {
          position: absolute;
          right: 14px;
          pointer-events: none;
          z-index: 2;
          color: #94A3B8;
          display: flex;
          align-items: center;
        }
        .location-select-box {
          width: 100%;
          height: 48px;
          padding: 0 38px 0 42px;
          border-radius: 14px;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 14px;
          color: #1E293B;
          font-weight: 600;
          outline: none;
          transition: all 0.2s ease;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        .location-select-box:hover:not(:disabled) {
          border-color: #CBD5E1;
          background: #FAFAFC;
        }
        .location-select-box:focus {
          border-color: #00A88C;
          box-shadow: 0 0 0 3px rgba(0, 168, 140, 0.12);
          background: #FFFFFF;
        }
        .location-select-box:disabled {
          background: #F8FAFC;
          color: #94A3B8;
          border-color: #EDF2F7;
          cursor: not-allowed;
        }

        /* iOS-style toggle switch */
        .filter-toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        .filter-toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .filter-toggle-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: #CBD5E1;
          transition: 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 99px;
        }
        .filter-toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .filter-toggle-switch input:checked + .filter-toggle-slider {
          background-color: #00A88C;
        }
        .filter-toggle-switch input:checked + .filter-toggle-slider:before {
          transform: translateX(20px);
        }

        /* Reset Pill Button */
        .filter-reset-pill-btn {
          background: #FFFFFF;
          color: #475569;
          border: 1.5px solid #E2E8F0;
          padding: 6px 14px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12.5px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.18s ease;
        }
        .filter-reset-pill-btn:hover {
          background: #FFF1F2;
          color: #BE123C;
          border-color: #FECDD3;
        }

        /* Hero Action Buttons */
        .hero-cta-btns {
          display: flex;
          width: 100%;
          max-width: 440px;
        }
        .hero-btn-register {
          width: 100%;
          padding: 11px 22px;
          border-radius: 14px;
          background: linear-gradient(135deg, #E11D48 0%, #BE123C 100%);
          color: #FFFFFF !important;
          font-weight: 800;
          font-size: 14px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 16px rgba(225, 29, 72, 0.28);
          transition: all 0.22s ease;
        }
        .hero-btn-register:hover {
          background: linear-gradient(135deg, #F43F5E 0%, #E11D48 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(225, 29, 72, 0.38);
          color: #FFFFFF !important;
        }

        .blood-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.03);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }
        .blood-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 168, 140, 0.09);
          border-color: #99F6E4;
        }
        .reveal-btn {
          background: #00A88C;
          color: #FFFFFF;
          border: none;
          padding: 9px 16px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 3px 10px rgba(0,168,140,0.2);
          transition: all 0.2s ease;
        }
        .reveal-btn:hover {
          background: #00937A;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,168,140,0.28);
        }

        /* ── VIEW MODE TOGGLE BUTTONS (Inspired by Doctors Page) ── */
        .blood-view-toggle {
          display: inline-flex;
          align-items: center;
          border: 1.5px solid #CBD5E1;
          border-radius: 10px;
          overflow: hidden;
          background: #FFFFFF;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .blood-view-btn {
          height: 32px;
          padding: 0 12px;
          border: none;
          background: #FFFFFF;
          color: #64748B;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .blood-view-btn.active {
          background: #00A88C;
          color: #FFFFFF;
        }
        .blood-view-btn:first-child {
          border-right: 1px solid #CBD5E1;
        }

        /* ── LIST VIEW CARD (Horizontal Card like DoctorCard) ── */
        .blood-list-card {
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: row;
          align-items: stretch;
          margin-bottom: 16px;
        }
        .blood-list-card:hover {
          border-color: #94A3B8;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
        }
        .blood-list-image-box {
          width: 210px;
          min-width: 210px;
          align-self: stretch;
          position: relative;
          background: #F1F5F9;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .blood-list-image-box img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          object-position: top center !important;
        }
        @media (max-width: 767px) {
          .blood-list-card {
            flex-direction: column !important;
          }
          .blood-list-image-box {
            width: 100% !important;
            min-width: 100% !important;
            height: 280px !important;
            align-self: auto !important;
          }
          .blood-list-image-box img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: top center !important;
          }
        }

        /* ── MOBILE-FIRST OPTIMIZATIONS ── */
        .blood-group-scroll-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
          padding: 6px 2px 8px;
        }

        #donor-search-filters {
          scroll-margin-top: calc(var(--header-height, 60px) + 12px);
        }

        @media (max-width: 991px) {
          .blood-hero-wrapper {
            padding: 12px 0 18px !important;
            margin-bottom: 14px !important;
          }
          .filter-card-container {
            padding: 18px 14px !important;
            border-radius: 18px !important;
            margin-bottom: 16px !important;
          }
        }

        @media (max-width: 767px) {
          .blood-page-container {
            padding-top: calc(var(--header-height, 58px) + 8px) !important;
            padding-bottom: 30px !important;
          }
          .blood-breadcrumb-wrapper > div {
            padding: 4px 0 0 !important;
          }
          .blood-hero-wrapper {
            padding: 4px 0 12px !important;
            margin-bottom: 10px !important;
          }
          .friendly-hero-pill {
            padding: 4px 10px !important;
            font-size: 11.5px !important;
            margin-bottom: 6px !important;
          }
          .blood-hero-title {
            font-size: 18px !important;
            line-height: 1.25 !important;
            margin-bottom: 5px !important;
          }
          .blood-hero-subtitle {
            font-size: 12px !important;
            line-height: 1.4 !important;
            margin-bottom: 10px !important;
          }
          .hero-cta-btns {
            width: 100% !important;
            max-width: 100% !important;
          }
          .hero-btn-register {
            width: 100% !important;
            padding: 9px 14px !important;
            font-size: 13px !important;
            border-radius: 12px !important;
            height: 42px !important;
            justify-content: center !important;
            gap: 8px !important;
          }
          .filter-card-container {
            padding: 0 !important;
            border-radius: 16px !important;
            margin-bottom: 12px !important;
          }
          .filter-card-body {
            padding: 12px 10px !important;
          }
          .blood-group-scroll-strip {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            padding: 6px 4px 8px 4px !important;
            margin-bottom: 10px !important;
            scrollbar-width: none;
          }
          .blood-group-scroll-strip::-webkit-scrollbar {
            display: none;
          }
          .group-pill-btn {
            padding: 6px 12px !important;
            font-size: 12.5px !important;
            flex-shrink: 0 !important;
          }
          .group-pill-active,
          .group-pill-btn:hover {
            transform: none !important;
          }
          .location-select-box {
            height: 38px !important;
            font-size: 12px !important;
            padding: 0 20px 0 28px !important;
            border-radius: 10px !important;
          }
          .filter-select-icon {
            left: 8px !important;
          }
          .filter-select-arrow {
            right: 6px !important;
          }
          .filter-select-icon svg {
            width: 13px !important;
            height: 13px !important;
          }
          .location-label {
            font-size: 11px !important;
            margin-bottom: 3px !important;
          }
          .location-section-title {
            font-size: 12px !important;
            margin-bottom: 6px !important;
            padding-top: 8px !important;
          }
          .filter-bottom-bar {
            margin-top: 10px !important;
            padding-top: 10px !important;
            gap: 8px !important;
            flex-wrap: nowrap !important;
          }
          .filter-reset-pill-btn {
            padding: 5px 10px !important;
            font-size: 11.5px !important;
            border-radius: 8px !important;
          }
          .toggle-text-main {
            font-size: 12px !important;
          }
          .toggle-text-sub {
            display: none !important;
          }
        }
      `}</style>

      {/* ── 1. CLEAN & USER-FRIENDLY HERO BANNER ───────────────────── */}
      <div className="blood-hero-wrapper">
        <div className="blood-hero-grid-pattern" />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <div className="blood-breadcrumb-wrapper" style={{ marginBottom: 4 }}>
            <BreadcrumbHUD links={[{ label: 'রক্তদাতা নেটওয়ার্ক', path: '/blood-donors' }]} variant="dark" />
          </div>

          <Row className="align-items-center g-3">
            {/* Left Column: Friendly, Warm Headline & Actions */}
            <Col lg={7}>
              {/* Friendly Emergency Pill */}
              <div className="friendly-hero-pill">
                <span className="live-pulse-dot-wrap">
                  <span className="live-pulse-dot-ping" />
                  <span className="live-pulse-dot-core" />
                </span>
                <span>জরুরি রক্তের প্রয়োজন? পাশে আছি আমরা</span>
              </div>

              {/* User-friendly Main Headline */}
              <h1 className="blood-hero-title" style={{ 
                fontSize: 'clamp(22px, 3.8vw, 38px)', 
                fontWeight: 900, 
                lineHeight: 1.25, 
                color: '#0F172A', 
                marginBottom: 8,
                letterSpacing: '-0.01em'
              }}>
                রক্তের প্রয়োজনে আপনার পাশে, <br className="d-none d-sm-block" />
                <span style={{ color: '#00A88C' }}>
                  খুঁজে নিন কাছের রক্তদাতা
                </span>
              </h1>

              {/* User-friendly Warm Subtitle */}
              <p className="blood-hero-subtitle" style={{ 
                fontSize: 15, 
                color: '#475569', 
                lineHeight: 1.6, 
                maxWidth: 580, 
                marginBottom: 14,
                fontWeight: 500
              }}>
                আপনার এলাকার প্রস্তুত থাকা রক্তদাতাদের সাথে সহজে যোগাযোগ করুন, <span className="d-none d-sm-inline">অথবা আপনিও রক্তদাতা হিসেবে যুক্ত হয়ে মানুষের জীবন বাঁচাতে এগিয়ে আসুন।</span>
              </p>

              {/* Simple User-friendly Badges (Hidden on mobile for space optimization) */}
              <div className="d-none d-md-flex" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 10, background: '#F1F5F9',
                  color: '#334155', fontSize: 13, fontWeight: 700, border: '1px solid #E2E8F0'
                }}>
                  <IconPhoneCall size={15} color="#00A88C" />
                  সরাসরি ফোন ও হোয়াটসঅ্যাপ
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 10, background: '#F1F5F9',
                  color: '#334155', fontSize: 13, fontWeight: 700, border: '1px solid #E2E8F0'
                }}>
                  <IconMapPin size={15} color="#E11D48" />
                  উপজেলা ও ইউনিয়ন ভিত্তিক
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 10, background: '#F1F5F9',
                  color: '#334155', fontSize: 13, fontWeight: 700, border: '1px solid #E2E8F0'
                }}>
                  <IconShieldCheck size={15} color="#00A88C" />
                  নিরাপদ ও নির্ভরযোগ্য
                </span>
              </div>

              {/* CTA Action: Donor Registration */}
              <div className="hero-cta-btns">
                <Link
                  to="/blood-donors/register"
                  className="hero-btn-register"
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.22)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconHeart size={14} fill="#FFFFFF" color="#FFFFFF" />
                  </span>
                  <span style={{ fontWeight: 800 }}>রক্তদাতা হিসেবে নিবন্ধন করুন</span>
                  <IconArrowRight size={15} color="#FFFFFF" style={{ opacity: 0.9 }} />
                </Link>
              </div>
            </Col>

            {/* Right Column: Clean Showcase Card (Desktop Only - Hidden on Mobile) */}
            <Col lg={5} className="d-none d-lg-block">
              <div className="blood-droplet-card">
                {/* Blood Droplet Graphic: Static droplet + Falling drop */}
                <div className="blood-drip-stage">
                  <svg width="90" height="120" viewBox="0 0 90 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      {/* Rich Red Gradient */}
                      <linearGradient id="mainBloodGrad" x1="16" y1="8" x2="74" y2="76" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FF2E5B" />
                        <stop offset="45%" stopColor="#E11D48" />
                        <stop offset="100%" stopColor="#9F1239" />
                      </linearGradient>

                      {/* Gloss highlight reflection */}
                      <linearGradient id="bloodGloss" x1="30" y1="18" x2="40" y2="50" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* FIXED STATIC DROPLET - NO ZOOM/SCALE */}
                    <g className="main-droplet-fixed">
                      <path
                        d="M45 8 C45 8, 77 44, 77 62 C77 79.67, 62.67 94, 45 94 C27.33 94, 13 79.67, 13 62 C13 44, 45 8, 45 8 Z"
                        fill="url(#mainBloodGrad)"
                      />
                      <path
                        d="M36 22 C36 22, 24 38, 24 54 C24 64, 28 72, 32 76 C27 70, 26 62, 26 54 C26 40, 36 22, 36 22 Z"
                        fill="url(#bloodGloss)"
                      />
                      <ellipse cx="38" cy="38" rx="3" ry="6.5" transform="rotate(-25 38 38)" fill="#FFFFFF" opacity="0.65" />
                    </g>

                    {/* Single falling drop bead under gravity */}
                    <circle cx="45" cy="94" r="3.5" fill="#E11D48" className="drip-falling-bead" />

                    {/* Ripple impact waves at bottom surface */}
                    <ellipse cx="45" cy="114" rx="14" ry="3" fill="none" stroke="#E11D48" strokeWidth="1.6" className="drip-impact-ring-1" />
                    <ellipse cx="45" cy="114" rx="20" ry="4" fill="none" stroke="#FDA4AF" strokeWidth="1.2" className="drip-impact-ring-2" />
                  </svg>
                </div>

                {/* Friendly Card Title */}
                <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 18, marginBottom: 4 }}>
                  কোন গ্রুপের রক্ত প্রয়োজন?
                </h4>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>
                  গ্রুপে চাপ দিয়ে সহজেই রক্তদাতা খুঁজে নিন
                </p>

                {/* 8 Clickable Blood Group Chips */}
                <div style={{ 
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 
                }}>
                  {BLOOD_GROUPS.map(bg => {
                    const isSelected = selectedGroup === bg
                    return (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => {
                          setSelectedGroup(isSelected ? '' : bg)
                          setShowFilters(true)
                          const el = document.getElementById('donor-search-filters')
                          if (el) el.scrollIntoView({ behavior: 'smooth' })
                        }}
                        style={{
                          padding: '8px 4px',
                          borderRadius: 10,
                          fontWeight: 900,
                          fontSize: 14,
                          border: isSelected ? '1.5px solid #E11D48' : '1.5px solid #E2E8F0',
                          background: isSelected ? '#E11D48' : '#F8FAFC',
                          color: isSelected ? '#FFFFFF' : '#1E293B',
                          boxShadow: isSelected ? '0 4px 12px rgba(225,29,72,0.25)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {bg}
                      </button>
                    )
                  })}
                </div>

                {/* Smooth Heartbeat ECG Line */}
                <div style={{ width: '100%', height: 22, margin: '4px 0 8px', overflow: 'hidden' }}>
                  <svg viewBox="0 0 300 22" style={{ width: '100%', height: '100%' }}>
                    <path
                      d="M 0,11 L 80,11 L 95,3 L 105,19 L 115,7 L 125,15 L 135,11 L 200,11 L 215,3 L 225,19 L 235,7 L 245,15 L 255,11 L 300,11"
                      fill="none"
                      stroke="#E11D48"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ecg-line"
                    />
                  </svg>
                </div>

                {/* Reassuring Friendly Footnote */}
                <div style={{
                  paddingTop: 10, borderTop: '1px solid #F1F5F9',
                  fontSize: 12, color: '#64748B', fontWeight: 600
                }}>
                  একজন সুস্থ মানুষ প্রতি ৩ মাস পর রক্ত দিতে পারেন ❤️
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* ── 2. SEARCH & FILTER CARD (COLLAPSIBLE / ACCORDION) ──────────── */}
      <Container id="donor-search-filters" style={{ marginBottom: 16 }}>
        {/* Modern Live Search Bar (Matching Doctors Page) */}
        <div 
          className="donor-search-wrap"
          style={{
            position: 'relative',
            marginBottom: 10,
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            alignItems: 'center',
            padding: '7px 14px',
            transition: 'all 0.2s ease',
          }}
        >
          <IconSearch size={18} color="#94A3B8" style={{ flexShrink: 0, marginRight: 10 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="রক্তদাতার নাম বা গ্রাম/এলাকা দিয়ে খুঁজুন... (যেমন: রহিম, ধানমন্ডি)"
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: 14,
              fontWeight: 600,
              color: '#0F172A',
              background: 'transparent'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                border: 'none',
                background: '#F1F5F9',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
                marginLeft: 8,
                flexShrink: 0
              }}
              title="মুছে ফেলুন"
            >
              <IconX size={13} />
            </button>
          )}
        </div>

        <div className="filter-card-container" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Clickable Header Bar to Open/Close Filter (Strictly Single Row) */}
          <div 
            onClick={() => setShowFilters(prev => !prev)}
            style={{
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
              background: showFilters ? '#F8FAFC' : '#FFFFFF',
              borderBottom: showFilters ? '1px solid #F1F5F9' : 'none',
              transition: 'background 0.2s ease',
              gap: 8,
              minHeight: 46
            }}
          >
            {/* Left: Icon + Title + Badge (One Single Line) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: activeFilterCount > 0 ? '#FFF1F2' : '#F0FDFA',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {activeFilterCount > 0 ? (
                  <IconDroplet size={16} color="#E11D48" />
                ) : (
                  <IconAdjustmentsHorizontal size={16} color="#00A88C" />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                <span style={{ 
                  fontSize: 13, 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  whiteSpace: 'nowrap'
                }}>
                  রক্তের গ্রুপ ও এলাকা
                </span>
                {activeFilterCount > 0 && (
                  <span style={{
                    background: '#E11D48', color: '#FFFFFF',
                    fontSize: 10, fontWeight: 800,
                    padding: '1px 6px', borderRadius: 99,
                    whiteSpace: 'nowrap', flexShrink: 0
                  }}>
                    {toBn(activeFilterCount)}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Small, Compact Pill Button */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: showFilters ? '#FFF1F2' : '#F0FDFA',
              color: showFilters ? '#BE123C' : '#00A88C',
              padding: '3px 8px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 800,
              border: showFilters ? '1px solid #FECDD3' : '1px solid #99F6E4',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}>
              <span>{showFilters ? 'বন্ধ' : 'ফিল্টার'}</span>
              {showFilters ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
            </div>
          </div>

          {/* Filter Body - shown ONLY when showFilters is true */}
          {showFilters && (
            <div className="filter-card-body" style={{ padding: '16px 18px' }}>
              {/* Blood Group Pills (Horizontal scroll strip on mobile) */}
              <div className="blood-group-scroll-strip">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('')}
                  className={`group-pill-btn ${selectedGroup === '' ? 'group-pill-active' : 'group-pill-inactive'}`}
                >
                  <IconAdjustmentsHorizontal size={15} />
                  সব গ্রুপ
                </button>

                {BLOOD_GROUPS.map(bg => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setSelectedGroup(bg)}
                    className={`group-pill-btn ${selectedGroup === bg ? 'group-pill-active' : 'group-pill-inactive'}`}
                  >
                    <IconDroplet size={14} />
                    {bg}
                  </button>
                ))}
              </div>

              {/* Location Section Heading */}
              <div className="location-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                <IconMapPin size={16} color="#00A88C" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                  এলাকা ফিল্টার (বিভাগ - ইউনিয়ন)
                </span>
              </div>

              {/* 4 Cascading Location Dropdowns (2x2 Compact Grid on Mobile) */}
              <Row className="g-2 g-md-3">
                {/* 1. Division */}
                <Col xs={6} lg={3}>
                  <label className="location-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    ১. বিভাগ
                  </label>
                  <div className="filter-select-wrapper">
                    <span className="filter-select-icon">
                      <IconMapPin size={15} color="#00A88C" />
                    </span>
                    <select
                      value={divisionId}
                      onChange={e => setDivisionId(e.target.value)}
                      className="location-select-box"
                    >
                      <option value="">সকল বিভাগ</option>
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                      ))}
                    </select>
                    <span className="filter-select-arrow">
                      <IconChevronDown size={15} />
                    </span>
                  </div>
                </Col>

                {/* 2. District */}
                <Col xs={6} lg={3}>
                  <label className="location-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    ২. জেলা
                  </label>
                  <div className="filter-select-wrapper">
                    <span className="filter-select-icon">
                      <IconBuildingHospital size={15} color="#0284C7" />
                    </span>
                    <select
                      value={districtId}
                      onChange={e => setDistrictId(e.target.value)}
                      disabled={!divisionId}
                      className="location-select-box"
                    >
                      <option value="">{divisionId ? 'সকল জেলা' : 'আগে বিভাগ'}</option>
                      {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                      ))}
                    </select>
                    <span className="filter-select-arrow">
                      <IconChevronDown size={15} />
                    </span>
                  </div>
                </Col>

                {/* 3. Upazila */}
                <Col xs={6} lg={3}>
                  <label className="location-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    ৩. উপজেলা / থানা
                  </label>
                  <div className="filter-select-wrapper">
                    <span className="filter-select-icon">
                      <IconNavigation size={15} color="#8B5CF6" />
                    </span>
                    <select
                      value={upazilaId}
                      onChange={e => setUpazilaId(e.target.value)}
                      disabled={!districtId}
                      className="location-select-box"
                    >
                      <option value="">{districtId ? 'সকল উপজেলা' : 'আগে জেলা'}</option>
                      {upazilas.map(u => (
                        <option key={u.id} value={u.id}>{u.bangla_name || u.name}</option>
                      ))}
                    </select>
                    <span className="filter-select-arrow">
                      <IconChevronDown size={15} />
                    </span>
                  </div>
                </Col>

                {/* 4. Union */}
                <Col xs={6} lg={3}>
                  <label className="location-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    ৪. ইউনিয়ন / ওয়ার্ড
                  </label>
                  <div className="filter-select-wrapper">
                    <span className="filter-select-icon">
                      <IconMapPin size={15} color="#EA580C" />
                    </span>
                    <select
                      value={unionId}
                      onChange={e => setUnionId(e.target.value)}
                      disabled={!upazilaId}
                      className="location-select-box"
                    >
                      <option value="">{upazilaId ? 'সকল ইউনিয়ন' : 'আগে উপজেলা'}</option>
                      {unions.map(un => (
                        <option key={un.id} value={un.id}>{un.bangla_name || un.name}</option>
                      ))}
                    </select>
                    <span className="filter-select-arrow">
                      <IconChevronDown size={15} />
                    </span>
                  </div>
                </Col>
              </Row>

              {/* Bottom Bar: Availability toggle & Reset strictly on same line */}
              <div className="filter-bottom-bar" style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', 
                marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9', gap: 8
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0, flex: 1, minWidth: 0 }}>
                  <div className="filter-toggle-switch">
                    <input
                      type="checkbox"
                      checked={availableOnly}
                      onChange={e => setAvailableOnly(e.target.checked)}
                    />
                    <span className="filter-toggle-slider" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className="toggle-text-main" style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'block', whiteSpace: 'nowrap' }}>
                      শুধুমাত্র প্রস্তুত <span className="d-none d-sm-inline">(Available) </span>রক্তদাতা
                    </span>
                    <span className="toggle-text-sub d-none d-md-block" style={{ fontSize: 11, color: '#64748B' }}>
                      বিশ্রামে থাকা রক্তদাতাদের তালিকা থেকে আড়াল রাখা হবে
                    </span>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="filter-reset-pill-btn"
                  title="ফিল্টার রিসেট করুন"
                >
                  <IconRotate size={13} />
                  <span>রিসেট</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Container>

      {/* ── 3. DONORS LIST ───────────────────────────────────── */}
      <Container style={{ marginTop: 14, marginBottom: 50 }}>
        {/* Results Count & View Mode Toggle Bar (Single Row, No Wrap) */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E2E8F0',
          gap: 10
        }}>
          {/* Left: Title & Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconUsers size={18} color="#00A88C" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexWrap: 'nowrap' }}>
              <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 16, margin: 0, whiteSpace: 'nowrap' }}>
                রক্তদাতাদের তালিকা
              </h4>
              <span style={{
                background: '#E6F6F4', color: '#047857', border: '1px solid #A7F3D0',
                padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0
              }}>
                {toBn(pagination.total)} জন
              </span>
            </div>
          </div>

          {/* Right: Grid & List Toggle in the same row */}
          <div className="blood-view-toggle" style={{ flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`blood-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="গ্রিড ভিউ"
            >
              <IconGridDots size={17} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`blood-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="লিস্ট ভিউ"
            >
              <IconListDetails size={17} />
            </button>
          </div>
        </div>

        {loading ? (
          <BloodDonorSkeletonGrid count={perPage <= 10 ? 6 : 9} viewMode={viewMode} />
        ) : donors.length === 0 ? (
          <div style={{ 
            background: '#FFFFFF', borderRadius: 24, padding: '60px 24px', 
            textAlign: 'center', border: '1.5px dashed #CBD5E1' 
          }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#FFF1F2', color: '#E11D48', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <IconAlertCircle size={36} />
            </div>
            <h5 style={{ fontWeight: 900, color: '#0F172A', fontSize: 20, marginBottom: 8 }}>
              কোনো রক্তদাতা পাওয়া যায়নি
            </h5>
            <p style={{ color: '#64748B', fontSize: 14.5, maxWidth: 440, margin: '0 auto 20px' }}>
              আপনার নির্বাচিত রক্তের গ্রুপ বা এলাকায় এই মুহূর্তে কোনো প্রস্তুত রক্তদাতা নেই। ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
            </p>
            <button
              onClick={handleResetFilters}
              style={{
                background: '#00A88C', color: '#FFFFFF', border: 'none',
                padding: '11px 24px', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,168,140,0.2)'
              }}
            >
              সকল রক্তদাতা দেখুন
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW CARDS (Matching DoctorCard Pic & Text) ── */
          <Row className="g-3 g-md-4">
            {donors.map(donor => (
              <Col key={donor.id} xs={12} sm={6} lg={4}>
                <div
                  className="blood-card"
                  style={{
                    background: 'white',
                    borderRadius: 14,
                    border: '1px solid #E5E7EB',
                    padding: '16px',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    {/* Doctor-style Top Avatar & Main Info */}
                    <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                      {/* Avatar Container (90px x 95px, rounded-12) */}
                      <div style={{ flexShrink: 0, position: 'relative', width: 90, height: 95 }}>
                        <div style={{
                          width: 90, height: 95, borderRadius: 12, overflow: 'hidden',
                          background: '#F1F5F9', border: '1px solid #E2E8F0'
                        }}>
                          {donor.photo_url ? (
                            <img
                              src={donor.photo_url}
                              alt={donor.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                            />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%',
                              background: '#F8FAFC',
                              color: '#94A3B8', display: 'flex',
                              alignItems: 'center', justifyContent: 'center'
                            }}>
                              <IconUser size={38} color="#CBD5E1" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Text Column (Matching DoctorCard text hierarchy) */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                        <h4 style={{
                          fontWeight: 800, color: '#0F172A', fontSize: 16,
                          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontFamily: "'Hind Siliguri', sans-serif",
                          lineHeight: 1.25
                        }} title={donor.name}>
                          {donor.name}
                        </h4>

                        {/* Ribbon Badge for Blood Group */}
                        <div style={{ marginTop: 2, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-block',
                            background: '#E11D48',
                            color: 'white',
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '2px 10px 2px 8px',
                            borderRadius: '4px 2px 2px 4px',
                            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
                            fontFamily: "'Hind Siliguri', sans-serif"
                          }}>
                            রক্তদাতা ({donor.blood_group})
                          </span>
                        </div>

                        {/* Gender & Age Subtitle */}
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {donor.gender === 'male' ? 'পুরুষ' : donor.gender === 'female' ? 'নারী' : 'অন্যান্য'}
                          {donor.age ? ` • বয়স: ${toBn(donor.age)} বছর` : ''}
                        </div>

                        {/* Total Donations moved to top beside avatar */}
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 3, fontFamily: "'Hind Siliguri', sans-serif" }}>
                          মোট রক্তদান: <b style={{ color: '#0F172A' }}>{toBn(donor.total_donations || 0)} বার</b>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Location & Readiness Box */}
                    <div style={{
                      background: '#F8FAFC', borderRadius: 10,
                      padding: '10px 12px', border: '1px solid #E2E8F0',
                      marginBottom: 14, fontSize: 12, color: '#475569'
                    }}>
                      {(() => {
                        const { areaHierarchy, streetAddress } = getDonorAddressInfo(donor);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <IconMapPin size={15} color="#00A88C" style={{ marginTop: 2, flexShrink: 0 }} />
                              <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 12.5, lineHeight: 1.4, fontFamily: "'Hind Siliguri', sans-serif" }}>
                                {areaHierarchy}
                              </span>
                            </div>
                            {streetAddress && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 5,
                                paddingLeft: 21,
                                fontSize: 11.5,
                                color: '#64748B',
                                fontFamily: "'Hind Siliguri', sans-serif",
                                lineHeight: 1.35
                              }}>
                                <span style={{
                                  background: '#EDF2F7',
                                  color: '#475569',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}>
                                  ঠিকানা
                                </span>
                                <span style={{ color: '#334155', fontWeight: 500 }}>
                                  {streetAddress}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Readiness status & last donation in grid view */}
                      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                        {donor.is_ready_to_donate ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            color: '#065F46', fontSize: 11, fontWeight: 700, fontFamily: "'Hind Siliguri', sans-serif"
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                            বর্তমানে রক্ত দিতে প্রস্তুত আছেন
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            color: '#92400E', fontSize: 11, fontWeight: 700, fontFamily: "'Hind Siliguri', sans-serif"
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                            বর্তমানে বিশ্রামে আছেন {donor.days_until_available ? `(${toBn(donor.days_until_available)} দিন পর)` : ''}
                          </span>
                        )}
                        {donor.last_donated_at && (
                          <span style={{ fontSize: 10.5, color: '#64748B' }}>
                            সর্বশেষ: <b style={{ color: '#0F172A' }}>{toBn(donor.last_donated_at)}</b>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Masked Contact & Call Button */}
                  <div style={{
                    paddingTop: 10, borderTop: '1px solid #F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8
                  }}>
                    <div>
                      <span style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#64748B', lineHeight: 1.3, fontFamily: "'Hind Siliguri', sans-serif" }}>
                        যোগাযোগ নম্বর
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', letterSpacing: '0.02em', lineHeight: 1.4 }}>
                        {donor.masked_contact}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRevealContact(donor)}
                      disabled={revealLoading}
                      className="reveal-btn"
                      style={{ padding: '8px 14px', fontSize: 12.5 }}
                    >
                      <IconPhoneCall size={15} />
                      <span>নম্বর দেখুন</span>
                    </button>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          /* ── LIST VIEW CARDS (Matching DoctorCard List View) ── */
          <div>
            {donors.map(donor => (
              <div
                key={donor.id}
                className="blood-list-card"
                style={{
                  background: 'white',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  padding: 0,
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  marginBottom: 16
                }}
              >
                {/* Left Featured Image Box (Matching DoctorCard doc-list-image-box) */}
                <div className="blood-list-image-box" style={{
                  width: 170,
                  minWidth: 170,
                  alignSelf: 'stretch',
                  position: 'relative',
                  background: '#F1F5F9',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  {donor.photo_url ? (
                    <img
                      src={donor.photo_url}
                      alt={donor.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', minHeight: 140,
                      background: '#F8FAFC',
                      color: '#94A3B8', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <IconUser size={52} color="#CBD5E1" />
                    </div>
                  )}
                </div>

                {/* Right Details Box (Matching DoctorCard Right Box) */}
                <div style={{
                  flex: 1,
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minWidth: 0
                }}>
                  <div>
                    {/* Top Title & Ribbon */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, width: '100%' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: '#0F172A',
                          margin: '0 0 6px 0',
                          fontFamily: "'Hind Siliguri', sans-serif",
                          lineHeight: 1.3
                        }}>
                          {donor.name}
                        </h3>

                        {/* Blood Group Ribbon + Gender/Age placed with Right Side Text */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{
                            display: 'inline-block',
                            background: '#E11D48',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '2px 10px 2px 8px',
                            borderRadius: '4px 2px 2px 4px',
                            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
                            fontFamily: "'Hind Siliguri', sans-serif"
                          }}>
                            রক্তের গ্রুপ: {donor.blood_group}
                          </span>

                          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                            {donor.gender === 'male' ? 'পুরুষ' : donor.gender === 'female' ? 'নারী' : 'অন্যান্য'}
                            {donor.age ? ` • বয়স: ${toBn(donor.age)} বছর` : ''}
                          </span>
                        </div>

                        {/* Location Section - Clean Professional Presentation */}
                        {(() => {
                          const { areaHierarchy, streetAddress } = getDonorAddressInfo(donor);
                          return (
                            <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {/* Primary Geographic Hierarchy */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                color: '#0F172A',
                                fontSize: 13.5,
                                fontWeight: 700,
                                fontFamily: "'Hind Siliguri', sans-serif",
                                lineHeight: 1.3
                              }}>
                                <IconMapPin size={16} color="#00A88C" style={{ flexShrink: 0 }} />
                                <span>{areaHierarchy}</span>
                              </div>

                              {/* Street/Village Detail if available */}
                              {streetAddress && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'baseline',
                                  gap: 6,
                                  paddingLeft: 22,
                                  fontSize: 12,
                                  color: '#64748B',
                                  fontFamily: "'Hind Siliguri', sans-serif",
                                  lineHeight: 1.4
                                }}>
                                  <span style={{
                                    background: '#F1F5F9',
                                    color: '#475569',
                                    padding: '1px 7px',
                                    borderRadius: 4,
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                    border: '1px solid #E2E8F0'
                                  }}>
                                    ঠিকানা
                                  </span>
                                  <span style={{ color: '#334155', fontWeight: 500 }}>
                                    {streetAddress}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Badges strip */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#64748B', flexWrap: 'wrap' }}>
                          <span>মোট রক্তদান: <b style={{ color: '#0F172A' }}>{toBn(donor.total_donations || 0)} বার</b></span>
                          {donor.last_donated_at && (
                            <span>সর্বশেষ রক্তদান: <b style={{ color: '#0F172A' }}>{toBn(donor.last_donated_at)}</b></span>
                          )}
                        </div>

                        {/* Readiness Status indicator: moved here cleanly */}
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {donor.is_ready_to_donate ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: '#ECFDF5',
                              color: '#065F46',
                              border: '1px solid #A7F3D0',
                              fontSize: 12,
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: 8,
                              fontFamily: "'Hind Siliguri', sans-serif"
                            }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                              বর্তমানে রক্ত দিতে প্রস্তুত আছেন
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: '#FFFBEB',
                              color: '#92400E',
                              border: '1px solid #FDE68A',
                              fontSize: 12,
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: 8,
                              fontFamily: "'Hind Siliguri', sans-serif"
                            }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                              বর্তমানে বিশ্রামে আছেন {donor.days_until_available ? `(পরবর্তী রক্তদান: ${toBn(donor.days_until_available)} দিন পর)` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Contact & Reveal Button */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9'
                  }}>
                    <div>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', lineHeight: 1.3, fontFamily: "'Hind Siliguri', sans-serif" }}>
                        যোগাযোগ নম্বর
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', letterSpacing: '0.02em', lineHeight: 1.4 }}>
                        {donor.masked_contact}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRevealContact(donor)}
                      disabled={revealLoading}
                      className="reveal-btn"
                    >
                      <IconPhoneCall size={16} />
                      <span>নম্বর দেখুন</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Standard Enterprise Pagination Footer (matching Image 2) */}
        {pagination.total > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginTop: 36,
            padding: '16px 20px',
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            {/* Left: Show [ per_page ] entries */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: '#475569', fontWeight: 600 }}>
              <span>Show</span>
              <select
                value={perPage}
                onChange={(e) => {
                  const newPerPage = Number(e.target.value)
                  setPerPage(newPerPage)
                  fetchDonors(1, newPerPage)
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            {/* Middle: Showing X-Y of Z entries */}
            <div style={{ fontSize: 13.5, color: '#475569', fontWeight: 600 }}>
              Showing {pagination.from ?? ((pagination.current_page - 1) * perPage + (pagination.total > 0 ? 1 : 0))}-{pagination.to ?? Math.min(pagination.current_page * perPage, pagination.total)} of {pagination.total} entries
            </div>

            {/* Right: Pagination Controls */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                disabled={pagination.current_page <= 1}
                onClick={() => fetchDonors(pagination.current_page - 1)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1.5px solid #CBD5E1',
                  background: pagination.current_page <= 1 ? '#F8FAFC' : '#FFFFFF',
                  color: pagination.current_page <= 1 ? '#94A3B8' : '#334155',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: pagination.current_page <= 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Previous
              </button>

              {Array.from({ length: Math.max(1, pagination.last_page || 1) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  type="button"
                  onClick={() => fetchDonors(page)}
                  style={{
                    minWidth: 34,
                    height: 34,
                    padding: '0 8px',
                    borderRadius: 8,
                    border: `1.5px solid ${pagination.current_page === page ? '#00A88C' : '#CBD5E1'}`,
                    background: pagination.current_page === page ? '#00A88C' : '#FFFFFF',
                    color: pagination.current_page === page ? '#FFFFFF' : '#334155',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={pagination.current_page >= (pagination.last_page || 1)}
                onClick={() => fetchDonors(pagination.current_page + 1)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1.5px solid #CBD5E1',
                  background: pagination.current_page >= (pagination.last_page || 1) ? '#F8FAFC' : '#FFFFFF',
                  color: pagination.current_page >= (pagination.last_page || 1) ? '#94A3B8' : '#334155',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: pagination.current_page >= (pagination.last_page || 1) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Container>

      {/* ── 4. REVEAL NUMBER MODAL (POPUP) ────────────────────── */}
      <Modal 
        show={!!revealedDonor} 
        onHide={() => setRevealedDonor(null)}
        centered
        dialogClassName="blood-reveal-modal"
      >
        <Modal.Body style={{ padding: '32px 24px', textAlign: 'center', borderRadius: 24, background: '#FFFFFF', position: 'relative' }}>
          {/* Close Button in top right */}
          <button
            type="button"
            onClick={() => setRevealedDonor(null)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#F1F5F9',
              border: 'none',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
              zIndex: 10
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#E2E8F0'
              e.currentTarget.style.color = '#0F172A'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#F1F5F9'
              e.currentTarget.style.color = '#64748B'
            }}
          >
            <IconX size={18} />
          </button>

          {revealedDonor && (
            <>
              {/* Modern Centered Donor Avatar with Blood Group Badge */}
              <div style={{
                position: 'relative',
                width: 80,
                height: 80,
                margin: '0 auto 12px auto'
              }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #00A88C',
                  boxShadow: '0 4px 14px rgba(0, 168, 140, 0.2)',
                  background: '#F1F5F9'
                }}>
                  {revealedDonor.photo_url ? (
                    <img
                      src={revealedDonor.photo_url}
                      alt={revealedDonor.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
                      <IconUser size={38} color="#94A3B8" />
                    </div>
                  )}
                </div>
                {/* Blood Group Badge attached to bottom of Avatar */}
                <span style={{
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#E11D48',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '2px 9px',
                  borderRadius: 12,
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 2px 6px rgba(225, 29, 72, 0.35)',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  {revealedDonor.blood_group}
                </span>
              </div>

              {/* Donor Name */}
              <h4 style={{ fontWeight: 800, color: '#0F172A', fontSize: 20, margin: '14px 0 3px 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                {revealedDonor.name}
              </h4>

              {/* Gender, Age & Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12.5, color: '#64748B', marginBottom: 12, fontFamily: "'Hind Siliguri', sans-serif" }}>
                <span>{revealedDonor.gender === 'male' ? 'পুরুষ' : revealedDonor.gender === 'female' ? 'নারী' : 'অন্যান্য'}</span>
                {revealedDonor.age && <span>• বয়স: {toBn(revealedDonor.age)} বছর</span>}
                <span>•</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  color: revealedDonor.is_ready_to_donate ? '#059669' : '#D97706',
                  fontWeight: 700
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: revealedDonor.is_ready_to_donate ? '#10B981' : '#F59E0B' }} />
                  {revealedDonor.is_ready_to_donate ? 'রক্তদানে প্রস্তুত' : 'বিশ্রামে আছেন'}
                </span>
              </div>

              {/* Location Card */}
              {(() => {
                const { areaHierarchy, streetAddress } = getDonorAddressInfo(revealedDonor);
                return (
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '8px 14px',
                    marginBottom: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    maxWidth: '100%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#0F172A', fontSize: 13, fontWeight: 700, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      <IconMapPin size={15} color="#00A88C" style={{ flexShrink: 0 }} />
                      <span>{areaHierarchy}</span>
                    </div>
                    {streetAddress && (
                      <div style={{ fontSize: 12, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                        {streetAddress}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Direct Call & Copy Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {revealedDonor.is_alternate && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 10,
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#15803D',
                    fontSize: 12.5,
                    fontWeight: 700
                  }}>
                    <IconCircleCheck size={16} />
                    রক্তদানের জন্য রক্তদাতার নির্ধারিত নম্বর
                  </div>
                )}

                <a
                  href={`tel:${revealedDonor.contact_number}`}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 14,
                    background: '#00A88C', color: '#FFFFFF',
                    fontWeight: 900, fontSize: 16, textDecoration: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 4px 16px rgba(0,168,140,0.25)',
                    transition: '0.2s'
                  }}
                >
                  <IconPhoneCall size={20} />
                  সরাসরি কল করুন: {revealedDonor.contact_number}
                </a>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(revealedDonor.contact_number)
                      setNumberCopied(true)
                      setTimeout(() => setNumberCopied(false), 2000)
                    }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12,
                      background: numberCopied ? '#ECFDF5' : '#F8FAFC',
                      color: numberCopied ? '#059669' : '#334155',
                      border: `1px solid ${numberCopied ? '#A7F3D0' : '#CBD5E1'}`,
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {numberCopied ? '✓ কপি হয়েছে!' : 'নম্বর কপি করুন'}
                  </button>

                  <a
                    href={`https://wa.me/88${revealedDonor.contact_number.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12,
                      background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0',
                      fontWeight: 700, fontSize: 13, textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    হোয়াটসঅ্যাপে লিখুন
                  </a>
                </div>

                {revealedDonor.primary_contact_number && revealedDonor.is_alternate && revealedDonor.primary_contact_number !== revealedDonor.contact_number && (
                  <a
                    href={`tel:${revealedDonor.primary_contact_number}`}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 12,
                      background: '#F1F5F9', color: '#475569',
                      fontWeight: 700, fontSize: 13, textDecoration: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    অন্যান্য যোগাযোগ নম্বর: {revealedDonor.primary_contact_number}
                  </a>
                )}
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: 12, color: '#64748B', paddingTop: 14, borderTop: '1px solid #F1F5F9'
              }}>
                <IconShieldCheck size={16} color="#00A88C" />
                স্প্যাম প্রতিরোধে সুরক্ষিত (ঘণ্টায় অবশিষ্ট: {toBn(revealedDonor.remaining || 0)}টি)
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* ── PROFESSIONAL SECURITY & RATE LIMIT NOTICE MODAL ──────────── */}
      <Modal 
        show={!!securityNotice} 
        onHide={() => setSecurityNotice(null)}
        centered
        dialogClassName="blood-security-modal"
      >
        <Modal.Body style={{ padding: '32px 24px 28px', textAlign: 'center', borderRadius: 24, background: '#FFFFFF', position: 'relative' }}>
          {/* Close button */}
          <button
            type="button"
            onClick={() => setSecurityNotice(null)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#F1F5F9',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer'
            }}
          >
            <IconX size={16} />
          </button>

          {securityNotice && (
            <>
              {/* Icon Stage */}
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: securityNotice.type === 'rate_limit'
                  ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
                  : securityNotice.type === 'login_required'
                  ? 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)'
                  : 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)',
                color: securityNotice.type === 'rate_limit'
                  ? '#D97706'
                  : securityNotice.type === 'login_required'
                  ? '#0284C7'
                  : '#E11D48',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: securityNotice.type === 'rate_limit'
                  ? '0 6px 18px rgba(217, 119, 6, 0.2)'
                  : securityNotice.type === 'login_required'
                  ? '0 6px 18px rgba(2, 132, 199, 0.2)'
                  : '0 6px 18px rgba(225, 29, 72, 0.2)'
              }}>
                {securityNotice.type === 'rate_limit' ? (
                  <IconShieldCheck size={36} />
                ) : securityNotice.type === 'login_required' ? (
                  <IconLock size={34} />
                ) : (
                  <IconAlertCircle size={36} />
                )}
              </div>

              {/* Title & Subtitle */}
              <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 19, marginBottom: 6 }}>
                {securityNotice.title}
              </h4>
              <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, maxWidth: 360, margin: '0 auto 18px', lineHeight: 1.5 }}>
                {securityNotice.subtitle}
              </p>

              {/* Informative Security Policy Box */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: 16,
                padding: '16px 16px',
                border: '1px solid #E2E8F0',
                textAlign: 'left',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <IconShieldCheck size={18} color="#00A88C" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
                    <strong>তথ্য সুরক্ষা নীতি:</strong>{' '}
                    {securityNotice.isGuest ? (
                      <>
                        অতিথি হিসেবে প্রতি ঘণ্টায় সর্বোচ্চ <b>{toBn(securityNotice.limit || 5)} জন</b> রক্তদাতার নম্বর দেখা যায়। অ্যাকাউন্টে লগইন করলে আপনার কোটা দ্বিগুণ হয়ে প্রতি ঘণ্টায় <b>১০ জন</b> হবে।
                      </>
                    ) : (
                      <>
                        রক্তদাতাদের নম্বর সুরক্ষিত রাখতে ভেরিফাইড অ্যাকাউন্টের জন্য প্রতি ঘণ্টায় সর্বোচ্চ <b>{toBn(securityNotice.limit || 10)} জন</b> রক্তদাতার নম্বর উন্মুক্ত রাখা হয়।
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <IconClock size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
                    <strong>পরবর্তী আনলক:</strong>{' '}
                    {securityNotice.retryAfterMinutes && securityNotice.retryAfterMinutes > 1 ? (
                      <>আর প্রায় <b>{toBn(securityNotice.retryAfterMinutes)} মিনিট</b> পর স্বয়ংক্রিয়ভাবে আপনার কোটা পুনরায় চালু হবে।</>
                    ) : (
                      <>আর ১ মিনিটেরও কম সময়ে আপনার কোটা পুনরায় চালু হবে।</>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Helpline Strip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 6,
                fontSize: 12.5,
                color: '#64748B',
                marginBottom: 20
              }}>
                <span>জরুরি রক্তের প্রয়োজনে সরাসরি হেল্পলাইনে কল করুন:</span>
                <a
                  href="tel:09613868438"
                  style={{
                    color: '#E11D48',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <IconPhone size={13} />
                  09613868438
                </a>
              </div>

              {/* Action Button */}
              {securityNotice.type === 'login_required' ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSecurityNotice(null)}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 12,
                      background: '#F1F5F9', color: '#475569',
                      fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer'
                    }}
                  >
                    পরে করব
                  </button>
                  <Link
                    to={securityNotice.actionUrl || '/login'}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 12,
                      background: '#00A88C', color: '#FFFFFF',
                      fontWeight: 800, fontSize: 14, textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    লগইন করুন
                  </Link>
                </div>
              ) : securityNotice.type === 'rate_limit' && securityNotice.isGuest ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSecurityNotice(null)}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 12,
                      background: '#F1F5F9', color: '#475569',
                      fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer'
                    }}
                  >
                    বুঝেছি
                  </button>
                  <Link
                    to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                    style={{
                      flex: 1.4, padding: '11px', borderRadius: 12,
                      background: '#00A88C', color: '#FFFFFF',
                      fontWeight: 800, fontSize: 13, textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 4px 12px rgba(0, 168, 140, 0.25)'
                    }}
                  >
                    লগইন করে কোটা বাড়ান (১০টি)
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSecurityNotice(null)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 14,
                    background: '#0F172A',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {securityNotice.buttonText || 'বুঝেছি, ধন্যবাদ'}
                </button>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

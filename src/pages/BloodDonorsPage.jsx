import React, { useState, useEffect, useCallback } from 'react'
import { Container, Row, Col, Modal, Button, Form, Spinner, Badge } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import { 
  IconDroplet, IconHeart, IconSearch, IconMapPin, IconPhone, IconPhoneCall, 
  IconCircleCheck, IconClock, IconUserCheck, IconAlertCircle, IconRotate, 
  IconShieldCheck, IconX, IconChevronRight, IconShare, IconUsers, IconActivity,
  IconArrowRight, IconCalendar, IconChevronDown, IconChevronUp, IconAdjustmentsHorizontal,
  IconBuildingHospital, IconNavigation, IconCheck
} from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { getBloodDonors, revealDonorContact } from '../api/bloodDonorApi'
import { getDivisions, getDistricts, getUpazilas, getUnions } from '../api/locationApi'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined && str !== '' ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

export default function BloodDonorsPage() {
  const navigate = useNavigate()

  // Filter States
  const [selectedGroup, setSelectedGroup] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  const [availableOnly, setAvailableOnly] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const activeFilterCount = (selectedGroup ? 1 : 0) + 
                            (divisionId ? 1 : 0) + 
                            (districtId ? 1 : 0) + 
                            (upazilaId ? 1 : 0) + 
                            (unionId ? 1 : 0) + 
                            (!availableOnly ? 1 : 0)

  // Location Cascade Dropdown Options
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])

  // Data & Pagination
  const [donors, setDonors] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(false)

  // Reveal Modal State
  const [revealedDonor, setRevealedDonor] = useState(null)
  const [revealLoading, setRevealLoading] = useState(false)

  // 1. Load Divisions on Mount
  useEffect(() => {
    getDivisions()
      .then(res => setDivisions(res.data?.data || []))
      .catch(() => toast.error('বিভাগের তালিকা লোড করা যায়নি'))
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
  const fetchDonors = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = {
        page,
        per_page: 12,
        available_only: availableOnly,
      }
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
        })
      }
    } catch {
      toast.error('রক্তদাতাদের তালিকা লোড করা যায়নি')
    } finally {
      setLoading(false)
    }
  }, [selectedGroup, divisionId, districtId, upazilaId, unionId, availableOnly])

  useEffect(() => {
    fetchDonors(1)
  }, [fetchDonors])

  const handleResetFilters = () => {
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
    try {
      const res = await revealDonorContact(donor.id)
      if (res.data?.success) {
        setRevealedDonor({
          ...donor,
          contact_number: res.data.contact_number,
          alternate_contact_number: res.data.alternate_contact_number,
          remaining: res.data.remaining_reveals_hour,
        })
      }
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error(err.response.data.message || 'প্রতি ঘণ্টায় সর্বোচ্চ ৫টি নম্বর দেখা যাবে')
      } else if (err.response?.status === 401 && err.response?.data?.requires_login) {
        toast.error('এই রক্তদাতার যোগাযোগ নম্বর দেখতে লগইন করা আবশ্যক')
      } else {
        toast.error(err.response?.data?.message || 'নম্বর আনলক করা যায়নি')
      }
    } finally {
      setRevealLoading(false)
    }
  }

  return (
    <div className="blood-page-container" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 60, fontFamily: "'Hind Siliguri', 'Inter', sans-serif" }}>

      <style>{`
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
        {/* Results Count Bar */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E2E8F0',
          flexWrap: 'wrap', gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconUsers size={18} color="#00A88C" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 17, margin: 0 }}>
                রক্তদাতাদের তালিকা
              </h4>
              <span style={{
                background: '#E6F6F4', color: '#047857', border: '1px solid #A7F3D0',
                padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 800
              }}>
                {toBn(pagination.total)} জন
              </span>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF', padding: '4px 12px', borderRadius: 8,
            border: '1px solid #E2E8F0', fontSize: 12, fontWeight: 700, color: '#64748B'
          }}>
            পৃষ্ঠা: <b style={{ color: '#0F172A' }}>{toBn(pagination.current_page)}</b> / {toBn(pagination.last_page)}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <Spinner animation="border" style={{ color: '#E11D48', width: 44, height: 44 }} />
            <p style={{ marginTop: 14, color: '#64748B', fontWeight: 700, fontSize: 14.5 }}>
              রক্তদাতাদের তালিকা অনুসন্ধান করা হচ্ছে...
            </p>
          </div>
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
        ) : (
          <Row className="g-4">
            {donors.map(donor => (
              <Col key={donor.id} xs={12} sm={6} lg={4}>
                <div className="blood-card" style={{ padding: '24px 20px' }}>
                  <div>
                    {/* Card Top Header: Blood Badge & Status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#FFF1F2', color: '#BE123C',
                        padding: '6px 14px', borderRadius: 12,
                        fontWeight: 900, fontSize: 18,
                        border: '1.5px solid #FECDD3'
                      }}>
                        <IconDroplet size={18} color="#E11D48" />
                        {donor.blood_group}
                      </div>

                      {donor.is_ready_to_donate ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#ECFDF5', color: '#065F46',
                          border: '1px solid #A7F3D0', padding: '4px 10px',
                          borderRadius: 99, fontSize: 12, fontWeight: 800
                        }}>
                          <IconCircleCheck size={14} color="#10B981" />
                          প্রস্তুত
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#FFFBEB', color: '#92400E',
                          border: '1px solid #FDE68A', padding: '4px 10px',
                          borderRadius: 99, fontSize: 12, fontWeight: 800
                        }}>
                          <IconClock size={14} color="#D97706" />
                          বিশ্রামে ({toBn(donor.days_until_available || 90)} দিন বাকি)
                        </span>
                      )}
                    </div>

                    {/* Donor Avatar & Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: '#F1F5F9', color: '#0F172A',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 900, flexShrink: 0,
                        overflow: 'hidden', border: '2px solid #E2E8F0'
                      }}>
                        {donor.photo_url ? (
                          <img src={donor.photo_url} alt={donor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          donor.name.charAt(0)
                        )}
                      </div>

                      <div>
                        <h5 style={{ fontWeight: 900, color: '#0F172A', fontSize: 17, marginBottom: 3 }}>
                          {donor.name}
                        </h5>
                        <span style={{ fontSize: 12.5, color: '#64748B' }}>
                          {donor.gender === 'male' ? 'পুরুষ' : donor.gender === 'female' ? 'নারী' : 'অন্যান্য'}
                          {donor.age ? ` • বয়স: ${toBn(donor.age)} বছর` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Location Box (5-tier with Union) */}
                    <div style={{
                      background: '#F8FAFC', borderRadius: 14,
                      padding: '12px 14px', border: '1px solid #E2E8F0',
                      marginBottom: 18, fontSize: 13, color: '#475569'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                        <IconMapPin size={16} color="#00A88C" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, lineHeight: 1.4 }}>
                          {[
                            donor.village_or_area,
                            donor.union?.bangla_name || donor.union?.name,
                            donor.upazila?.bangla_name || donor.upazila?.name,
                            donor.district?.bangla_name || donor.district?.name,
                          ].filter(Boolean).join(', ') || 'ঠিকানা দেওয়া নেই'}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: 11.5, color: '#64748B', paddingTop: 8,
                        borderTop: '1px solid #EEF2F6', marginTop: 4
                      }}>
                        <span>মোট রক্তদান: <b>{toBn(donor.total_donations || 0)} বার</b></span>
                        {donor.last_donated_at && (
                          <span>সর্বশেষ: <b>{toBn(donor.last_donated_at)}</b></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Masked Contact & Call Button */}
                  <div style={{
                    paddingTop: 14, borderTop: '1px solid #F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div>
                      <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8' }}>
                        যোগাযোগ নম্বর
                      </span>
                      <span style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: '0.05em', color: '#1E293B' }}>
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
                      নম্বর দেখুন
                    </button>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => fetchDonors(page)}
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  border: `1.5px solid ${pagination.current_page === page ? '#00A88C' : '#CBD5E1'}`,
                  background: pagination.current_page === page ? '#00A88C' : '#FFFFFF',
                  color: pagination.current_page === page ? '#FFFFFF' : '#334155',
                  fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: '0.2s'
                }}
              >
                {toBn(page)}
              </button>
            ))}
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
        <Modal.Body style={{ padding: '32px 24px', textAlign: 'center', borderRadius: 24, background: '#FFFFFF' }}>
          {revealedDonor && (
            <>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#E6F6F4', color: '#00A88C',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14
              }}>
                <IconPhoneCall size={30} />
              </div>

              <div style={{
                display: 'inline-block',
                background: '#FFF1F2', color: '#BE123C',
                padding: '4px 12px', borderRadius: 99,
                fontSize: 13, fontWeight: 900, marginBottom: 8,
                border: '1px solid #FECDD3'
              }}>
                ব্লাড গ্রুপ: {revealedDonor.blood_group}
              </div>

              <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 20, marginBottom: 4 }}>
                {revealedDonor.name}
              </h4>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 22 }}>
                {[revealedDonor.union?.bangla_name, revealedDonor.upazila?.bangla_name, revealedDonor.district?.bangla_name].filter(Boolean).join(', ')}
              </p>

              {/* Direct Call & Copy Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
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
                      toast.success('নম্বর কপি করা হয়েছে')
                    }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12,
                      background: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer'
                    }}
                  >
                    নম্বর কপি করুন
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

                {revealedDonor.alternate_contact_number && (
                  <a
                    href={`tel:${revealedDonor.alternate_contact_number}`}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 12,
                      background: '#F1F5F9', color: '#334155',
                      fontWeight: 700, fontSize: 13.5, textDecoration: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    বিকল্প নম্বর: {revealedDonor.alternate_contact_number}
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
    </div>
  )
}

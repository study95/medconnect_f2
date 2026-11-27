import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Spinner, Form, Modal } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import {
  IconAmbulance, IconPhone, IconMapPin, IconSearch, IconBuildingHospital,
  IconShieldCheck, IconClock, IconAlertTriangle, IconX, IconExternalLink,
  IconFilter, IconChevronDown, IconCheck, IconBed, IconActivity,
  IconStethoscope, IconMicroscope, IconInfoCircle, IconMail, IconArrowRight,
  IconChecks, IconChevronLeft, IconChevronRight
} from '@tabler/icons-react'
import { getAmbulances } from '../api/ambulanceApi'
import { getHospitalById } from '../api/hospitalApi'
import { getHospitalUrl } from '../utils/identifierHelper'
import { getDivisions, getDistricts, getUpazilas } from '../api/locationApi'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined && str !== '' ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

/* ── SKELETON SHIMMER LOADER (Matching Blood & Pharmacy High-Perf Standard) ── */
function AmbulanceSkeletonGrid({ count = 6 }) {
  const items = Array.from({ length: count }, (_, i) => i)
  return (
    <Row className="g-4">
      {items.map(i => (
        <Col key={i} lg={4} md={6}>
          <div className="ambulance-card" style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div>
              {/* Identity Row Shimmer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="ambulance-skeleton-box" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ambulance-skeleton-box" style={{ width: '75%', height: 16, marginBottom: 8 }} />
                  <div className="ambulance-skeleton-box" style={{ width: '42%', height: 12 }} />
                </div>
              </div>

              {/* Hotline Shimmer Box */}
              <div className="ambulance-skeleton-box" style={{ height: 60, borderRadius: 10, margin: '14px 0 10px' }} />

              {/* Location Shimmer */}
              <div className="ambulance-skeleton-box" style={{ width: '70%', height: 13, marginBottom: 14 }} />
            </div>

            {/* Bottom Actions Shimmer */}
            <div style={{ paddingTop: 12, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
              <div className="ambulance-skeleton-box" style={{ flex: 1, height: 38, borderRadius: 10 }} />
              <div className="ambulance-skeleton-box" style={{ width: 96, height: 38, borderRadius: 10 }} />
            </div>
          </div>
        </Col>
      ))}
    </Row>
  )
}

export default function AmbulancesPage() {
  const [loading, setLoading] = useState(true)
  const [ambulances, setAmbulances] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Dynamic Reception & Hospital Profile Modal State
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [hospitalProfile, setHospitalProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [showReceptionModal, setShowReceptionModal] = useState(false)
  const [profileCache, setProfileCache] = useState({})

  const openReceptionModal = async (hospital) => {
    setSelectedHospital(hospital)
    setShowReceptionModal(true)

    // Check if profile already cached
    if (profileCache[hospital.id]) {
      setHospitalProfile(profileCache[hospital.id])
      return
    }

    setLoadingProfile(true)
    setHospitalProfile(null)
    try {
      const res = await getHospitalById(hospital.id)
      const data = res.data?.data || res.data
      if (data) {
        setHospitalProfile(data)
        setProfileCache(prev => ({ ...prev, [hospital.id]: data }))
      }
    } catch (err) {
      console.error('Failed to load full hospital profile:', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const closeReceptionModal = () => {
    setShowReceptionModal(false)
    setSelectedHospital(null)
    setHospitalProfile(null)
  }

  // Animated Typing Placeholder Effect
  const placeholderTexts = [
    'যেমনঃ সিটি কেয়ার হাসপাতাল...',
    'যেমনঃ ঢাকা মেডিকেল কলেজ হাসপাতাল...',
    'যেমনঃ এভারকেয়ার অ্যাম্বুলেন্স...',
    'যেমনঃ স্কয়ার হাসপাতাল অ্যাম্বুলেন্স...',
    'যেমনঃ ল্যাবএইড কার্ডিয়াক অ্যাম্বুলেন্স...',
    'যেমনঃ ধানমন্ডি, মিরপুর বা উত্তরা...'
  ]
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentPlaceholder, setCurrentPlaceholder] = useState('')

  useEffect(() => {
    const currentWord = placeholderTexts[placeholderIndex]
    const speed = isDeleting ? 28 : 65

    const timer = setTimeout(() => {
      if (!isDeleting && subIndex < currentWord.length) {
        setCurrentPlaceholder(currentWord.substring(0, subIndex + 1))
        setSubIndex(prev => prev + 1)
      } else if (!isDeleting && subIndex === currentWord.length) {
        setTimeout(() => setIsDeleting(true), 1700)
      } else if (isDeleting && subIndex > 0) {
        setCurrentPlaceholder(currentWord.substring(0, subIndex - 1))
        setSubIndex(prev => prev - 1)
      } else if (isDeleting && subIndex === 0) {
        setIsDeleting(false)
        setPlaceholderIndex(prev => (prev + 1) % placeholderTexts.length)
      }
    }, speed)

    return () => clearTimeout(timer)
  }, [subIndex, isDeleting, placeholderIndex])

  // Locations state
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])

  // Load Divisions
  useEffect(() => {
    getDivisions().then(res => setDivisions(res.data?.data || [])).catch(() => {})
  }, [])

  // Cascade Locations
  useEffect(() => {
    if (!divisionId) { setDistricts([]); setDistrictId(''); setUpazilaId(''); return }
    getDistricts({ division_id: divisionId }).then(res => setDistricts(res.data?.data || [])).catch(() => {})
    setDistrictId('')
    setUpazilas([])
    setUpazilaId('')
  }, [divisionId])

  useEffect(() => {
    if (!districtId) { setUpazilas([]); setUpazilaId(''); return }
    getUpazilas({ district_id: districtId }).then(res => setUpazilas(res.data?.data || [])).catch(() => {})
    setUpazilaId('')
  }, [districtId])

  const fetchAmbulances = async (page = 1) => {
    setLoading(true)
    try {
      const params = {
        page,
        per_page: 12,
        search: searchTerm.trim() || undefined,
        division_id: divisionId || undefined,
        district_id: districtId || undefined,
        upazila_id: upazilaId || undefined,
      }
      const res = await getAmbulances(params)
      if (res.data?.success) {
        setAmbulances(res.data.data || [])
        setPagination({
          current_page: res.data.meta?.current_page || 1,
          last_page: res.data.meta?.last_page || 1,
          total: res.data.meta?.total || 0,
        })
      }
    } catch (err) {
      console.error('Failed to load ambulances', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAmbulances(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, divisionId, districtId, upazilaId])

  const resetFilters = () => {
    setSearchTerm('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
  }

  const activeLocationCount = [divisionId, districtId, upazilaId].filter(Boolean).length
  const hasActiveFilters = Boolean(searchTerm || divisionId || districtId || upazilaId)

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: 60 }}>
      <style>{`
        .ambulance-hero-wrapper {
          position: relative;
          overflow: hidden;
          background-color: #4C0519;
          background-image:
            radial-gradient(rgba(254, 205, 211, 0.15) 1.5px, transparent 1.5px),
            linear-gradient(135deg, #4C0519 0%, #881337 32%, #B91C1C 68%, #DC2626 100%);
          background-size: 26px 26px, 100% 100%;
          color: #FFFFFF;
          padding: 124px 0 68px;
          border-bottom: 4px solid #EF4444;
          box-shadow: 0 14px 40px rgba(136, 19, 55, 0.35);
        }
        .ambulance-hero-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .ambulance-hero-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #FFFFFF;
          color: #DC2626;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
          border: 2px solid rgba(255, 255, 255, 0.9);
          flex-shrink: 0;
        }
        .ambulance-hero-title {
          font-size: clamp(22px, 3.8vw, 36px);
          font-weight: 900;
          color: #FFFFFF !important;
          letter-spacing: -0.5px;
          margin: 0;
          line-height: 1.25;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.65);
          font-family: 'Hind Siliguri', sans-serif;
        }
        /* ── SEARCH & FILTER CONSOLE ── */
        .ambulance-filter-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 18px 24px;
          box-shadow: 0 16px 40px -8px rgba(15, 23, 42, 0.11), 0 4px 14px rgba(15, 23, 42, 0.04);
          border: 1.5px solid #E2E8F0;
          margin-bottom: 28px;
          position: relative;
        }
        .ambulance-search-action-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: nowrap;
          width: 100%;
        }
        .ambulance-console-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 800;
          color: #0F172A;
          font-family: 'Hind Siliguri', sans-serif;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ambulance-console-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ambulance-main-search-wrap {
          position: relative;
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          align-items: center;
        }
        .ambulance-main-search-input {
          width: 100%;
          height: 48px;
          padding: 10px 42px 10px 44px;
          border-radius: 14px;
          border: 1.5px solid #CBD5E1;
          font-size: 14px;
          color: #0F172A;
          background: #F8FAFC;
          outline: none;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
          font-weight: 600;
        }
        .ambulance-main-search-input:focus {
          border-color: #DC2626;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
        }
        .ambulance-filter-toggle-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 48px;
          padding: 0 20px;
          border-radius: 14px;
          border: 1.5px solid #CBD5E1;
          background: #F8FAFC;
          color: #334155;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ambulance-filter-toggle-btn:hover {
          border-color: #DC2626;
          color: #DC2626;
          background: #FEF2F2;
        }
        .ambulance-filter-toggle-btn.is-open {
          border-color: #DC2626;
          background: #FEF2F2;
          color: #B91C1C;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
        }
        .ambulance-filter-toggle-btn.has-active {
          border-color: #DC2626;
          background: #FEF2F2;
          color: #B91C1C;
        }
        .ambulance-filter-badge {
          background: #DC2626;
          color: #FFFFFF;
          border-radius: 99px;
          padding: 1px 7px;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.3;
        }
        .ambulance-collapsible-panel {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 16px 20px;
          margin-top: 14px;
          animation: filterSlideDown 0.22s ease-out;
        }
        @keyframes filterSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .ambulance-filter-label {
          font-size: 12.5px;
          font-weight: 800;
          color: #334155;
          margin-bottom: 6px;
          display: block;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .ambulance-filter-select {
          border-radius: 12px !important;
          font-size: 13.5px !important;
          height: 44px !important;
          border: 1.5px solid #CBD5E1 !important;
          background-color: #FFFFFF !important;
          color: #0F172A !important;
          font-weight: 600 !important;
          font-family: 'Hind Siliguri', sans-serif !important;
          transition: all 0.2s ease !important;
        }
        .ambulance-filter-select:focus {
          border-color: #DC2626 !important;
          background-color: #FFFFFF !important;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12) !important;
        }

        /* ── RECEPTION MODAL STYLING ── */
        .reception-modal-dialog {
          max-width: 440px !important;
          margin: 1.5rem auto !important;
        }
        .reception-modal-content {
          border-radius: 20px !important;
          border: 1px solid #E2E8F0 !important;
          box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.2) !important;
          overflow: hidden !important;
          background: #FFFFFF !important;
          font-family: 'Hind Siliguri', sans-serif !important;
        }
        /* ── AMBULANCE CARD CLEAN & MINIMAL DESIGN ── */
        .ambulance-card {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1.5px solid #E2E8F0;
          padding: 18px 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
          transition: all 0.22s ease;
        }
        .ambulance-card:hover {
          transform: translateY(-3px);
          border-color: #CBD5E1;
          box-shadow: 0 10px 24px -4px rgba(15, 23, 42, 0.08);
        }
        .ambulance-card-avatar {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #DC2626;
          flex-shrink: 0;
          overflow: hidden;
        }
        .ambulance-hotline-row {
          margin: 14px 0 10px;
          padding: 10px 14px;
          background: #FEF2F2;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ambulance-hotline-label {
          font-size: 11.5px;
          color: #991B1B;
          font-weight: 700;
          font-family: 'Hind Siliguri', sans-serif;
          margin-bottom: 2px;
        }
        .ambulance-hotline-number {
          font-size: 19px;
          font-weight: 900;
          color: #DC2626;
          letter-spacing: 0.8px;
          line-height: 1.2;
          font-family: 'Inter', sans-serif;
        }
        .ambulance-location-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #64748B;
          margin-bottom: 14px;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .ambulance-call-btn-primary {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #DC2626;
          color: #FFFFFF !important;
          padding: 9px 14px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
          white-space: nowrap;
        }
        .ambulance-call-btn-primary:hover {
          background: #B91C1C;
          transform: translateY(-1px);
        }
        .ambulance-reception-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          background: #FFFFFF;
          color: #334155 !important;
          padding: 9px 13px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          border: 1.5px solid #CBD5E1;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
          white-space: nowrap;
          cursor: pointer;
        }
        .ambulance-reception-btn:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
          color: #0F172A !important;
          transform: translateY(-1px);
        }
        @keyframes ambulanceSkeletonPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ambulance-skeleton-box {
          background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
          background-size: 200% 100%;
          animation: ambulanceSkeletonPulse 1.5s ease-in-out infinite;
          border-radius: 8px;
        }
        @keyframes sirenPulseRed {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.15); }
        }
        @keyframes sirenPulseBlue {
          0%, 100% { opacity: 0.25; transform: scale(1.15); }
          50% { opacity: 0.55; transform: scale(1); }
        }
        .ambulance-glow-red {
          position: absolute;
          top: -70px;
          left: -40px;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%);
          animation: sirenPulseRed 3.5s infinite ease-in-out;
          pointer-events: none;
        }
        .ambulance-glow-blue {
          position: absolute;
          bottom: -60px;
          right: 5%;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 70%);
          animation: sirenPulseBlue 3.5s infinite ease-in-out;
          pointer-events: none;
        }
        .ambulance-hero-watermark {
          position: absolute;
          right: 18%;
          top: 6%;
          width: 280px;
          height: 280px;
          opacity: 0.05;
          pointer-events: none;
          color: #FFFFFF;
          transform: rotate(-10deg);
        }
        .ambulance-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.28);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 6px 16px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 14px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15);
        }
        @keyframes beaconFlash {
          0%, 100% { background: #EF4444; box-shadow: 0 0 10px #EF4444; }
          50% { background: #38BDF8; box-shadow: 0 0 10px #38BDF8; }
        }
        .ambulance-beacon-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: beaconFlash 1.6s infinite ease-in-out;
          display: inline-block;
          flex-shrink: 0;
        }
        .ambulance-trust-strip {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
        }
        .ambulance-trust-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 5px 13px;
          border-radius: 20px;
          font-size: 12.5px;
          color: #FFFFFF;
          font-weight: 700;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .trust-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }
        .trust-dot.red { background: #F87171; box-shadow: 0 0 6px #F87171; }
        .trust-dot.blue { background: #38BDF8; box-shadow: 0 0 6px #38BDF8; }
        .trust-dot.green { background: #34D399; box-shadow: 0 0 6px #34D399; }
        .trust-dot.amber { background: #FBBF24; box-shadow: 0 0 6px #FBBF24; }

        /* ── EMERGENCY 999 CARD ── */
        .ambulance-emergency-card {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(255, 255, 255, 0.28);
          border-radius: 22px;
          padding: 18px 22px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
          text-align: center;
          display: inline-block;
          width: 100%;
          max-width: 280px;
        }
        .emergency-card-header {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .emergency-live-tag {
          background: #DC2626;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 900;
          padding: 2px 9px;
          border-radius: 99px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.3px;
        }
        .emergency-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 0 6px #FFFFFF;
          animation: beaconFlash 1.6s infinite ease-in-out;
        }
        .emergency-tollfree-text {
          color: #FECACA;
          font-size: 11.5px;
          font-weight: 700;
        }
        .emergency-call-btn {
          background: linear-gradient(135deg, #FFFFFF 0%, #FFF1F2 100%);
          color: #DC2626;
          border: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: 14px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-decoration: none;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
          transition: all 0.2s ease;
          margin-bottom: 8px;
        }
        .emergency-call-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.32);
          color: #B91C1C;
        }
        .emergency-call-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #FEF2F2;
          color: #DC2626;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .emergency-call-number {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: 2px;
          color: #DC2626;
          line-height: 1;
        }
        .emergency-call-label {
          font-size: 11px;
          font-weight: 800;
          background: #DC2626;
          color: #FFFFFF;
          padding: 3px 8px;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .emergency-card-footer {
          font-size: 11.5px;
          color: #FECACA;
          font-weight: 600;
        }

        .ambulance-content-container {
          margin-top: -32px;
          position: relative;
          z-index: 10;
        }

        @media (max-width: 991px) {
          .ambulance-hero-wrapper {
            padding: 82px 0 38px !important; /* 58px mobile navbar + 24px top spacing */
          }
          .ambulance-emergency-card {
            max-width: 100% !important;
            margin-top: 14px !important;
          }
        }
        @media (max-width: 767px) {
          .ambulance-content-container {
            margin-top: -16px !important;
          }
          .ambulance-hero-wrapper {
            padding: 76px 0 28px !important; /* 58px mobile navbar + 18px top spacing */
          }
          .ambulance-hero-badge {
            font-size: 11px !important;
            padding: 3px 10px !important;
            margin-bottom: 8px !important;
            gap: 6px !important;
          }
          .ambulance-hero-title-wrap {
            gap: 8px !important;
            margin-bottom: 6px !important;
            flex-wrap: nowrap !important;
            width: 100% !important;
          }
          .ambulance-hero-icon-box {
            width: 28px !important;
            height: 28px !important;
            border-radius: 8px !important;
            border-width: 1.5px !important;
            flex-shrink: 0 !important;
          }
          .ambulance-hero-icon-box svg {
            width: 16px !important;
            height: 16px !important;
          }
          .ambulance-hero-title {
            font-size: clamp(13.5px, 4.2vw, 17px) !important;
            white-space: nowrap !important;
            line-height: 1.2 !important;
            letter-spacing: -0.4px !important;
          }
          .ambulance-hero-watermark {
            display: none !important;
          }
          .ambulance-filter-card {
            padding: 10px 12px !important;
            border-radius: 14px !important;
            margin-bottom: 16px !important;
          }
          .ambulance-search-action-row {
            flex-wrap: nowrap !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .ambulance-main-search-wrap {
            min-width: 0 !important;
            flex: 1 1 auto !important;
          }
          .ambulance-main-search-input {
            height: 42px !important;
            padding: 6px 30px 6px 34px !important;
            font-size: 13px !important;
            border-radius: 10px !important;
            width: 100% !important;
          }
          .ambulance-filter-toggle-btn {
            height: 42px !important;
            padding: 0 10px !important;
            font-size: 12px !important;
            border-radius: 10px !important;
            gap: 4px !important;
            flex-shrink: 0 !important;
            white-space: nowrap !important;
          }
          .ambulance-card {
            padding: 14px 15px !important;
            border-radius: 14px !important;
          }
          .ambulance-card-avatar {
            width: 40px !important;
            height: 40px !important;
            border-radius: 9px !important;
          }
          .ambulance-hotline-row {
            margin: 10px 0 8px !important;
            padding: 8px 11px !important;
            border-radius: 9px !important;
          }
          .ambulance-hotline-number {
            font-size: 17px !important;
          }
          .ambulance-location-row {
            font-size: 11.5px !important;
            margin-bottom: 10px !important;
          }
          .ambulance-call-btn-primary {
            padding: 8px 12px !important;
            font-size: 12.5px !important;
            border-radius: 10px !important;
          }
          .ambulance-reception-btn {
            padding: 8px 11px !important;
            font-size: 12px !important;
            border-radius: 10px !important;
          }
        }
        @media (max-width: 576px) {
          .ambulance-trust-strip {
            gap: 5px !important;
          }
          .ambulance-trust-pill {
            font-size: 10.5px !important;
            padding: 3px 8px !important;
          }
        }
      `}</style>

      {/* ── EMERGENCY HERO ── */}
      <div className="ambulance-hero-wrapper">
        <div className="ambulance-glow-red" />
        <div className="ambulance-glow-blue" />
        <div className="ambulance-hero-watermark">
          <IconAmbulance size={280} stroke={1} />
        </div>

        <Container style={{ position: 'relative', zIndex: 1 }}>
          <div className="d-none d-sm-block">
            <BreadcrumbHUD
              links={[
                { label: 'হোম', path: '/' },
                { label: 'হাসপাতাল অ্যাম্বুলেন্স' }
              ]}
              variant="light"
            />
          </div>

          <Row className="align-items-center mt-0 mt-md-2 g-3 g-lg-4">
            <Col lg={8} xl={8}>
              <div className="ambulance-hero-badge">
                <span className="ambulance-beacon-dot" />
                <IconClock size={15} color="#FECDD3" />
                <span className="d-none d-sm-inline">২৪ ঘণ্টা জরুরি অ্যাম্বুলেন্স সার্ভিস ও হটলাইন নম্বর</span>
                <span className="d-inline d-sm-none">২৪/৭ জরুরি হটলাইন</span>
              </div>

              <div className="ambulance-hero-title-wrap">
                <div className="ambulance-hero-icon-box">
                  <IconAmbulance size={24} stroke={2.3} />
                </div>
                <h1 className="ambulance-hero-title">
                  হাসপাতাল জরুরি অ্যাম্বুলেন্স ডিরেক্টরি
                </h1>
              </div>

              <p
                className="d-none d-md-block"
                style={{
                  fontSize: 15.5,
                  color: '#FFFFFF',
                  maxWidth: 680,
                  margin: 0,
                  lineHeight: 1.65,
                  fontWeight: 600,
                  fontFamily: "'Hind Siliguri', sans-serif",
                  textShadow: '0 1px 6px rgba(0,0,0,0.5)'
                }}
              >
                যেকোনো জরুরি স্বাস্থ্য সংকটে অথবা রোগী দ্রুত হাসপাতালে স্থানান্তরে সরাসরি হাসপাতালের নিজস্ব অ্যাম্বুলেন্স হটলাইনে কল করুন।
              </p>
              <p
                className="d-block d-md-none"
                style={{
                  fontSize: 12.5,
                  color: '#FECDD3',
                  margin: '0 0 10px',
                  lineHeight: 1.45,
                  fontWeight: 600,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}
              >
                রোগী দ্রুত স্থানান্তরে সরাসরি হাসপাতালের অ্যাম্বুলেন্সে কল করুন।
              </p>

              {/* Emergency Feature Trust Strip - Visible on desktop, hidden on mobile */}
              <div className="ambulance-trust-strip d-none d-lg-flex">
                <span className="ambulance-trust-pill">
                  <span className="trust-dot red" /> আইসিইউ (ICU) ও লাইফ সাপোর্ট
                </span>
                <span className="ambulance-trust-pill">
                  <span className="trust-dot blue" /> সার্বক্ষণিক অক্সিজেন সুবিধা
                </span>
                <span className="ambulance-trust-pill">
                  <span className="trust-dot green" /> অনুমোদিত হাসপাতাল হটলাইন
                </span>
                <span className="ambulance-trust-pill">
                  <span className="trust-dot amber" /> দ্রুততম স্থানান্তর নেটওয়ার্ক
                </span>
              </div>

              {/* Sleek Mobile 999 Bar */}
              <div
                className="d-flex d-lg-none align-items-center justify-content-between"
                style={{
                  background: 'rgba(255, 255, 255, 0.14)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: 12,
                  padding: '7px 12px',
                  marginTop: 6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>
                  <span className="emergency-live-dot" style={{ width: 6, height: 6 }} />
                  <span>জাতীয় জরুরি সেবা (টোল ফ্রি):</span>
                </div>
                <a
                  href="tel:999"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: '#FFFFFF',
                    color: '#DC2626',
                    padding: '3px 10px',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 900,
                    textDecoration: 'none',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  <IconPhone size={13} stroke={2.5} />
                  <span>৯৯৯ কল ↗</span>
                </a>
              </div>
            </Col>

            <Col lg={4} xl={4} className="text-lg-end d-none d-lg-block">
              <div className="ambulance-emergency-card">
                <div className="emergency-card-header">
                  <span className="emergency-live-tag">
                    <span className="emergency-live-dot" />
                    জরুরি হটলাইন
                  </span>
                  <span className="emergency-tollfree-text">টোল ফ্রি</span>
                </div>

                <a
                  href="tel:999"
                  className="emergency-call-btn"
                  title="জাতীয় জরুরি সেবা ৯৯৯ এ কল করুন"
                >
                  <div className="emergency-call-icon">
                    <IconPhone size={18} stroke={2.5} />
                  </div>
                  <div className="emergency-call-number">৯৯৯</div>
                  <span className="emergency-call-label">কল করুন ↗</span>
                </a>

                <div className="emergency-card-footer">
                  জাতীয় জরুরি সেবা • অ্যাম্বুলেন্স ও পুলিশ
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="ambulance-content-container">
        {/* ── SEARCH & FILTER CONSOLE ── */}
        <div className="ambulance-filter-card">
          {/* Main Top Row: Title badge (left), Centered Adjustable Search Bar with Typing Mode, Filter Toggle Button (right) */}
          <div className="ambulance-search-action-row">
            {/* Left Title Label */}
            <div className="ambulance-console-title d-none d-lg-flex">
              <div className="ambulance-console-icon">
                <IconAmbulance size={20} stroke={2.2} />
              </div>
              <span>অ্যাম্বুলেন্স অনুসন্ধান</span>
            </div>

            {/* Middle Adjustable Search Bar with Live Typing Placeholder */}
            <div className="ambulance-main-search-wrap">
              <IconSearch size={19} style={{ position: 'absolute', left: 16, color: '#DC2626', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder={searchTerm ? '' : currentPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ambulance-main-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: 14,
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    color: '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="মুছে ফেলুন"
                >
                  <IconX size={14} />
                </button>
              )}
            </div>

            {/* Right Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`ambulance-filter-toggle-btn ${showFilters ? 'is-open' : ''} ${activeLocationCount > 0 ? 'has-active' : ''}`}
            >
              <IconFilter size={18} />
              <span>ফিল্টার</span>
              {activeLocationCount > 0 && (
                <span className="ambulance-filter-badge">{toBn(activeLocationCount)}</span>
              )}
              <IconChevronDown
                size={16}
                style={{
                  transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease'
                }}
              />
            </button>
          </div>

          {/* Collapsible Location Filter Panel (Opens underneath on filter click) */}
          {showFilters && (
            <div className="ambulance-collapsible-panel">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                flexWrap: 'wrap',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  <IconMapPin size={16} color="#DC2626" />
                  <span>এলাকাভিত্তিক হাসপাতাল ফিল্টার:</span>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 11px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#DC2626',
                      background: '#FFFFFF',
                      border: '1px solid #FECACA',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}
                  >
                    <IconX size={13} />
                    <span>ফিল্টার মুছুন</span>
                  </button>
                )}
              </div>

              <Row className="g-3">
                <Col md={4}>
                  <label className="ambulance-filter-label">বিভাগ</label>
                  <Form.Select
                    value={divisionId}
                    onChange={(e) => setDivisionId(e.target.value)}
                    className="ambulance-filter-select"
                  >
                    <option value="">সকল বিভাগ</option>
                    {divisions.map(d => (
                      <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={4}>
                  <label className="ambulance-filter-label">জেলা</label>
                  <Form.Select
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    disabled={!divisionId}
                    className="ambulance-filter-select"
                  >
                    <option value="">সকল জেলা</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={4}>
                  <label className="ambulance-filter-label">উপজেলা / থানা</label>
                  <Form.Select
                    value={upazilaId}
                    onChange={(e) => setUpazilaId(e.target.value)}
                    disabled={!districtId}
                    className="ambulance-filter-select"
                  >
                    <option value="">সকল উপজেলা</option>
                    {upazilas.map(u => (
                      <option key={u.id} value={u.id}>{u.bangla_name || u.name}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </div>
          )}
        </div>

        {/* ── RESULTS HEADER ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>
            মোট <span style={{ color: '#DC2626', fontWeight: 900 }}>{toBn(pagination.total)}</span> টি হাসপাতালে জরুরি অ্যাম্বুলেন্স সেবা রয়েছে
          </div>
        </div>

        {/* ── AMBULANCE CARDS (With High-Performance Shimmer Skeleton) ── */}
        {loading ? (
          <AmbulanceSkeletonGrid count={6} />
        ) : ambulances.length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '50px 24px',
            textAlign: 'center',
            border: '1px dashed #CBD5E1'
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <IconAmbulance size={32} />
            </div>
            <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>কোনো অ্যাম্বুলেন্স পাওয়া যায়নি</h4>
            <p style={{ color: '#64748B', fontSize: 14, maxWidth: 440, margin: '0 auto 20px' }}>
              আপনার অনুসন্ধানকৃত এলাকায় বর্তমানে কোনো হাসপাতালের নিজস্ব অ্যাম্বুলেন্স তালিকাভুক্ত নেই। এলাকা পরিবর্তন করে চেষ্টা করুন।
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13.5
                }}
              >
                ফিল্টার রিসেট করুন
              </button>
            )}
          </div>
        ) : (
          <Row className="g-4">
            {ambulances.map(hospital => {
              const locationParts = [
                hospital.upazila?.bangla_name || hospital.upazila?.name_bn || hospital.upazila?.name,
                hospital.district?.bangla_name || hospital.district?.name_bn || hospital.district?.name,
              ].filter(Boolean).join(', ')

              const hotlineNum = hospital.ambulance_number || hospital.ambulance_phone || hospital.phone

              return (
                <Col key={hospital.id} lg={4} md={6}>
                  <div className="ambulance-card">
                    <div>
                      {/* Hospital Identity Row (Clean & Direct) */}
                      <Link
                        to={getHospitalUrl(hospital)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                        title="হাসপাতালের প্রোফাইল দেখুন"
                      >
                        <div className="ambulance-card-avatar">
                          {hospital.logo_url ? (
                            <img src={hospital.logo_url} alt={hospital.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <IconBuildingHospital size={24} stroke={1.8} />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <h3 style={{
                              fontSize: 16.5,
                              fontWeight: 800,
                              color: '#0F172A',
                              margin: 0,
                              lineHeight: 1.3,
                              fontFamily: "'Hind Siliguri', sans-serif",
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={hospital.name_bn || hospital.name}
                            >
                              {hospital.name_bn || hospital.name}
                            </h3>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#10B981',
                                display: 'inline-block',
                                flexShrink: 0
                              }}
                              title="সচল প্রতিষ্ঠান"
                            />
                          </div>

                          <div style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#64748B',
                            marginTop: 2
                          }}>
                            {hospital.hospital_type ? (hospital.hospital_type.toLowerCase() === 'private' ? 'বেসরকারি হাসপাতাল' : hospital.hospital_type.toLowerCase() === 'government' ? 'সরকারি হাসপাতাল' : hospital.hospital_type) : 'সাধারণ হাসপাতাল'}
                          </div>
                        </div>
                      </Link>

                      {/* Clean Ambulance Hotline Row */}
                      {hotlineNum && (
                        <div className="ambulance-hotline-row">
                          <div>
                            <div className="ambulance-hotline-label">
                              জরুরি অ্যাম্বুলেন্স হটলাইন:
                            </div>
                            <div className="ambulance-hotline-number">
                              {hotlineNum}
                            </div>
                          </div>
                          <IconAmbulance size={22} color="#DC2626" stroke={2} style={{ opacity: 0.85 }} />
                        </div>
                      )}

                      {/* Simple Location Text */}
                      <div className="ambulance-location-row">
                        <IconMapPin size={15} style={{ flexShrink: 0, color: '#DC2626' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {hospital.address ? `${hospital.address}, ` : ''}
                          <strong style={{ color: '#1E293B' }}>{locationParts || 'বাংলাদেশ'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons Row */}
                    <div style={{ paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {hotlineNum && (
                          <a
                            href={`tel:${hotlineNum}`}
                            className="ambulance-call-btn-primary"
                            title="সরাসরি অ্যাম্বুলেন্সে কল করুন"
                          >
                            <IconPhone size={16} stroke={2.4} />
                            <span>অ্যাম্বুলেন্সে কল দিন</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => openReceptionModal(hospital)}
                          className="ambulance-reception-btn"
                          title="হাসপাতালের তথ্য ও রিসেপশন"
                        >
                          <IconBuildingHospital size={15} stroke={2} />
                          <span>রিসেপশন</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Col>
              )
            })}
          </Row>
        )}

        {/* ── PAGINATION CONTROLS (Matching Pharmacy & Blood Page High-End Standard) ── */}
        {!loading && pagination.last_page > 1 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 32,
            padding: '12px 18px',
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            {/* Left: Bengali page info */}
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
              পৃষ্ঠা <strong style={{ color: '#0F172A' }}>{toBn(pagination.current_page)}</strong> / <strong style={{ color: '#0F172A' }}>{toBn(pagination.last_page)}</strong>
              <span style={{ margin: '0 6px', color: '#CBD5E1' }}>•</span>
              মোট <strong style={{ color: '#DC2626' }}>{toBn(pagination.total)}</strong> টি
            </div>

            {/* Right: Modern Page Navigation Controls */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                disabled={pagination.current_page <= 1}
                onClick={() => {
                  fetchAmbulances(pagination.current_page - 1)
                  window.scrollTo({ top: 300, behavior: 'smooth' })
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #E2E8F0',
                  background: pagination.current_page <= 1 ? '#F8FAFC' : '#FFFFFF',
                  color: pagination.current_page <= 1 ? '#94A3B8' : '#334155',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: pagination.current_page <= 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconChevronLeft size={16} />
                <span className="d-none d-sm-inline">পূর্ববর্তী</span>
              </button>

              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  type="button"
                  onClick={() => {
                    fetchAmbulances(page)
                    window.scrollTo({ top: 300, behavior: 'smooth' })
                  }}
                  style={{
                    minWidth: 34,
                    height: 34,
                    padding: '0 8px',
                    borderRadius: 8,
                    border: `1.5px solid ${pagination.current_page === page ? '#DC2626' : '#E2E8F0'}`,
                    background: pagination.current_page === page ? '#DC2626' : '#FFFFFF',
                    color: pagination.current_page === page ? '#FFFFFF' : '#334155',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: pagination.current_page === page ? '0 2px 6px rgba(220, 38, 38, 0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {toBn(page)}
                </button>
              ))}

              <button
                type="button"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => {
                  fetchAmbulances(pagination.current_page + 1)
                  window.scrollTo({ top: 300, behavior: 'smooth' })
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #E2E8F0',
                  background: pagination.current_page >= pagination.last_page ? '#F8FAFC' : '#FFFFFF',
                  color: pagination.current_page >= pagination.last_page ? '#94A3B8' : '#334155',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: pagination.current_page >= pagination.last_page ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className="d-none d-sm-inline">পরবর্তী</span>
                <IconChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : !loading && pagination.total > 0 ? (
          <div style={{
            textAlign: 'center',
            marginTop: 28,
            padding: '12px 20px',
            color: '#64748B',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            width: 'fit-content',
            margin: '28px auto 0'
          }}>
            <IconChecks size={16} color="#DC2626" />
            <span>সকল হাসপাতাল অ্যাম্বুলেন্স প্রদর্শিত হয়েছে ({toBn(pagination.total)} টি)</span>
          </div>
        ) : null}

      {/* ── COMPACT DYNAMIC RECEPTION MODAL ── */}
      <Modal
        show={showReceptionModal}
        onHide={closeReceptionModal}
        centered
        dialogClassName="reception-modal-dialog"
        contentClassName="reception-modal-content"
      >
        {selectedHospital && (() => {
          const hosp = selectedHospital
          const profile = hospitalProfile

          // Prioritize Hot Number (Hotline) over registration phone
          const hotNumber = profile?.hotline || hosp.hotline || profile?.emergency_phone || hosp.emergency_phone || profile?.phone || hosp.phone
          const ambulanceContact = profile?.ambulance_number || hosp.ambulance_number || hosp.ambulance_phone

          const locString = [
            profile?.upazila?.bangla_name || hosp.upazila?.bangla_name || hosp.upazila?.name_bn || hosp.upazila?.name,
            profile?.district?.bangla_name || hosp.district?.bangla_name || hosp.district?.name_bn || hosp.district?.name,
          ].filter(Boolean).join(', ')

          // Dynamic Capacity & Stats (From Image 2 fields)
          const resDocs = Number(profile?.reserved_doctor_number) || 0
          const visDocs = Number(profile?.visited_doctor_number) || 0
          const docCount = (resDocs + visDocs) > 0 ? (resDocs + visDocs) : (Number(profile?.doctors_count) || 0)

          const nurseCount = Number(profile?.nurse_number) || 0
          const icuBeds = Number(profile?.ICU_number) || (Number(profile?.icu_beds) || 0)
          const ccuBeds = Number(profile?.CCU_number) || (Number(profile?.ccu_beds) || 0)
          const hduBeds = Number(profile?.HDU_number) || (Number(profile?.hdu_beds) || 0)
          const cabins = Number(profile?.Cabin_number) || (Number(profile?.cabin_count) || 0)
          const totalBeds = (icuBeds + ccuBeds + hduBeds + cabins) > 0 ? (icuBeds + ccuBeds + hduBeds + cabins) : (Number(profile?.bed_count) || 0)

          return (
            <div style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                background: '#FFFFFF',
                padding: '16px 20px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: '#FEF2F2',
                    border: '1.5px solid #FECACA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#DC2626',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {hosp.logo_url ? (
                      <img src={hosp.logo_url} alt={hosp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <IconBuildingHospital size={26} stroke={1.8} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 800,
                      color: '#0F172A',
                      lineHeight: 1.3,
                      fontFamily: "'Hind Siliguri', sans-serif",
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {profile?.name_bn || hosp.name_bn || profile?.name || hosp.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#047857',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '1px 7px',
                        borderRadius: 6
                      }}>
                        {hosp.hospital_type ? (hosp.hospital_type.toLowerCase() === 'private' ? 'বেসরকারি হাসপাতাল' : hosp.hospital_type.toLowerCase() === 'government' ? 'সরকারি হাসপাতাল' : hosp.hospital_type) : 'হাসপাতাল'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#64748B', fontSize: 11.5, fontWeight: 600 }}>
                        <IconMapPin size={13} color="#DC2626" />
                        <span>{locString || hosp.address || 'বাংলাদেশ'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeReceptionModal}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                  title="বন্ধ করুন"
                >
                  <IconX size={16} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '16px 20px', maxHeight: '68vh', overflowY: 'auto' }}>
                {loadingProfile && (
                  <div style={{ textAlign: 'center', padding: '4px 0 10px' }}>
                    <Spinner animation="border" size="sm" style={{ color: '#059669', width: 15, height: 15 }} />
                    <span style={{ fontSize: 11.5, color: '#64748B', marginLeft: 6, fontWeight: 600 }}>
                      হাসপাতাল প্রোফাইল থেকে বিস্তারিত তথ্য লোড হচ্ছে...
                    </span>
                  </div>
                )}

                {/* 1. Reception Hotline Card */}
                {hotNumber && (
                  <div style={{
                    background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
                    border: '1.5px solid #A7F3D0',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 12,
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.06)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: '#059669',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 3px 8px rgba(5, 150, 105, 0.25)'
                      }}>
                        <IconPhone size={20} stroke={2.4} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          হটলাইন (রিসেপশন ও ভর্তি ডেস্ক)
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#064E3B', letterSpacing: '0.5px', lineHeight: 1.2 }}>
                          {hotNumber}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`tel:${hotNumber}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: '#FFFFFF',
                        padding: '8px 15px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 800,
                        textDecoration: 'none',
                        boxShadow: '0 3px 10px rgba(5, 150, 105, 0.25)',
                        flexShrink: 0
                      }}
                      title="রিসেপশনে কল দিন"
                    >
                      <IconPhone size={14} stroke={2.5} />
                      <span>কল দিন</span>
                    </a>
                  </div>
                )}

                {/* 2. Ambulance Hotline Card */}
                {ambulanceContact && (
                  <div style={{
                    background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
                    border: '1.5px solid #FECACA',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 14,
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: '#DC2626',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 3px 8px rgba(220, 38, 38, 0.25)'
                      }}>
                        <IconAmbulance size={20} stroke={2.2} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          জরুরি অ্যাম্বুলেন্স কন্ট্রোল রুম
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#B91C1C', letterSpacing: '0.5px', lineHeight: 1.2 }}>
                          {ambulanceContact}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`tel:${ambulanceContact}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                        color: '#FFFFFF',
                        padding: '8px 15px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 800,
                        textDecoration: 'none',
                        boxShadow: '0 3px 10px rgba(220, 38, 38, 0.25)',
                        flexShrink: 0
                      }}
                      title="অ্যাম্বুলেন্সে কল দিন"
                    >
                      <IconAmbulance size={14} stroke={2.2} />
                      <span>কল দিন</span>
                    </a>
                  </div>
                )}

                {/* 3. Dynamic Facility Capacity & Statistics (Image 2 Fields) */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: '#0F172A',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <IconActivity size={15} color="#2563EB" />
                    <span>হাসপাতালের সক্ষমতা ও সুবিধা (Capacity & Stats):</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {/* ICU Beds */}
                    <div style={{
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: '#FFFFFF',
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 16,
                        border: '1px solid #FCA5A5'
                      }}>
                        🏥
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#991B1B', fontWeight: 700 }}>আইসিইউ বেড</div>
                        <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0F172A' }}>
                          {icuBeds > 0 ? `${toBn(icuBeds)} টি বেড` : 'জরুরি সুবিধা প্রস্তুত'}
                        </div>
                        {ccuBeds > 0 && (
                          <div style={{ fontSize: 10.5, color: '#DC2626', fontWeight: 700, marginTop: 1 }}>
                            সিসিইউ: {toBn(ccuBeds)} টি
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Private Cabins / Beds */}
                    <div style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: '#FFFFFF',
                        color: '#1D4ED8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 16,
                        border: '1px solid #93C5FD'
                      }}>
                        🏠
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#1E40AF', fontWeight: 700 }}>কেবিন ও বেড</div>
                        <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0F172A' }}>
                          {cabins > 0 ? `${toBn(cabins)} টি কেবিন` : (totalBeds > 0 ? `${toBn(totalBeds)} টি বেড` : 'ইনডোর বেড সুবিধা')}
                        </div>
                        {hduBeds > 0 && (
                          <div style={{ fontSize: 10.5, color: '#1D4ED8', fontWeight: 700, marginTop: 1 }}>
                            এইচডিইউ: {toBn(hduBeds)} টি
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Doctors & Staff */}
                    <div style={{
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: '#FFFFFF',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 16,
                        border: '1px solid #6EE7B7'
                      }}>
                        👨‍⚕️
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#065F46', fontWeight: 700 }}>চিকিৎসক ও নার্স</div>
                        <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0F172A' }}>
                          {docCount > 0 ? `${toBn(docCount)} জন ডাক্তার` : 'অন-কল চিকিৎসক'}
                        </div>
                        {nurseCount > 0 && (
                          <div style={{ fontSize: 10.5, color: '#047857', fontWeight: 700, marginTop: 1 }}>
                            নার্স: {toBn(nurseCount)} জন
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Emergency Service */}
                    <div style={{
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: '#FFFFFF',
                        color: '#D97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 16,
                        border: '1px solid #FCD34D'
                      }}>
                        ⚡
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#92400E', fontWeight: 700 }}>জরুরি চিকিৎসা</div>
                        <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0F172A' }}>
                          ২৪/৭ ইমার্জেন্সি
                        </div>
                        <div style={{ fontSize: 10.5, color: '#D97706', fontWeight: 700, marginTop: 1 }}>
                          সার্বক্ষণিক সচল
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Departments (if available in profile) */}
                {profile?.departments && profile.departments.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                      চিকিৎসা বিভাগসমূহ (Departments):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {profile.departments.slice(0, 6).map((dept, idx) => (
                        <span key={idx} style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          color: '#334155',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700
                        }}>
                          {dept.name || dept.name_en}
                        </span>
                      ))}
                      {profile.departments.length > 6 && (
                        <span style={{ fontSize: 11, color: '#059669', fontWeight: 700, padding: '3px 6px', background: '#ECFDF5', borderRadius: 6 }}>
                          +{toBn(profile.departments.length - 6)} টি আরও
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. View Full Profile Link Button */}
                <Link
                  to={getHospitalUrl(profile || hosp)}
                  onClick={closeReceptionModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    width: '100%',
                    background: '#F8FAFC',
                    border: '1.5px solid #CBD5E1',
                    color: '#1E293B',
                    padding: '10px 16px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 800,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F1F5F9';
                    e.currentTarget.style.borderColor = '#94A3B8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                >
                  <IconBuildingHospital size={16} stroke={2} color="#059669" />
                  <span>হাসপাতালের পূর্ণাঙ্গ প্রোফাইল ও বিস্তারিত দেখুন</span>
                  <IconArrowRight size={14} />
                </Link>
              </div>
            </div>
          )
        })()}
      </Modal>
      </Container>
    </div>
  )
}

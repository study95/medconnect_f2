import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Spinner, Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import {
  IconAmbulance, IconPhone, IconMapPin, IconSearch, IconBuildingHospital,
  IconShieldCheck, IconClock, IconAlertTriangle, IconX, IconExternalLink,
  IconFilter, IconChevronDown, IconCheck
} from '@tabler/icons-react'
import { getAmbulances } from '../api/ambulanceApi'
import { getDivisions, getDistricts, getUpazilas } from '../api/locationApi'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined && str !== '' ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

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
          padding: 44px 0 72px;
          border-bottom: 4px solid #EF4444;
          box-shadow: 0 14px 40px rgba(136, 19, 55, 0.35);
        }
        .ambulance-hero-title {
          color: #FFFFFF !important;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.6);
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
          gap: 14px;
          flex-wrap: wrap;
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
          flex: 1;
          min-width: 220px;
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

        /* ── AMBULANCE CARD ELEVATION ── */
        .ambulance-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1.5px solid #F1F5F9;
          padding: 22px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.02);
          position: relative;
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ambulance-card:hover {
          transform: translateY(-5px);
          border-color: #FECDD3;
          box-shadow: 0 20px 38px -6px rgba(220, 38, 38, 0.12), 0 4px 14px rgba(15, 23, 42, 0.04);
        }
        .ambulance-card-top-tag {
          font-size: 11.5px;
          font-weight: 800;
          color: #991B1B;
          background: #FEF2F2;
          padding: 4px 11px;
          border-radius: 99px;
          border: 1px solid #FECACA;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .ambulance-card-status-pill {
          font-size: 11px;
          font-weight: 800;
          color: #047857;
          background: #ECFDF5;
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid #A7F3D0;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .ambulance-card-avatar {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%);
          border: 1.5px solid #FECACA;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #DC2626;
          flex-shrink: 0;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.08);
        }
        .ambulance-hotline-container {
          background: linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%);
          border-radius: 14px;
          padding: 13px 16px;
          border: 1.5px solid #FECDD3;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .ambulance-hotline-container:hover {
          border-color: #F87171;
          background: linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%);
          transform: translateY(-1px);
        }
        .ambulance-hotline-phone-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #DC2626;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);
          flex-shrink: 0;
        }
        .ambulance-call-btn-primary {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
          color: #FFFFFF !important;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .ambulance-call-btn-primary:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 8px 22px rgba(220, 38, 38, 0.45);
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        }
        .ambulance-reception-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #F8FAFC;
          color: #334155 !important;
          padding: 10px 15px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          border: 1.5px solid #CBD5E1;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
          white-space: nowrap;
        }
        .ambulance-reception-btn:hover {
          background: #F1F5F9;
          border-color: #94A3B8;
          color: #0F172A !important;
          transform: translateY(-1.5px);
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

        @media (max-width: 991px) {
          .ambulance-hero-wrapper {
            padding: 36px 0 56px !important;
          }
          .ambulance-emergency-card {
            max-width: 100% !important;
            margin-top: 16px !important;
          }
        }
        @media (max-width: 576px) {
          .ambulance-trust-strip {
            gap: 6px !important;
          }
          .ambulance-trust-pill {
            font-size: 11px !important;
            padding: 4px 9px !important;
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
          <BreadcrumbHUD
            links={[
              { label: 'হোম', path: '/' },
              { label: 'হাসপাতাল অ্যাম্বুলেন্স' }
            ]}
            variant="light"
          />

          <Row className="align-items-center mt-3 g-4">
            <Col lg={8} xl={8}>
              <div className="ambulance-hero-badge">
                <span className="ambulance-beacon-dot" />
                <IconClock size={16} color="#FECDD3" />
                <span>২৪ ঘণ্টা জরুরি অ্যাম্বুলেন্স সার্ভিস ও হটলাইন নম্বর</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: '#FFFFFF',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  border: '2.5px solid rgba(255,255,255,0.9)',
                  flexShrink: 0
                }}>
                  <IconAmbulance size={32} stroke={2.3} />
                </div>
                <h1
                  className="ambulance-hero-title"
                  style={{
                    fontSize: 'clamp(22px, 3.8vw, 36px)',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    letterSpacing: '-0.5px',
                    margin: 0,
                    lineHeight: 1.25,
                    textShadow: '0 2px 14px rgba(0, 0, 0, 0.65)',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  হাসপাতাল জরুরি অ্যাম্বুলেন্স ডিরেক্টরি
                </h1>
              </div>

              <p style={{
                fontSize: 15.5,
                color: '#FFFFFF',
                maxWidth: 680,
                margin: 0,
                lineHeight: 1.65,
                fontWeight: 600,
                fontFamily: "'Hind Siliguri', sans-serif",
                textShadow: '0 1px 6px rgba(0,0,0,0.5)'
              }}>
                যেকোনো জরুরি স্বাস্থ্য সংকটে অথবা রোগী দ্রুত হাসপাতালে স্থানান্তরে সরাসরি হাসপাতালের নিজস্ব অ্যাম্বুলেন্স হটলাইনে কল করুন।
              </p>

              {/* Emergency Feature Trust Strip */}
              <div className="ambulance-trust-strip">
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
            </Col>

            <Col lg={4} xl={4} className="text-lg-end">
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

      <Container style={{ marginTop: -32, position: 'relative', zIndex: 10 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>
            মোট <span style={{ color: '#DC2626', fontWeight: 900 }}>{toBn(pagination.total)}</span> টি হাসপাতালে জরুরি অ্যাম্বুলেন্স সেবা রয়েছে
          </div>
          <div style={{ fontSize: 13, color: '#64748B' }}>
            পৃষ্ঠা {toBn(pagination.current_page)} / {toBn(pagination.last_page)}
          </div>
        </div>

        {/* ── AMBULANCE CARDS ── */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Spinner animation="border" style={{ color: '#DC2626', width: 44, height: 44 }} />
            <p style={{ marginTop: 14, color: '#64748B', fontSize: 14 }}>অ্যাম্বুলেন্স তালিকা লোড হচ্ছে...</p>
          </div>
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
                      {/* Top Badges Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <span className="ambulance-card-top-tag">
                          <span className="ambulance-beacon-dot" style={{ width: 7, height: 7 }} />
                          <IconAmbulance size={15} stroke={2.2} />
                          <span>২৪/৭ অ্যাম্বুলেন্স সেবা</span>
                        </span>

                        <span className="ambulance-card-status-pill">
                          <IconShieldCheck size={14} stroke={2.2} />
                          <span>সচল প্রতিষ্ঠান</span>
                        </span>
                      </div>

                      {/* Hospital Identity Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        <div className="ambulance-card-avatar">
                          {hospital.logo_url ? (
                            <img src={hospital.logo_url} alt={hospital.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <IconBuildingHospital size={30} stroke={1.8} />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{
                            fontSize: 17,
                            fontWeight: 800,
                            color: '#0F172A',
                            margin: 0,
                            lineHeight: 1.3,
                            fontFamily: "'Hind Siliguri', sans-serif",
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={hospital.name_bn || hospital.name}>
                            {hospital.name_bn || hospital.name}
                          </h3>
                          <div style={{
                            display: 'inline-block',
                            marginTop: 4,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: '#64748B',
                            background: '#F1F5F9',
                            padding: '2px 8px',
                            borderRadius: 6,
                            letterSpacing: '0.2px'
                          }}>
                            {hospital.hospital_type ? (hospital.hospital_type.toLowerCase() === 'private' ? 'বেসরকারি হাসপাতাল' : hospital.hospital_type.toLowerCase() === 'government' ? 'সরকারি হাসপাতাল' : hospital.hospital_type) : 'সাধারণ হাসপাতাল'}
                          </div>
                        </div>
                      </div>

                      {/* High-Contrast Emergency Ambulance Hotline Showcase Box */}
                      {hotlineNum && (
                        <a
                          href={`tel:${hotlineNum}`}
                          className="ambulance-hotline-container"
                          title="সরাসরি অ্যাম্বুলেন্স হটলাইনে কল করুন"
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 11.5,
                              color: '#991B1B',
                              fontWeight: 800,
                              marginBottom: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5
                            }}>
                              <span>জরুরি অ্যাম্বুলেন্স হটলাইন নম্বর:</span>
                            </div>
                            <div style={{
                              fontSize: 21,
                              fontWeight: 900,
                              color: '#B91C1C',
                              letterSpacing: '1px',
                              lineHeight: 1.2
                            }}>
                              {hotlineNum}
                            </div>
                          </div>
                          <div className="ambulance-hotline-phone-icon">
                            <IconPhone size={20} stroke={2.5} />
                          </div>
                        </a>
                      )}

                      {/* Location Address with Pin */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        fontSize: 13,
                        color: '#475569',
                        marginBottom: 16,
                        lineHeight: 1.45,
                        background: '#F8FAFC',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #F1F5F9'
                      }}>
                        <IconMapPin size={17} style={{ flexShrink: 0, marginTop: 2, color: '#DC2626' }} />
                        <div>
                          {hospital.address ? `${hospital.address}, ` : ''}
                          <strong style={{ color: '#1E293B' }}>{locationParts || 'বাংলাদেশ'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons Row */}
                    <div style={{ paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {hotlineNum && (
                          <a
                            href={`tel:${hotlineNum}`}
                            className="ambulance-call-btn-primary"
                          >
                            <IconPhone size={18} stroke={2.4} />
                            <span>অ্যাম্বুলেন্সে কল দিন</span>
                          </a>
                        )}

                        {hospital.phone && hospital.phone !== hotlineNum && (
                          <a
                            href={`tel:${hospital.phone}`}
                            className="ambulance-reception-btn"
                            title="হাসপাতাল রিসেপশন নম্বরে কল করুন"
                          >
                            <IconBuildingHospital size={16} stroke={2} />
                            <span>রিসেপশন</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              )
            })}
          </Row>
        )}

        {/* ── PAGINATION ── */}
        {!loading && pagination.last_page > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 40 }}>
            <button
              onClick={() => fetchAmbulances(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: pagination.current_page <= 1 ? '#94A3B8' : '#1E293B',
                fontWeight: 600,
                fontSize: 13,
                cursor: pagination.current_page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              পূর্ববর্তী
            </button>

            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => fetchAmbulances(page)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: page === pagination.current_page ? 'none' : '1px solid #CBD5E1',
                  background: page === pagination.current_page ? '#DC2626' : '#FFFFFF',
                  color: page === pagination.current_page ? '#FFFFFF' : '#334155',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                {toBn(page)}
              </button>
            ))}

            <button
              onClick={() => fetchAmbulances(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: pagination.current_page >= pagination.last_page ? '#94A3B8' : '#1E293B',
                fontWeight: 600,
                fontSize: 13,
                cursor: pagination.current_page >= pagination.last_page ? 'not-allowed' : 'pointer'
              }}
            >
              পরবর্তী
            </button>
          </div>
        )}
      </Container>
    </div>
  )
}

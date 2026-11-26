import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Container, Row, Col, Spinner, Modal, Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import {
  IconBuildingStore, IconSearch, IconMapPin, IconMap2, IconPhone, IconPhoneCall, IconBrandWhatsapp,
  IconClock, IconShieldCheck, IconTruckDelivery, IconDiscount, IconChevronDown,
  IconChevronLeft, IconChevronRight,
  IconX, IconFilter, IconExternalLink, IconInfoCircle, IconAlertCircle,
  IconPlus, IconSparkles, IconLock, IconEye, IconChecks, IconDeviceMobile,
  IconGridDots, IconListDetails, IconNavigation, IconArrowRight,
  IconPill, IconPills, IconFirstAidKit
} from '@tabler/icons-react'
import { getPublicPharmacies, revealPharmacyContact } from '../api/pharmacyApi'
import { getDivisions, getDistricts, getUpazilas, getUnions } from '../api/locationApi'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined && str !== '' ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

// Verified Badge Icon (Matching DoctorCard standard)
const VerifiedGreenBadge = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M10.374 2.378c.95-.504 2.102-.504 3.052 0l1.107.587c.453.24.966.35 1.478.318l1.247-.078c1.074-.067 2.072.51 2.52 1.487l.52 1.139c.212.467.553.858.986 1.133l1.054.67c.907.577 1.348 1.666 1.114 2.704l-.271 1.22c-.11.498-.07 1.016.117 1.49l.455 1.168c.394 1.012.046 2.167-.879 2.793l-1.071.724c-.439.297-.76.712-.927 1.199l-.409 1.185c-.352 1.026-1.378 1.684-2.457 1.579l-1.248-.121c-.512-.05-1.026.04-1.488.261l-1.127.549c-.968.472-2.12.472-3.088 0l-1.127-.549c-.462-.221-.976-.311-1.488-.261l-1.248.121c-1.079.105-2.105-.553-2.457-1.579l-.409-1.185c-.167-.487-.488-.902-.927-1.199l-1.071-.724c-.925-.626-1.273-1.781-.879-2.793l.455-1.168c.187-.474.227-.992.117-1.49l-.271-1.22c-.234-1.038.207-2.127 1.114-2.704l1.054-.67c.433-.275.774-.666.986-1.133l.52-1.139c.448-.977 1.446-1.554 2.52-1.487l1.247.078c.512.032 1.025-.078 1.478-.318l1.107-.587z" fill="#00B875"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M16.707 8.293a1 1 0 010 1.414l-5.5 5.5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 111.414-1.414L10.5 13.086l4.793-4.793a1 1 0 011.414 0z" fill="white"/>
  </svg>
)

// Return location name exactly as provided from database without cutting
const getCleanLocationName = (loc) => {
  if (!loc) return ''
  if (typeof loc === 'string') return loc.trim()
  return (loc.bangla_name || loc.name || '').trim()
}

const getPharmacyAddressInfo = (pharmacy) => {
  if (!pharmacy) return { areaHierarchy: 'বাংলাদেশ', streetAddress: '' }
  const unionName = getCleanLocationName(pharmacy.union)
  const upazilaName = getCleanLocationName(pharmacy.upazila)
  const districtName = getCleanLocationName(pharmacy.district)
  const rawParts = [unionName, upazilaName, districtName].filter(Boolean)
  const uniqueParts = rawParts.filter((item, idx) => rawParts.indexOf(item) === idx)
  const areaHierarchy = uniqueParts.join(', ') || 'বাংলাদেশ'

  const streetParts = [pharmacy.village_or_area, pharmacy.address_line]
    .map(s => (s || '').trim().replace(/[,.\s]+$/, ''))
    .filter(Boolean)
  const uniqueStreet = streetParts.filter((item, idx) => streetParts.indexOf(item) === idx)
  const primaryStreet = uniqueStreet.join(', ')
  const cardAddress = primaryStreet || areaHierarchy
  return { areaHierarchy, streetAddress: primaryStreet, cardAddress }
}

const formatSingleTimeBn = (timeStr) => {
  if (!timeStr) return ''
  const parts = String(timeStr).split(':')
  const h = parseInt(parts[0], 10)
  const m = parts[1] ? parts[1].slice(0, 2) : '00'
  if (isNaN(h)) return toBn(timeStr)
  let period = 'সকাল'
  if (h >= 12 && h < 15) period = 'দুপুর'
  else if (h >= 15 && h < 18) period = 'বিকাল'
  else if (h >= 18 && h < 20) period = 'সন্ধ্যা'
  else if (h >= 20 || h < 4) period = 'রাত'
  else if (h >= 4 && h < 6) period = 'ভোর'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${period} ${toBn(h12)}:${toBn(m)}`
}

const formatPharmacyHoursBn = (pharmacy) => {
  if (!pharmacy) return 'সকাল ৮:০০ - রাত ১১:০০'
  if (pharmacy.is_24_hours) return '২৪ ঘণ্টা খোলা (সপ্তাহে ৭ দিন)'
  if (pharmacy.opening_time && pharmacy.closing_time) {
    return `${formatSingleTimeBn(pharmacy.opening_time)} - ${formatSingleTimeBn(pharmacy.closing_time)}`
  }
  return 'সকাল ৮:০০ - রাত ১১:০০'
}

const PHARMACY_TYPES = {
  retail: 'খুচরা ফার্মেসি',
  model_pharmacy: 'মডেল ফার্মেসি',
  hospital_attached: 'হাসপাতাল সংলগ্ন',
  wholesaler: 'পাইকারি ওষুধ বিক্রেতা',
}

export default function PharmacyListPage() {
  const [loading, setLoading] = useState(true)
  const [pharmacies, setPharmacies] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  const [filter24Hours, setFilter24Hours] = useState(false)
  const [filterHomeDelivery, setFilterHomeDelivery] = useState(false)
  const [filterHasPharmacist, setFilterHasPharmacist] = useState(false)
  const [pharmacyType, setPharmacyType] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Locations state
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])

  // Revealed Contacts State: { [pharmacyId]: { contact_number, whatsapp_number, revealed_at } }
  const [revealedContacts, setRevealedContacts] = useState({})
  const [revealingId, setRevealingId] = useState(null)
  const [revealModalData, setRevealModalData] = useState(null)
  const [revealError, setRevealError] = useState('')
  const [detailModalPharmacy, setDetailModalPharmacy] = useState(null)
  const [viewMode, setViewMode] = useState('grid')

  // Load Divisions
  useEffect(() => {
    getDivisions().then(res => setDivisions(res.data?.data || [])).catch(() => {})
  }, [])

  // Cascade Locations
  useEffect(() => {
    if (!divisionId) { setDistricts([]); setDistrictId(''); setUpazilaId(''); setUnionId(''); return }
    getDistricts({ division_id: divisionId }).then(res => setDistricts(res.data?.data || [])).catch(() => {})
    setDistrictId('')
    setUpazilas([])
    setUpazilaId('')
    setUnions([])
    setUnionId('')
  }, [divisionId])

  useEffect(() => {
    if (!districtId) { setUpazilas([]); setUpazilaId(''); setUnionId(''); return }
    getUpazilas({ district_id: districtId }).then(res => setUpazilas(res.data?.data || [])).catch(() => {})
    setUpazilaId('')
    setUnions([])
    setUnionId('')
  }, [districtId])

  useEffect(() => {
    if (!upazilaId) { setUnions([]); setUnionId(''); return }
    getUnions({ upazila_id: upazilaId }).then(res => setUnions(res.data?.data || [])).catch(() => {})
    setUnionId('')
  }, [upazilaId])

  // Fetch Pharmacies
  const fetchPharmacies = async (page = 1) => {
    setLoading(true)
    try {
      const params = {
        page,
        per_page: 12,
        search: searchTerm.trim() || undefined,
        division_id: divisionId || undefined,
        district_id: districtId || undefined,
        upazila_id: upazilaId || undefined,
        union_id: unionId || undefined,
        is_24_hours: filter24Hours ? 1 : undefined,
        is_home_delivery_available: filterHomeDelivery ? 1 : undefined,
        has_pharmacist: filterHasPharmacist ? 1 : undefined,
        pharmacy_type: pharmacyType || undefined,
      }
      const res = await getPublicPharmacies(params)
      if (res.data?.success) {
        const payload = res.data.data
        setPharmacies(payload.data || [])
        setPagination({
          current_page: payload.current_page || 1,
          last_page: payload.last_page || 1,
          total: payload.total || 0,
        })
      }
    } catch (err) {
      console.error('Failed to load pharmacies', err)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPharmacies(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [
    searchTerm, divisionId, districtId, upazilaId, unionId,
    filter24Hours, filterHomeDelivery, filterHasPharmacist, pharmacyType
  ])

  // Open Details Modal and automatically reveal contact if not yet revealed
  const handleOpenDetailModal = (pharmacy) => {
    setDetailModalPharmacy(pharmacy)
    if (!revealedContacts[pharmacy.id]) {
      handleRevealContact(pharmacy, false)
    }
  }

  // Handle Contact Reveal with Modal (Zero Toast)
  const handleRevealContact = async (pharmacy, openNumberModal = true) => {
    if (revealedContacts[pharmacy.id]) {
      if (openNumberModal) {
        setRevealModalData({
          ...pharmacy,
          contact_number: revealedContacts[pharmacy.id].contact_number,
          whatsapp_number: revealedContacts[pharmacy.id].whatsapp_number || pharmacy.whatsapp_number,
        })
      }
      return
    }

    setRevealingId(pharmacy.id)
    setRevealError('')
    try {
      const res = await revealPharmacyContact(pharmacy.id)
      if (res.data?.success) {
        const cNum = res.data.contact_number
        const wNum = res.data.whatsapp_number
        setRevealedContacts(prev => ({
          ...prev,
          [pharmacy.id]: {
            contact_number: cNum,
            whatsapp_number: wNum,
            revealed_at: Date.now()
          }
        }))
        if (openNumberModal) {
          setRevealModalData({
            ...pharmacy,
            contact_number: cNum,
            whatsapp_number: wNum,
          })
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'কন্টাক্ট নম্বর লোড করা যায়নি। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।'
      setRevealError(msg)
      if (openNumberModal) {
        setRevealModalData({
          ...pharmacy,
          error: msg
        })
      }
    } finally {
      setRevealingId(null)
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
    setFilter24Hours(false)
    setFilterHomeDelivery(false)
    setFilterHasPharmacist(false)
    setPharmacyType('')
  }

  const hasActiveFilters = Boolean(
    searchTerm || divisionId || districtId || upazilaId || unionId ||
    filter24Hours || filterHomeDelivery || filterHasPharmacist || pharmacyType
  )

  const activeLocationAndTypeCount = [
    divisionId, districtId, upazilaId, unionId, pharmacyType,
    filter24Hours, filterHomeDelivery, filterHasPharmacist
  ].filter(Boolean).length

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: 110 }}>
      <style>{`
        .pharmacy-hero-wrapper {
          position: relative;
          overflow: hidden;
          background-color: #022c22;
          background-image:
            radial-gradient(rgba(110, 231, 183, 0.14) 1.5px, transparent 1.5px),
            linear-gradient(135deg, #022c22 0%, #064e3b 35%, #047857 78%, #059669 100%);
          background-size: 26px 26px, 100% 100%;
          color: #FFFFFF;
          padding: 56px 0 76px;
          border-bottom: 4px solid #10B981;
          box-shadow: 0 12px 36px rgba(6, 78, 59, 0.25);
        }
        .pharmacy-hero-watermark-cross {
          position: absolute;
          right: 3%;
          top: 10%;
          width: 260px;
          height: 260px;
          opacity: 0.06;
          pointer-events: none;
          transform: rotate(-10deg);
        }
        .pharmacy-hero-watermark-pill {
          position: absolute;
          left: 4%;
          bottom: 12%;
          width: 180px;
          height: 180px;
          opacity: 0.05;
          pointer-events: none;
          transform: rotate(25deg);
        }
        .pharmacy-hero-glow-1 {
          position: absolute;
          top: -60px;
          right: -40px;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(16, 185, 129, 0) 70%);
          pointer-events: none;
        }
        .pharmacy-hero-glow-2 {
          position: absolute;
          bottom: -50px;
          left: 10%;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, rgba(52, 211, 153, 0) 70%);
          pointer-events: none;
        }
        .pharmacy-hero-trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.08) 100%);
          border: 1px solid rgba(255, 255, 255, 0.28);
          backdrop-filter: blur(12px);
          padding: 6px 16px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 16px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
        }
        .pharmacy-trust-strip {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-top: 22px;
        }
        .pharmacy-trust-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(6px);
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12.5px;
          color: #E6FFFA;
          font-weight: 600;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .pharmacy-cta-card {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(14px);
          border: 1.5px solid rgba(255, 255, 255, 0.24);
          border-radius: 20px;
          padding: 22px 24px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
          text-align: center;
        }
        .pharmacy-mobile-glass-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1.2px solid rgba(255, 255, 255, 0.32);
          padding: 7px 16px 7px 11px;
          border-radius: 9999px;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 13px;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.35);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Hind Siliguri', sans-serif;
        }
        .pharmacy-mobile-glass-cta:hover,
        .pharmacy-mobile-glass-cta:active {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.14) 100%);
          border-color: rgba(255, 255, 255, 0.5);
          color: #FFFFFF;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.5);
        }
        .pharmacy-mobile-glass-cta .glass-icon-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.35);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #A7F3D0;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .pharmacy-mobile-glass-cta:hover .glass-icon-circle {
          background: rgba(255, 255, 255, 0.35);
          color: #FFFFFF;
        }
        .pharmacy-filter-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 18px 22px;
          box-shadow: 0 12px 35px -8px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.03);
          border: 1px solid #E2E8F0;
          margin-bottom: 28px;
          position: relative;
        }
        .search-action-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .main-search-wrap {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }
        .main-search-input {
          width: 100%;
          height: 48px;
          padding: 10px 40px 10px 44px;
          border-radius: 14px;
          border: 1.5px solid #CBD5E1;
          background: #F8FAFC;
          font-size: 14px;
          color: #0F172A;
          outline: none;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .main-search-input:focus {
          border-color: #059669;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
        }
        .filter-toggle-btn {
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
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .filter-toggle-btn:hover {
          border-color: #059669;
          color: #059669;
          background: #F0FDF4;
        }
        .filter-toggle-btn.is-open {
          border-color: #059669;
          background: #ECFDF5;
          color: #047857;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
        }
        .filter-toggle-btn.has-active {
          border-color: #059669;
          background: #ECFDF5;
          color: #047857;
        }
        .filter-badge-pill {
          background: #059669;
          color: #FFFFFF;
          border-radius: 99px;
          padding: 1px 7px;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.4;
        }
        .collapsible-filter-panel {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 16px 18px;
          margin-top: 14px;
          animation: filterSlideDown 0.22s ease-out;
        }
        @keyframes filterSlideDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .filter-grid-5 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          align-items: flex-end;
        }
        @media (max-width: 1199px) {
          .filter-grid-5 {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
        }
        @media (max-width: 767px) {
          .pharmacy-hero-wrapper {
            padding: 24px 0 32px !important;
          }
          .pharmacy-hero-watermark-cross,
          .pharmacy-hero-watermark-pill {
            display: none !important;
          }
          .pharmacy-hero-trust-badge {
            padding: 3px 10px !important;
            font-size: 11px !important;
            margin-bottom: 6px !important;
            gap: 5px !important;
          }
          .pharmacy-filter-card {
            padding: 10px 12px !important;
            border-radius: 14px !important;
            margin-top: -16px !important;
          }
          .search-action-row {
            flex-direction: row !important;
            gap: 8px !important;
          }
          .main-search-input {
            height: 42px !important;
            padding: 6px 30px 6px 36px !important;
            font-size: 13px !important;
            border-radius: 10px !important;
          }
          .filter-toggle-btn {
            height: 42px !important;
            padding: 0 12px !important;
            font-size: 12px !important;
            border-radius: 10px !important;
            gap: 5px !important;
          }
          .collapsible-filter-panel {
            padding: 10px !important;
            border-radius: 12px !important;
            margin-top: 10px !important;
          }
          .filter-grid-5 {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .filter-grid-5 > div:last-child {
            grid-column: span 2 !important;
          }
          .filter-select-control {
            height: 38px !important;
            font-size: 12px !important;
            padding: 4px 8px !important;
          }
          .quick-chip {
            padding: 4px 10px !important;
            font-size: 11px !important;
          }
        }
        .filter-col-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 5px;
          letter-spacing: 0.2px;
          font-family: 'Hind Siliguri', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .filter-select-control {
          height: 42px !important;
          border-radius: 11px !important;
          border: 1.5px solid #CBD5E1 !important;
          background-color: #FFFFFF !important;
          font-size: 13px !important;
          color: #0F172A !important;
          font-weight: 600 !important;
          outline: none !important;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif !important;
        }
        .filter-select-control:focus {
          border-color: #059669 !important;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12) !important;
        }
        .filter-select-control:disabled {
          background-color: #F1F5F9 !important;
          color: #94A3B8 !important;
          cursor: not-allowed;
          border-color: #E2E8F0 !important;
        }
        .quick-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 15px;
          border-radius: 24px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .quick-chip:hover {
          transform: translateY(-1px);
        }
      `}</style>

      {/* ── TOP HERO HEADER ── */}
      <div className="pharmacy-hero-wrapper">
        {/* Subtle Pharmacy Watermark Icons in Background */}
        <div className="pharmacy-hero-watermark-cross">
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7V2z" />
          </svg>
        </div>
        <div className="pharmacy-hero-watermark-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <rect x="3" y="8" width="18" height="8" rx="4" />
            <line x1="12" y1="8" x2="12" y2="16" />
          </svg>
        </div>

        <div className="pharmacy-hero-glow-1" />
        <div className="pharmacy-hero-glow-2" />

        <Container style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 10 }} className="d-none d-sm-block">
            <BreadcrumbHUD
              links={[
                { label: 'হোম', path: '/' },
                { label: 'ফার্মেসি ডিরেক্টরি' }
              ]}
              variant="light"
            />
          </div>

          <Row className="align-items-center mt-1 mt-md-2">
            <Col lg={8}>
              {/* Top Tag Row: Trust Badge */}
              <div className="d-flex align-items-center mb-2">
                <div className="pharmacy-hero-trust-badge m-0">
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 900,
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6EE7B7', display: 'inline-block' }} />
                    DGDA ভেরিফাইড
                  </span>
                  <span className="d-none d-sm-inline" style={{ color: 'rgba(255, 255, 255, 0.4)', margin: '0 2px' }}>•</span>
                  <span className="d-none d-sm-inline" style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: 700 }}>
                    অনুমোদিত ফার্মেসি নেটওয়ার্ক
                  </span>
                </div>
              </div>

              {/* Title (Pills icon is hidden on mobile to prevent awkward line breaks) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div
                  className="d-none d-lg-flex"
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.16)',
                    border: '1.5px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6EE7B7',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                    flexShrink: 0
                  }}
                >
                  <IconPills size={26} stroke={2.2} />
                </div>
                <h1 style={{
                  fontSize: 'clamp(20px, 3.8vw, 34px)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  margin: 0,
                  lineHeight: 1.25,
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  নিকটস্থ নির্ভরযোগ্য ফার্মেসি খুঁজুন
                </h1>
              </div>

              {/* Desktop Full Description */}
              <p className="d-none d-lg-block" style={{
                fontSize: 15,
                color: '#E6FFFA',
                maxWidth: 680,
                margin: 0,
                lineHeight: 1.65,
                fontWeight: 500,
                fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                জরুরি ওষুধ প্রয়োজন? ড্রাগ লাইসেন্স যাচাইকৃত অনুমোদিত ফার্মেসি থেকে সরাসরি যোগাযোগ করুন অথবা প্রেসক্রিপশন পাঠিয়ে ঘরে বসেই হোম ডেলিভারি গ্রহণ করুন।
              </p>

              {/* Mobile Brief 1-Line Subtitle */}
              <p className="d-block d-lg-none" style={{
                fontSize: 12.5,
                color: '#D1FAE5',
                margin: '0 0 10px 0',
                lineHeight: 1.4,
                fontWeight: 500,
                fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                যাচাইকৃত ফার্মেসি থেকে ওষুধ সংগ্রহ ও হোম ডেলিভারি সেবা
              </p>

              {/* Mobile CTA: Add My Pharmacy Glassmorphic Button */}
              <div className="d-block d-lg-none" style={{ marginBottom: 14 }}>
                <Link
                  to="/pharmacy-register"
                  className="pharmacy-mobile-glass-cta"
                >
                  <span className="glass-icon-circle">
                    <IconPlus size={14} stroke={3} />
                  </span>
                  <span>আমার ফার্মেসি যুক্ত করুন</span>
                </Link>
              </div>

              {/* Desktop-only Pharmacy Feature Trust Strip */}
              <div className="d-none d-lg-flex pharmacy-trust-strip">
                <div className="pharmacy-trust-pill">
                  <IconPill size={15} color="#6EE7B7" />
                  <span>১০০% আসল ওষুধ</span>
                </div>
                <div className="pharmacy-trust-pill">
                  <IconShieldCheck size={15} color="#6EE7B7" />
                  <span>ড্রাগ লাইসেন্স ভেরিফাইড</span>
                </div>
                <div className="pharmacy-trust-pill">
                  <IconTruckDelivery size={15} color="#6EE7B7" />
                  <span>দ্রুত হোম ডেলিভারি</span>
                </div>
                <div className="pharmacy-trust-pill">
                  <IconClock size={15} color="#6EE7B7" />
                  <span>২৪/৭ ইমার্জেন্সি সাপোর্ট</span>
                </div>
              </div>
            </Col>

            <Col lg={4} className="mt-4 mt-lg-0 d-none d-lg-block">
              <div className="pharmacy-cta-card">
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#ECFDF5',
                  color: '#059669',
                  marginBottom: 10,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}>
                  <IconFirstAidKit size={24} stroke={2.2} />
                </div>
                <h5 style={{
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 16,
                  marginBottom: 6,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  ফার্মেসির মালিক বা পরিচালক?
                </h5>
                <p style={{
                  color: '#D1FAE5',
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  marginBottom: 16,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  আপনার ফার্মেসি যুক্ত করে নিকটস্থ রোগীদের কাছে সহজে ডিজিটাল ওষুধ সেবা পৌঁছে দিন।
                </p>
                <Link
                  to="/pharmacy-register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    background: '#FFFFFF',
                    color: '#065F46',
                    fontWeight: 800,
                    fontSize: 14,
                    padding: '11px 20px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.18)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.12)'
                  }}
                >
                  <IconPlus size={16} stroke={2.5} />
                  <span>আমার ফার্মেসি যুক্ত করুন</span>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container style={{ marginTop: -26 }}>
        {/* ── SEARCH & FILTER CONSOLE ── */}
        <div className="pharmacy-filter-card">
          {/* Default Search Bar Row with Filter Toggle Button */}
          <div className="search-action-row">
            <div className="main-search-wrap">
              <IconSearch size={19} style={{ position: 'absolute', left: 16, color: '#059669', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="ফার্মেসির নাম বা এলাকার নাম দিয়ে খুঁজুন (যেমনঃ দিরাশা ফার্মেসি, সালাম বাজার)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="main-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: 14,
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IconX size={17} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`filter-toggle-btn ${showFilters ? 'is-open' : ''} ${activeLocationAndTypeCount > 0 ? 'has-active' : ''}`}
            >
              <IconFilter size={18} />
              <span>ফিল্টার</span>
              {activeLocationAndTypeCount > 0 && (
                <span className="filter-badge-pill">{toBn(activeLocationAndTypeCount)}</span>
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

          {/* Collapsible Filter Panel (Opens when filter button clicked) */}
          {showFilters && (
            <div className="collapsible-filter-panel">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
                flexWrap: 'wrap',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                  <IconMapPin size={15} color="#059669" />
                  <span>লোকেশন ও ফার্মেসির ধরন ফিল্টার:</span>
                </div>
                {(divisionId || districtId || upazilaId || unionId) && (
                  <div style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#047857',
                    background: '#ECFDF5',
                    padding: '2px 10px',
                    borderRadius: 12,
                    border: '1px solid #A7F3D0'
                  }}>
                    {[
                      divisions.find(d => d.id == divisionId)?.bangla_name,
                      districts.find(d => d.id == districtId)?.bangla_name,
                      upazilas.find(u => u.id == upazilaId)?.bangla_name,
                      unions.find(u => u.id == unionId)?.bangla_name,
                    ].filter(Boolean).join(' › ')}
                  </div>
                )}
              </div>

              <div className="filter-grid-5">
                {/* 1. Division */}
                <div className="filter-col">
                  <label className="filter-col-label">বিভাগ</label>
                  <Form.Select
                    value={divisionId}
                    onChange={(e) => setDivisionId(e.target.value)}
                    className="filter-select-control"
                  >
                    <option value="">সকল বিভাগ</option>
                    {divisions.map(d => (
                      <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                    ))}
                  </Form.Select>
                </div>

                {/* 2. District */}
                <div className="filter-col">
                  <label className="filter-col-label">জেলা</label>
                  <Form.Select
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    disabled={!divisionId}
                    className="filter-select-control"
                  >
                    <option value="">সকল জেলা</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                    ))}
                  </Form.Select>
                </div>

                {/* 3. Upazila */}
                <div className="filter-col">
                  <label className="filter-col-label">উপজেলা / থানা</label>
                  <Form.Select
                    value={upazilaId}
                    onChange={(e) => setUpazilaId(e.target.value)}
                    disabled={!districtId}
                    className="filter-select-control"
                  >
                    <option value="">সকল উপজেলা</option>
                    {upazilas.map(u => (
                      <option key={u.id} value={u.id}>{u.bangla_name || u.name}</option>
                    ))}
                  </Form.Select>
                </div>

                {/* 4. Union */}
                <div className="filter-col">
                  <label className="filter-col-label">ইউনিয়ন / ওয়ার্ড</label>
                  <Form.Select
                    value={unionId}
                    onChange={(e) => setUnionId(e.target.value)}
                    disabled={!upazilaId}
                    className="filter-select-control"
                  >
                    <option value="">সকল ইউনিয়ন</option>
                    {unions.map(u => (
                      <option key={u.id} value={u.id}>{u.bangla_name || u.name}</option>
                    ))}
                  </Form.Select>
                </div>

                {/* 5. Pharmacy Type */}
                <div className="filter-col">
                  <label className="filter-col-label">ফার্মেসির ধরন</label>
                  <Form.Select
                    value={pharmacyType}
                    onChange={(e) => setPharmacyType(e.target.value)}
                    className="filter-select-control"
                  >
                    <option value="">সকল ধরন</option>
                    {Object.entries(PHARMACY_TYPES).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </Form.Select>
                </div>
              </div>

              {/* Quick Filter Badges inside the Collapsible Filter Panel */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  দ্রুত ফিল্টার:
                </span>

                <button
                  type="button"
                  onClick={() => setFilter24Hours(!filter24Hours)}
                  className="quick-chip"
                  style={{
                    border: filter24Hours ? '1.5px solid #047857' : '1.5px solid #CBD5E1',
                    background: filter24Hours ? '#ECFDF5' : '#FFFFFF',
                    color: filter24Hours ? '#047857' : '#475569',
                  }}
                >
                  <IconClock size={15} />
                  <span>🌙 ২৪ ঘণ্টা খোলা</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterHomeDelivery(!filterHomeDelivery)}
                  className="quick-chip"
                  style={{
                    border: filterHomeDelivery ? '1.5px solid #0284C7' : '1.5px solid #CBD5E1',
                    background: filterHomeDelivery ? '#F0F9FF' : '#FFFFFF',
                    color: filterHomeDelivery ? '#0284C7' : '#475569',
                  }}
                >
                  <IconTruckDelivery size={15} />
                  <span>🚚 হোম ডেলিভারি</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterHasPharmacist(!filterHasPharmacist)}
                  className="quick-chip"
                  style={{
                    border: filterHasPharmacist ? '1.5px solid #7C3AED' : '1.5px solid #CBD5E1',
                    background: filterHasPharmacist ? '#F5F3FF' : '#FFFFFF',
                    color: filterHasPharmacist ? '#7C3AED' : '#475569',
                  }}
                >
                  <IconShieldCheck size={15} />
                  <span>🎓 গ্রেড-এ ফার্মাসিস্ট</span>
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#EF4444',
                      background: '#FEF2F2',
                      border: '1.5px solid #FEE2E2',
                      marginLeft: 'auto',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FEE2E2'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FEF2F2'
                    }}
                  >
                    <IconX size={15} />
                    <span>ফিল্টার রিসেট</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RESULT HEADER ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
          paddingBottom: 12,
          borderBottom: '1px solid #E2E8F0',
          gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flexShrink: 1 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              flexShrink: 0,
              background: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconBuildingStore size={17} color="#00B875" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexWrap: 'nowrap' }}>
              <h4 style={{
                fontWeight: 900,
                color: '#0F172A',
                fontSize: 15.5,
                margin: 0,
                whiteSpace: 'nowrap',
                fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                <span className="d-none d-sm-inline">অনুমোদিত </span>ফার্মেসি তালিকা
              </h4>
              <span style={{
                background: '#ECFDF5',
                color: '#047857',
                border: '1px solid #A7F3D0',
                padding: '1.5px 8px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                {toBn(pagination.total)} টি
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              display: 'inline-flex',
              background: '#F1F5F9',
              padding: 3,
              borderRadius: 10,
              border: '1px solid #E2E8F0'
            }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="গ্রিড ভিউ"
                style={{
                  border: 'none',
                  background: viewMode === 'grid' ? '#00B875' : 'transparent',
                  color: viewMode === 'grid' ? '#FFFFFF' : '#64748B',
                  width: 32,
                  height: 30,
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconGridDots size={17} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="লিস্ট ভিউ"
                style={{
                  border: 'none',
                  background: viewMode === 'list' ? '#00B875' : 'transparent',
                  color: viewMode === 'list' ? '#FFFFFF' : '#64748B',
                  width: 32,
                  height: 30,
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconListDetails size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* ── PHARMACY LIST CARDS ── */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Spinner animation="border" style={{ color: '#047857', width: 44, height: 44 }} />
            <p style={{ marginTop: 14, color: '#64748B', fontSize: 14 }}>ফার্মেসি লোড হচ্ছে...</p>
          </div>
        ) : pharmacies.length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '50px 24px',
            textAlign: 'center',
            border: '1px dashed #CBD5E1'
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <IconBuildingStore size={32} />
            </div>
            <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>কোনো ফার্মেসি পাওয়া যায়নি</h4>
            <p style={{ color: '#64748B', fontSize: 14, maxWidth: 440, margin: '0 auto 20px' }}>
              আপনার নির্বাচিত ফিল্টার বা ঠিকানায় বর্তমানে কোনো ভেরিফাইড ফার্মেসি নেই। ফিল্টার পরিবর্তন করে পুনরায় অনুসন্ধান করুন।
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{
                  background: '#047857',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13.5
                }}
              >
                সকল ফিল্টার রিসেট করুন
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ── COMPACT GRID VIEW CARDS (Top Profile Header Only; Click to Open Details) ── */
          <div className="pharmacy-grid-container">
            <style>{`
              .pharmacy-grid-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 16px;
              }
              .pharmacy-compact-card {
                background: #FFFFFF;
                border-radius: 14px;
                border: 1px solid #E5E7EB;
                padding: 14px;
                display: flex;
                flex-direction: column;
                justifyContent: space-between;
                box-shadow: 0 2px 8px rgba(0,0,0,0.03);
                transition: all 0.2s ease;
              }
              .pharmacy-compact-card:hover {
                border-color: #00B875;
                box-shadow: 0 8px 22px rgba(0, 184, 117, 0.12);
              }
              .pharmacy-thumb-box {
                width: 82px;
                height: 86px;
                border-radius: 10px;
                overflow: hidden;
                flex-shrink: 0;
                position: relative;
                display: flex;
                align-items: center;
                justifyContent: center;
                border: 1px solid #D1FAE5;
              }
              .pharmacy-bottom-bar {
                padding-top: 10px;
                margin-top: 10px;
                border-top: 1px solid #F1F5F9;
                display: flex;
                align-items: center;
                justifyContent: space-between;
                gap: 8px;
              }
              .pharmacy-bottom-actions {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-shrink: 0;
              }
              @media (max-width: 480px) {
                .pharmacy-grid-container {
                  grid-template-columns: 1fr;
                  gap: 12px;
                }
                .pharmacy-compact-card {
                  padding: 12px;
                }
                .pharmacy-thumb-box {
                  width: 74px;
                  height: 78px;
                }
                .pharmacy-bottom-bar {
                  flex-wrap: nowrap !important;
                }
              }
            `}</style>
            {pharmacies.map(pharmacy => {
              const isRevealed = Boolean(revealedContacts[pharmacy.id])
              const displayContact = isRevealed ? revealedContacts[pharmacy.id].contact_number : pharmacy.masked_contact
              const whatsapp = isRevealed ? (revealedContacts[pharmacy.id].whatsapp_number || pharmacy.whatsapp_number) : pharmacy.whatsapp_number
              const { cardAddress } = getPharmacyAddressInfo(pharmacy)
              const hoursText = formatPharmacyHoursBn(pharmacy)
              const pharmacyImage = pharmacy.logo_url || pharmacy.banner_url

              return (
                <div key={pharmacy.id} className="pharmacy-compact-card">
                  {/* Clickable Area: Marked top profile header */}
                  <div
                    onClick={() => handleOpenDetailModal(pharmacy)}
                    style={{ cursor: 'pointer' }}
                    title="বিস্তারিত দেখতে ক্লিক করুন"
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {/* Left Thumbnail (82x86 responsive) with Verified Badge */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                          className="pharmacy-thumb-box"
                          style={{
                            background: pharmacyImage ? '#F1F5F9' : 'linear-gradient(145deg, #F0FDF4 0%, #DCFCE7 100%)',
                            overflow: 'hidden'
                          }}
                        >
                          {pharmacyImage ? (
                            <img
                              src={pharmacyImage}
                              alt={pharmacy.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                            />
                          ) : (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%',
                              color: '#047857',
                              gap: 2
                            }}>
                              <IconBuildingStore size={32} stroke={1.75} />
                              <span style={{ fontSize: 9, fontWeight: 800, color: '#065F46', letterSpacing: '0.2px' }}>PHARMACY</span>
                            </div>
                          )}
                        </div>

                        {/* Verified Green Badge on Top Right of Thumbnail */}
                        <div style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          zIndex: 5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))'
                        }} title="ড্রাগ লাইসেন্স ভেরিফাইড">
                          <VerifiedGreenBadge size={18} />
                        </div>
                      </div>

                      {/* Right Text Column: Name, Category Ribbon, Live Status, Address & Hours */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <h4 style={{
                          fontWeight: 800,
                          color: '#0F172A',
                          fontSize: 15.5,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: "'Hind Siliguri', sans-serif",
                          lineHeight: 1.25
                        }} title={pharmacy.name}>
                          {pharmacy.name}
                        </h4>

                        {/* Signature Polygon Ribbon + Live Open Status Pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', margin: '2px 0' }}>
                          <span style={{
                            display: 'inline-block',
                            background: '#00B875',
                            color: '#FFFFFF',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px 2px 7px',
                            borderRadius: '4px 2px 2px 4px',
                            clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 50%, calc(100% - 5px) 100%, 0 100%)',
                            fontFamily: "'Hind Siliguri', sans-serif"
                          }}>
                            {PHARMACY_TYPES[pharmacy.pharmacy_type] || 'অনুমোদিত ফার্মেসি'}
                          </span>

                          {pharmacy.is_24_hours ? (
                            <span style={{
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontFamily: "'Hind Siliguri', sans-serif"
                            }}>
                              🌙 ২৪ ঘণ্টা
                            </span>
                          ) : (
                            <span style={{
                              background: pharmacy.is_open_now ? '#ECFDF5' : '#FEF2F2',
                              color: pharmacy.is_open_now ? '#059669' : '#B91C1C',
                              border: `1px solid ${pharmacy.is_open_now ? '#A7F3D0' : '#FECACA'}`,
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontFamily: "'Hind Siliguri', sans-serif"
                            }}>
                              <span style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: pharmacy.is_open_now ? '#10B981' : '#EF4444',
                                display: 'inline-block'
                              }} />
                              {pharmacy.is_open_now ? 'এখন খোলা' : 'এখন বন্ধ'}
                            </span>
                          )}
                        </div>

                        {/* Location Address Info (Village / Area / Street) */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#334155',
                          fontFamily: "'Hind Siliguri', sans-serif",
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={cardAddress}>
                          <IconMapPin size={13} color="#00A88C" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cardAddress}
                          </span>
                        </div>

                        {/* Operating Hours Info */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11.5,
                          color: '#475569',
                          fontFamily: "'Hind Siliguri', sans-serif",
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          <IconClock size={13} color="#00B875" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {hoursText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Single Row (Phone Number on Left + Action Icons on Right) */}
                  <div className="pharmacy-bottom-bar">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{
                        display: 'block',
                        fontSize: 9.5,
                        fontWeight: 600,
                        color: '#64748B',
                        lineHeight: 1.2,
                        fontFamily: "'Hind Siliguri', sans-serif"
                      }}>
                        যোগাযোগ নম্বর
                      </span>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#0F172A',
                        letterSpacing: '0.02em',
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap'
                      }}>
                        {toBn(displayContact || '০১৭********')}
                      </span>
                    </div>

                    <div className="pharmacy-bottom-actions">
                      {pharmacy.google_maps_link && (
                        <a
                          href={pharmacy.google_maps_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="গুগল ম্যাপে লোকেশন দেখুন"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: '#FFFFFF',
                            color: '#334155',
                            border: '1.5px solid #CBD5E1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00B875'; e.currentTarget.style.color = '#00B875' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#334155' }}
                        >
                          <IconMap2 size={17} color="#00B875" />
                        </a>
                      )}

                      {whatsapp && (
                        <a
                          href={`https://wa.me/88${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`হ্যালো, আমি ডক্টর বুকলেট (Doctor Booklet) এর মাধ্যমে ${pharmacy.name} এর সাথে যোগাযোগ করছি। আমার ওষুধ/প্রেসক্রিপশন প্রয়োজন।`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="হোয়াটসঅ্যাপে প্রেসক্রিপশন পাঠান"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: '#25D366',
                            color: '#FFFFFF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            boxShadow: '0 2px 7px rgba(37, 211, 102, 0.25)'
                          }}
                        >
                          <IconBrandWhatsapp size={18} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRevealContact(pharmacy)}
                        disabled={revealingId === pharmacy.id}
                        title={isRevealed ? 'সরাসরি কল করুন' : 'নম্বর দেখুন ও কল করুন'}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          border: 'none',
                          background: 'linear-gradient(135deg, #00B875 0%, #047857 100%)',
                          color: '#FFFFFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 3px 10px rgba(0, 184, 117, 0.25)',
                          flexShrink: 0
                        }}
                      >
                        {revealingId === pharmacy.id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <IconPhoneCall size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ── STANDARD LIST VIEW CARDS (Matching DoctorCard & BloodDonorsPage List View) ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <style>{`
              .pharmacy-list-card {
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
              }
              .pharmacy-list-card:hover {
                border-color: #00B875;
                box-shadow: 0 6px 20px rgba(0, 184, 117, 0.08);
              }
              .pharmacy-list-image-box {
                width: 185px;
                min-width: 185px;
                align-self: stretch;
                position: relative;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                border-right: 1px solid #E2E8F0;
              }
              @media (max-width: 767px) {
                .pharmacy-list-card {
                  flex-direction: column !important;
                }
                .pharmacy-list-image-box {
                  width: 100% !important;
                  min-width: 100% !important;
                  height: 180px !important;
                  border-right: none !important;
                  border-bottom: 1px solid #E2E8F0 !important;
                }
              }
            `}</style>
            {pharmacies.map(pharmacy => {
              const isRevealed = Boolean(revealedContacts[pharmacy.id])
              const displayContact = isRevealed ? revealedContacts[pharmacy.id].contact_number : pharmacy.masked_contact
              const whatsapp = isRevealed ? (revealedContacts[pharmacy.id].whatsapp_number || pharmacy.whatsapp_number) : pharmacy.whatsapp_number
              const { areaHierarchy, streetAddress } = getPharmacyAddressInfo(pharmacy)
              const hoursText = formatPharmacyHoursBn(pharmacy)
              const pharmacyImage = pharmacy.logo_url || pharmacy.banner_url

              return (
                <div
                  key={pharmacy.id}
                  className="pharmacy-list-card"
                >
                  {/* Left Featured Thumbnail Box */}
                  <div
                    className="pharmacy-list-image-box"
                    style={{
                      background: pharmacyImage ? '#F1F5F9' : 'linear-gradient(145deg, #F0FDF4 0%, #DCFCE7 100%)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {pharmacyImage ? (
                      <img
                        src={pharmacyImage}
                        alt={pharmacy.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#047857', gap: 4 }}>
                        <IconBuildingStore size={44} stroke={1.75} />
                        <span style={{ fontSize: 10.5, fontWeight: 800 }}>PHARMACY</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <VerifiedGreenBadge size={21} />
                    </div>
                  </div>

                  {/* Right Details Content */}
                  <div style={{
                    flex: 1,
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minWidth: 0
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <h3 style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: '#0F172A',
                            margin: '0 0 6px 0',
                            fontFamily: "'Hind Siliguri', sans-serif"
                          }}>
                            {pharmacy.name}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            <span style={{
                              display: 'inline-block',
                              background: '#00B875',
                              color: '#FFFFFF',
                              fontSize: 11.5,
                              fontWeight: 700,
                              padding: '2px 10px 2px 8px',
                              borderRadius: '4px 2px 2px 4px',
                              clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
                              fontFamily: "'Hind Siliguri', sans-serif"
                            }}>
                              {PHARMACY_TYPES[pharmacy.pharmacy_type] || 'অনুমোদিত ফার্মেসি'}
                            </span>
                            <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>
                              মালিক: <b style={{ color: '#0F172A' }}>{pharmacy.proprietor_name}</b>
                            </span>
                            <span style={{ fontSize: 12, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'Hind Siliguri', sans-serif" }}>
                              <IconClock size={14} color="#00B875" />
                              {hoursText}
                            </span>
                          </div>
                        </div>

                        <div>
                          {pharmacy.is_24_hours ? (
                            <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>
                              🌙 ২৪ ঘণ্টা খোলা
                            </span>
                          ) : (
                            <span style={{
                              background: pharmacy.is_open_now ? '#ECFDF5' : '#FEF2F2',
                              color: pharmacy.is_open_now ? '#059669' : '#B91C1C',
                              border: `1px solid ${pharmacy.is_open_now ? '#A7F3D0' : '#FECACA'}`,
                              fontSize: 11.5,
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: 6
                            }}>
                              {pharmacy.is_open_now ? '🟢 এখন খোলা' : '🔴 এখন বন্ধ'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0F172A', fontWeight: 700, marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>
                        <IconMapPin size={15} color="#00A88C" style={{ flexShrink: 0 }} />
                        <span>{areaHierarchy}{streetAddress ? ` • ${streetAddress}` : ''}</span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: 5, fontSize: 11.5, fontWeight: 700 }}>
                          🛡️ ড্রাগ লাইসেন্স ভেরিফাইড
                        </span>
                        {pharmacy.has_pharmacist && (
                          <span style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE', padding: '2px 8px', borderRadius: 5, fontSize: 11.5, fontWeight: 700 }}>
                            🎓 সার্টিফাইড ফার্মাসিস্ট সেবা
                          </span>
                        )}
                        {pharmacy.is_home_delivery_available && (
                          <span style={{ background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: 5, fontSize: 11.5, fontWeight: 700 }}>
                            🚚 হোম ডেলিভারি উপলব্ধ
                          </span>
                        )}
                        {pharmacy.discount_percentage > 0 && (
                          <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 5, fontSize: 11.5, fontWeight: 800 }}>
                            🏷️ {toBn(Number(pharmacy.discount_percentage))}% ছাড়
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10
                    }}>
                      <div>
                        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginRight: 6 }}>যোগাযোগ নম্বর:</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{toBn(displayContact || '০১৭********')}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {pharmacy.google_maps_link && (
                          <a
                            href={pharmacy.google_maps_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              height: 38,
                              padding: '0 14px',
                              borderRadius: 8,
                              background: '#FFFFFF',
                              color: '#0F172A',
                              border: '1.5px solid #CBD5E1',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 12.5,
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            <IconMapPin size={15} color="#00B875" />
                            <span>গুগল ম্যাপ</span>
                          </a>
                        )}
                        {whatsapp && (
                          <a
                            href={`https://wa.me/88${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`হ্যালো, আমি ডক্টর বুকলেট (Doctor Booklet) এর মাধ্যমে ${pharmacy.name} এর সাথে যোগাযোগ করছি।`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              height: 38,
                              padding: '0 14px',
                              borderRadius: 8,
                              background: '#25D366',
                              color: '#FFFFFF',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 12.5,
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            <IconBrandWhatsapp size={17} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRevealContact(pharmacy)}
                          disabled={revealingId === pharmacy.id}
                          style={{
                            height: 38,
                            padding: '0 16px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'linear-gradient(135deg, #00B875 0%, #047857 100%)',
                            color: '#FFFFFF',
                            fontSize: 13,
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)'
                          }}
                        >
                          <IconPhoneCall size={16} />
                          <span>{isRevealed ? 'কল করুন' : 'নম্বর দেখুন'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── PAGINATION CONTROLS (Matching BloodDonorsPage modern design) ── */}
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
              মোট <strong style={{ color: '#00B875' }}>{toBn(pagination.total)}</strong> টি
            </div>

            {/* Right: Modern Page Navigation Controls */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                disabled={pagination.current_page <= 1}
                onClick={() => {
                  fetchPharmacies(pagination.current_page - 1)
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
                    fetchPharmacies(page)
                    window.scrollTo({ top: 300, behavior: 'smooth' })
                  }}
                  style={{
                    minWidth: 34,
                    height: 34,
                    padding: '0 8px',
                    borderRadius: 8,
                    border: `1.5px solid ${pagination.current_page === page ? '#00B875' : '#E2E8F0'}`,
                    background: pagination.current_page === page ? '#00B875' : '#FFFFFF',
                    color: pagination.current_page === page ? '#FFFFFF' : '#334155',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: pagination.current_page === page ? '0 2px 6px rgba(0, 184, 117, 0.25)' : 'none',
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
                  fetchPharmacies(pagination.current_page + 1)
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
            marginTop: 24,
            padding: '12px 16px',
            color: '#64748B',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}>
            <IconChecks size={16} color="#00B875" />
            <span>সকল ফার্মেসি প্রদর্শিত হয়েছে ({toBn(pagination.total)} টি)</span>
          </div>
        ) : null}
      </Container>

      {/* ── MODAL: CONTACT NUMBER POPUP (ZERO TOAST & ULTRA COMPACT) ── */}
      <Modal
        show={Boolean(revealModalData)}
        onHide={() => setRevealModalData(null)}
        centered
        className="pharmacy-contact-modal-wrapper"
        dialogClassName="compact-pharmacy-contact-modal"
      >
        <style>{`
          .pharmacy-contact-modal-wrapper.modal {
            padding-left: 0 !important;
            padding-right: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .pharmacy-contact-modal-wrapper .modal-dialog,
          .compact-pharmacy-contact-modal {
            max-width: 310px !important;
            width: calc(100% - 32px) !important;
            margin: auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .pharmacy-contact-modal-wrapper .modal-content,
          .compact-pharmacy-contact-modal .modal-content {
            border-radius: 18px !important;
            border: none !important;
            overflow: hidden !important;
            box-shadow: 0 16px 36px rgba(15, 23, 42, 0.22) !important;
            width: 100% !important;
            margin: 0 auto !important;
          }
          .compact-close-corner-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #F1F5F9;
            border: none;
            color: #64748B;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
            padding: 0;
            z-index: 10;
          }
          .compact-close-corner-btn:hover {
            background: #E2E8F0;
            color: #0F172A;
            transform: scale(1.05);
          }
        `}</style>
        <Modal.Body style={{ padding: '18px 16px 14px', textAlign: 'center', position: 'relative' }}>
          {/* Top-Right Corner Close Button */}
          <button
            type="button"
            className="compact-close-corner-btn"
            onClick={() => setRevealModalData(null)}
            title="বন্ধ করুন"
            aria-label="Close"
          >
            <IconX size={16} />
          </button>

          {revealModalData?.error ? (
            <div>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <IconAlertCircle size={24} />
              </div>
              <h6 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 6, fontSize: 15 }}>সীমাবদ্ধতা সতর্কতা</h6>
              <p style={{ color: '#64748B', fontSize: 13, lineHeight: 1.45, marginBottom: 14 }}>
                {revealModalData.error}
              </p>
              <button
                type="button"
                onClick={() => setRevealModalData(null)}
                style={{ background: '#64748B', color: '#FFFFFF', border: 'none', padding: '7px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13 }}
              >
                ঠিক আছে
              </button>
            </div>
          ) : (
            <div>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ECFDF5', color: '#047857', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, marginTop: 4 }}>
                <IconPhone size={22} />
              </div>
              <h5 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 2, fontSize: 16 }}>
                {revealModalData?.name}
              </h5>
              <p style={{ color: '#64748B', fontSize: 12, marginBottom: 12 }}>
                মালিকঃ <strong>{revealModalData?.proprietor_name}</strong>
              </p>

              <div style={{
                background: '#F8FAFC',
                borderRadius: 12,
                padding: '10px 12px',
                border: '1.5px solid #E2E8F0',
                marginBottom: 12
              }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>
                  যোগাযোগের সরাসরি মোবাইল নম্বর:
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#047857', letterSpacing: '0.5px' }}>
                  {revealModalData?.contact_number}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`tel:${revealModalData?.contact_number}`}
                  style={{
                    flex: 1,
                    background: '#047857',
                    color: '#FFFFFF',
                    padding: '9px 10px',
                    borderRadius: 9,
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5
                  }}
                >
                  <IconPhone size={16} />
                  <span>সরাসরি কল</span>
                </a>

                {revealModalData?.whatsapp_number && (
                  <a
                    href={`https://wa.me/88${revealModalData.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(`হ্যালো, আমি ডক্টর বুকলেট এর মাধ্যমে ${revealModalData.name} এর সাথে যোগাযোগ করছি।`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#25D366',
                      color: '#FFFFFF',
                      padding: '9px 12px',
                      borderRadius: 9,
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5
                    }}
                  >
                    <IconBrandWhatsapp size={16} />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* ── MODAL: PHARMACY DETAIL INFO POPUP MODAL (COMPACT & BEAUTIFULLY DESIGNED) ── */}
      <Modal
        show={Boolean(detailModalPharmacy)}
        onHide={() => setDetailModalPharmacy(null)}
        centered
        dialogClassName="pharmacy-detail-dialog"
      >
        <style>{`
          .pharmacy-detail-dialog {
            max-width: 480px !important;
            margin: 1rem auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .pharmacy-detail-dialog .modal-content {
            border-radius: 18px;
            border: none;
            overflow: hidden;
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.2);
            width: 100%;
          }
          /* Ensure modal container centers perfectly without scrollbar jump */
          .modal {
            padding-left: 0 !important;
            padding-right: 0 !important;
            overflow-x: hidden !important;
          }
          @media (max-width: 576px) {
            .pharmacy-detail-dialog {
              width: calc(100% - 28px) !important;
              max-width: calc(100% - 28px) !important;
              margin: 0 auto !important;
            }
            .pharmacy-detail-dialog .modal-content {
              border-radius: 16px;
            }
            .pharmacy-modal-header {
              padding: 14px 16px !important;
            }
            .pharmacy-modal-body {
              padding: 14px 16px !important;
            }
            .pharmacy-modal-contact-bar {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 12px !important;
              text-align: center !important;
            }
            .pharmacy-modal-actions {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
            }
          }
        `}</style>
        {detailModalPharmacy && (() => {
          const p = detailModalPharmacy
          const { areaHierarchy, streetAddress } = getPharmacyAddressInfo(p)
          const hoursText = formatPharmacyHoursBn(p)
          const isRevealed = Boolean(revealedContacts[p.id])
          const fullContact = isRevealed ? revealedContacts[p.id].contact_number : p.masked_contact
          const whatsapp = isRevealed ? (revealedContacts[p.id].whatsapp_number || p.whatsapp_number) : p.whatsapp_number
          const pharmacyImage = p.logo_url || p.banner_url

          return (
            <div>
              {/* Modal Compact Header Banner */}
              <div
                className="pharmacy-modal-header"
                style={{
                  position: 'relative',
                  background: pharmacyImage
                    ? `linear-gradient(180deg, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.85) 100%), url(${pharmacyImage}) center/cover no-repeat`
                    : 'linear-gradient(135deg, #064E3B 0%, #059669 100%)',
                  padding: '16px 18px',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: '#FFFFFF',
                    border: '2px solid rgba(255,255,255,0.9)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669',
                    flexShrink: 0,
                    boxShadow: '0 3px 10px rgba(0,0,0,0.18)'
                  }}>
                    {pharmacyImage ? (
                      <img src={pharmacyImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <IconBuildingStore size={28} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                      <h5 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </h5>
                      <span style={{
                        background: 'rgba(255,255,255,0.22)',
                        backdropFilter: 'blur(4px)',
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}>
                        {PHARMACY_TYPES[p.pharmacy_type] || 'অনুমোদিত ফার্মেসি'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                      মালিক: <strong>{p.proprietor_name}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailModalPharmacy(null)}
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    border: 'none',
                    color: '#FFFFFF',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <IconX size={15} />
                </button>
              </div>

              {/* Modal Body: Compact Structured Info */}
              <Modal.Body className="pharmacy-modal-body" style={{ padding: '16px 18px', background: '#F8FAFC' }}>
                {/* 1. Location & Hours in 2 clean compact cards */}
                <Row className="g-2" style={{ marginBottom: 12 }}>
                  <Col xs={12} sm={7}>
                    <div style={{
                      background: '#FFFFFF',
                      borderRadius: 12,
                      padding: '12px 14px',
                      border: '1px solid #E2E8F0',
                      height: '100%'
                    }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <IconMapPin size={15} />
                        <span>ঠিকানা ও অবস্থান</span>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', lineHeight: 1.35, marginBottom: streetAddress ? 3 : 6 }}>
                        {areaHierarchy}
                      </div>
                      {streetAddress && (
                        <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.3, marginBottom: 6 }}>
                          {streetAddress}
                        </div>
                      )}
                      {p.google_maps_link && (
                        <a
                          href={p.google_maps_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#059669',
                            textDecoration: 'none'
                          }}
                        >
                          <IconExternalLink size={12} />
                          <span>গুগল ম্যাপে দেখুন</span>
                        </a>
                      )}
                    </div>
                  </Col>

                  <Col xs={12} sm={5}>
                    <div style={{
                      background: '#FFFFFF',
                      borderRadius: 12,
                      padding: '12px 14px',
                      border: '1px solid #E2E8F0',
                      height: '100%'
                    }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <IconClock size={15} />
                        <span>সময়সূচী</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        {hoursText}
                      </div>
                      <span style={{
                        background: p.is_open_now ? '#ECFDF5' : '#FEF2F2',
                        color: p.is_open_now ? '#059669' : '#B91C1C',
                        border: `1px solid ${p.is_open_now ? '#A7F3D0' : '#FECACA'}`,
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.is_open_now ? '#10B981' : '#EF4444' }} />
                        {p.is_open_now ? 'এখন খোলা' : 'এখন বন্ধ'}
                      </span>
                    </div>
                  </Col>
                </Row>

                {/* 2. Compact Feature Chips */}
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  padding: '12px 14px',
                  border: '1px solid #E2E8F0',
                  marginBottom: 14
                }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconShieldCheck size={16} color="#059669" />
                    <span>ভেরিফাইড সেবা ও সুবিধাসমূহ</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <IconShieldCheck size={13} /> লাইসেন্স ভেরিফাইড
                    </span>
                    {p.is_24_hours && (
                      <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        🌙 ২৪ ঘণ্টা
                      </span>
                    )}
                    {p.has_pharmacist && (
                      <span style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconChecks size={13} /> ফার্মাসিস্ট সেবা
                      </span>
                    )}
                    {p.is_home_delivery_available && (
                      <span style={{ background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconTruckDelivery size={13} /> হোম ডেলিভারি
                      </span>
                    )}
                    {Number(p.discount_percentage) > 0 && (
                      <span style={{ background: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                        🎁 {toBn(Number(p.discount_percentage))}% বিশেষ ছাড়
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Direct Contact Bar: Phone directly visible + Call & WhatsApp */}
                <div
                  className="pharmacy-modal-contact-bar"
                  style={{
                    background: '#ECFDF5',
                    border: '1.5px solid #A7F3D0',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: '#065F46', fontWeight: 700, marginBottom: 1 }}>
                      যোগাযোগ নম্বর:
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#064E3B', letterSpacing: '0.5px' }}>
                      {revealingId === p.id ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        toBn(fullContact || '০১৭********')
                      )}
                    </div>
                  </div>

                  <div className="pharmacy-modal-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {whatsapp && (
                      <a
                        href={`https://wa.me/88${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`হ্যালো, আমি ডক্টর বুকলেট এর মাধ্যমে ${p.name} এর সাথে যোগাযোগ করছি।`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#25D366',
                          color: '#FFFFFF',
                          padding: '9px 14px',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 12.5,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)'
                        }}
                      >
                        <IconBrandWhatsapp size={16} />
                        <span>হোয়াটসঅ্যাপ</span>
                      </a>
                    )}

                    <a
                      href={`tel:${isRevealed ? revealedContacts[p.id].contact_number : p.masked_contact}`}
                      style={{
                        background: 'linear-gradient(135deg, #00B875 0%, #047857 100%)',
                        color: '#FFFFFF',
                        padding: '9px 16px',
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: 12.5,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        boxShadow: '0 3px 10px rgba(0, 184, 117, 0.25)'
                      }}
                    >
                      <IconPhoneCall size={16} />
                      <span>কল করুন</span>
                    </a>
                  </div>
                </div>
              </Modal.Body>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

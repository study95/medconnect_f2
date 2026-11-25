import React, { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Form, Spinner, Modal } from 'react-bootstrap'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import { 
  IconDroplet, IconHeart, IconCalendar, IconMapPin, IconPhone, IconUpload, 
  IconShieldCheck, IconClock, IconArrowLeft, IconActivity, IconUser, 
  IconCheck, IconAlertCircle, IconCircleCheck, IconChevronDown, IconCamera,
  IconArrowRight, IconSparkles, IconInfoCircle, IconLock, IconX
} from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getMyProfile } from '../api/authApi'
import { getMyDonorProfile, saveDonorProfile, toggleDonorAvailability, logDonation } from '../api/bloodDonorApi'
import { getDivisions, getDistricts, getUpazilas, getUnions } from '../api/locationApi'
import { getMediaUrl } from '../utils/mediaUtils'
import { getBangladeshTodayStr } from '../utils/dateUtils'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined && str !== '' ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

export default function BloodDonorRegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoggedIn, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isExisting, setIsExisting] = useState(false)
  const [donorData, setDonorData] = useState(null)
  const [autoFilled, setAutoFilled] = useState(false)

  // Form Fields
  const [name, setName] = useState('')
  const [bloodGroup, setBloodGroup] = useState('A+')
  const [gender, setGender] = useState('male')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [altContactNumber, setAltContactNumber] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  const [villageOrArea, setVillageOrArea] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [lastDonatedAt, setLastDonatedAt] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [hideContactPublicly, setHideContactPublicly] = useState(false)
  const [eligibilityConfirmed, setEligibilityConfirmed] = useState(true)
  const [photoPreview, setPhotoPreview] = useState('')
  const [syncToProfile, setSyncToProfile] = useState(true)
  const [showDonationConfirmModal, setShowDonationConfirmModal] = useState(false)
  const [loggingDonation, setLoggingDonation] = useState(false)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [togglingAvailability, setTogglingAvailability] = useState(false)
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('')
  const [generalSubmitError, setGeneralSubmitError] = useState('')
  const altContactRef = useRef(null)
  const [showAltPhoneHint, setShowAltPhoneHint] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const initialLoadedRef = useRef(false)

  // Handle Alternate Phone Input with strict 11-digit Bangladeshi filter
  const handleAltContactChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11)
    setAltContactNumber(digitsOnly)
    clearError('alternate_contact_number')
  }

  const handleAltContactBlur = () => {
    if (!altContactNumber) return
    const cleanAlt = altContactNumber.replace(/\D/g, '')
    if (cleanAlt.length > 0 && !/^01[3-9]\d{8}$/.test(cleanAlt)) {
      setFieldErrors(prev => ({
        ...prev,
        alternate_contact_number: 'সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমনঃ 017XXXXXXXX)।'
      }))
    } else if (contactNumber && cleanAlt === contactNumber.replace(/\D/g, '')) {
      setFieldErrors(prev => ({
        ...prev,
        alternate_contact_number: 'বিকল্প নম্বরটি প্রাথমিক নম্বরের চেয়ে ভিন্ন হতে হবে।'
      }))
    }
  }

  // Clear single field error when user interacts with it
  const clearError = (field) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev
      const copy = { ...prev }
      delete copy[field]
      return copy
    })
  }

  // Smooth auto-scroll to the first field that failed validation
  const scrollToFirstError = (errors) => {
    const fieldOrder = [
      'blood_group',
      'gender',
      'date_of_birth',
      'contact_number',
      'alternate_contact_number',
      'division_id',
      'district_id',
      'upazila_id',
      'union_id',
      'village_or_area',
      'address_line',
      'last_donated_at',
      'eligibility_confirmed'
    ]

    const errorKeys = Object.keys(errors)
    const firstKey = fieldOrder.find(k => errorKeys.includes(k)) || errorKeys[0]

    if (!firstKey) return

    setTimeout(() => {
      const el = document.getElementById(`field-${firstKey}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('field-highlight-error')
        setTimeout(() => el.classList.remove('field-highlight-error'), 2500)
        const focusable = el.tagName === 'INPUT' || el.tagName === 'SELECT' ? el : el.querySelector('input, select')
        if (focusable) {
          try { focusable.focus({ preventScroll: true }) } catch {}
        }
      }
    }, 120)
  }

  // Location Cascade Dropdown Options
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])

  // Load existing profile & Divisions on mount
  useEffect(() => {
    getDivisions()
      .then(res => setDivisions(res.data?.data || []))
      .catch(() => {})

    if (authLoading) return

    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    if (initialLoadedRef.current) return
    initialLoadedRef.current = true

    getMyDonorProfile()
      .then(async res => {
        if (res.data?.success && res.data?.registered && res.data?.data) {
          const d = res.data.data
          setIsExisting(true)
          setDonorData(d)
          setName(d.name || '')
          setBloodGroup(d.blood_group || 'A+')
          setGender(d.gender || 'male')
          setDateOfBirth(d.date_of_birth ? d.date_of_birth.substring(0, 10) : '')
          setContactNumber(d.contact_number || '')
          setAltContactNumber(d.alternate_contact_number || '')
          setDivisionId(d.division_id ? String(d.division_id) : '')
          setDistrictId(d.district_id ? String(d.district_id) : '')
          setUpazilaId(d.upazila_id ? String(d.upazila_id) : '')
          setUnionId(d.union_id ? String(d.union_id) : '')
          setVillageOrArea(d.village_or_area || '')
          setAddressLine(d.address_line || '')
          setLastDonatedAt(d.last_donated_at ? d.last_donated_at.substring(0, 10) : '')
          setIsAvailable(d.is_available ?? true)
          setHideContactPublicly(d.hide_contact_publicly ?? false)
          if (d.photo_url) setPhotoPreview(d.photo_url)
        } else {
          // User is logged in but not registered as donor yet -> Smart pre-fill from user profile!
          try {
            const profileRes = await getMyProfile()
            const data = profileRes.data?.data || profileRes.data
            const pat = data?.patient || {}
            const doc = data?.doctor || {}

            const profileName = data?.name || user?.name || ''
            const profilePhone = data?.phone || user?.phone || user?.mobile || ''
            const profileBg = pat.blood_group || doc.blood_group
            const profileGender = pat.gender || doc.gender || user?.gender
            const profileDob = pat.date_of_birth || doc.date_of_birth
            const profileDivId = pat.division_id || doc.division_id
            const profileDistId = pat.district_id || doc.district_id
            const profileUpzId = pat.upazila_id || doc.upazila_id
            const profileUnId = pat.union_id || doc.union_id
            const profilePhoto = data?.photo || user?.photo

            if (profileName) setName(profileName)
            if (profilePhone) setContactNumber(profilePhone)
            if (profileBg && BLOOD_GROUPS.includes(profileBg)) setBloodGroup(profileBg)
            if (profileGender) setGender(profileGender)
            if (profileDob) setDateOfBirth(profileDob.substring(0, 10))
            if (profileDivId) setDivisionId(String(profileDivId))
            if (profileDistId) setDistrictId(String(profileDistId))
            if (profileUpzId) setUpazilaId(String(profileUpzId))
            if (profileUnId) setUnionId(String(profileUnId))
            if (profilePhoto) setPhotoPreview(profilePhoto)

            if (profileName || profilePhone || profileBg) {
              setAutoFilled(true)
            }
          } catch {
            // Fallback to basic session user
            if (user?.name) setName(user.name)
            if (user?.phone || user?.mobile) setContactNumber(user.phone || user.mobile)
            if (user?.photo) setPhotoPreview(user.photo)
            if (user?.name || user?.phone) setAutoFilled(true)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isLoggedIn, authLoading, user])

  // Location Cascades
  useEffect(() => {
    if (!divisionId) { setDistricts([]); return }
    getDistricts({ division_id: divisionId }).then(res => setDistricts(res.data?.data || [])).catch(() => {})
  }, [divisionId])

  useEffect(() => {
    if (!districtId) { setUpazilas([]); return }
    getUpazilas({ district_id: districtId }).then(res => setUpazilas(res.data?.data || [])).catch(() => {})
  }, [districtId])

  useEffect(() => {
    if (!upazilaId) { setUnions([]); return }
    getUnions({ upazila_id: upazilaId }).then(res => setUnions(res.data?.data || [])).catch(() => {})
  }, [upazilaId])

  // Handle Form Submit with Precise Validation and Smooth Auto-Scroll
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})

    const donorName = (user?.name || name || '').trim()
    const clientErrors = {}
    if (!bloodGroup) clientErrors.blood_group = 'রক্তের গ্রুপ নির্বাচন করুন।'
    if (!gender) clientErrors.gender = 'লিঙ্গ নির্বাচন করুন।'
    if (!dateOfBirth) clientErrors.date_of_birth = 'জন্মতারিখ প্রদান করুন।'
    if (!contactNumber.trim()) clientErrors.contact_number = 'মোবাইল নম্বর প্রদান করুন।'
    if (!divisionId) clientErrors.division_id = 'বিভাগ নির্বাচন করুন।'
    if (!districtId) clientErrors.district_id = 'জেলা নির্বাচন করুন।'
    if (!upazilaId) clientErrors.upazila_id = 'উপজেলা নির্বাচন করুন।'
    if (!eligibilityConfirmed) clientErrors.eligibility_confirmed = 'শারীরিক উপযুক্ততা নিশ্চিত করা আবশ্যক।'

    if (altContactNumber) {
      const cleanAlt = altContactNumber.replace(/\D/g, '')
      if (!/^01[3-9]\d{8}$/.test(cleanAlt)) {
        clientErrors.alternate_contact_number = 'সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমনঃ 017XXXXXXXX)।'
      } else if (contactNumber && cleanAlt === contactNumber.replace(/\D/g, '')) {
        clientErrors.alternate_contact_number = 'বিকল্প নম্বরটি প্রাথমিক নম্বরের চেয়ে ভিন্ন হতে হবে।'
      }
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      scrollToFirstError(clientErrors)
      return
    }

    setSaving(true)
    setGeneralSubmitError('')
    const formData = new FormData()
    formData.append('name', donorName)
    formData.append('blood_group', bloodGroup)
    formData.append('gender', gender)
    formData.append('date_of_birth', dateOfBirth)
    formData.append('contact_number', contactNumber)
    formData.append('alternate_contact_number', altContactNumber ? altContactNumber.trim() : '')
    formData.append('division_id', divisionId)
    formData.append('district_id', districtId)
    formData.append('upazila_id', upazilaId)
    if (unionId) formData.append('union_id', unionId)
    if (villageOrArea) formData.append('village_or_area', villageOrArea)
    if (addressLine) formData.append('address_line', addressLine)
    if (lastDonatedAt) formData.append('last_donated_at', lastDonatedAt)
    formData.append('is_available', isAvailable ? '1' : '0')
    formData.append('hide_contact_publicly', hideContactPublicly ? '1' : '0')
    formData.append('eligibility_confirmed', '1')
    formData.append('sync_to_profile', syncToProfile ? '1' : '0')

    try {
      const res = await saveDonorProfile(formData)
      if (res.data?.success) {
        setIsExisting(true)
        setDonorData(res.data.data)
        setSaveSuccessMessage(res.data.message || 'আপনার রক্তদাতা প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!')
        setShowSaveSuccessModal(true)
      }
    } catch (err) {
      if (err.response?.status === 422) {
        const serverErrors = err.response?.data?.errors || {}
        const normalizedErrors = {}
        for (const [key, val] of Object.entries(serverErrors)) {
          normalizedErrors[key] = Array.isArray(val) ? val[0] : String(val)
        }

        setFieldErrors(normalizedErrors)
        scrollToFirstError(normalizedErrors)
      } else {
        const msg = err.response?.data?.message || 'সংরক্ষণ ব্যর্থ হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।'
        setGeneralSubmitError(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  // Quick Action: "I donated blood today" -> Open Confirmation Modal
  const handleLogDonationToday = () => {
    setShowDonationConfirmModal(true)
  }

  // Confirm Logging Donation
  const confirmLogDonationToday = async () => {
    setLoggingDonation(true)
    try {
      const today = getBangladeshTodayStr()
      const res = await logDonation({ donation_date: today })
      if (res.data?.success) {
        setLastDonatedAt(today)
        if (donorData) {
          setDonorData({
            ...donorData,
            last_donated_at: today,
            total_donations: res.data.total_donations,
            days_until_available: res.data.days_until_available,
            is_ready_to_donate: false,
            status: 'cooldown'
          })
        }
        setShowDonationConfirmModal(false)
      }
    } catch (err) {
      console.error('Failed to log donation:', err)
    } finally {
      setLoggingDonation(false)
    }
  }

  const isCooldown = Boolean(
    (donorData?.days_until_available && donorData.days_until_available > 0) ||
    donorData?.status === 'cooldown' ||
    (donorData?.is_ready_to_donate === false && donorData?.days_until_available > 0)
  )

  // Status Badge Click Handler: Opens confirmation modal, no toast
  const handleStatusBadgeClick = () => {
    toast.dismiss()
    setShowAvailabilityModal(true)
  }

  // Confirm Availability Toggle (Executed from modal, no toast)
  const confirmToggleAvailability = async () => {
    if (isCooldown) {
      setShowAvailabilityModal(false)
      return
    }
    setTogglingAvailability(true)
    toast.dismiss()
    try {
      const res = await toggleDonorAvailability()
      if (res.data?.success) {
        setIsAvailable(res.data.is_available)
        if (donorData) {
          setDonorData({
            ...donorData,
            is_available: res.data.is_available,
            is_ready_to_donate: res.data.is_available && !isCooldown
          })
        }
        setShowAvailabilityModal(false)
      }
    } catch {
      // Suppress toast, fail cleanly
    } finally {
      setTogglingAvailability(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <Spinner animation="border" style={{ color: '#E11D48', width: 44, height: 44 }} />
      </div>
    )
  }

  // Guest Gate: If user is not logged in, prompt to login with redirect back
  if (!isLoggedIn) {
    return (
      <div className="donor-register-page-wrapper">
        <Container>
          <div style={{ marginBottom: 16 }}>
            <BreadcrumbHUD 
              links={[
                { label: 'রক্তদাতা নেটওয়ার্ক', path: '/blood-donors' },
                { label: 'রক্তদাতা নিবন্ধন' }
              ]} 
              variant="dark" 
              showBack={false}
            />
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: 24,
            padding: '40px 24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 30px rgba(15,23,42,0.06)',
            maxWidth: 560,
            margin: '20px auto 40px',
            textAlign: 'center'
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#FFF1F2', color: '#E11D48',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 18, border: '2px solid #FFE4E6',
              boxShadow: '0 6px 16px rgba(225,29,72,0.15)'
            }}>
              <IconHeart size={36} />
            </div>

            <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 22, marginBottom: 10 }}>
              রক্তদাতা হিসেবে নিবন্ধন করতে লগইন করুন
            </h3>

            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              রক্তদাতার সঠিক পরিচিতি এবং মানবিক নিরাপত্তা নিশ্চিত করতে আমাদের প্ল্যাটফর্মে একটি একাউন্ট থাকা আবশ্যক। লগইন করলে আপনার প্রোফাইল থেকে প্রয়োজনীয় তথ্য স্বয়ংক্রিয়ভাবে বসে যাবে।
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300, margin: '0 auto' }}>
              <Link
                to="/login"
                state={{ from: location.pathname }}
                style={{
                  background: 'linear-gradient(135deg, #00A88C 0%, #008C75 100%)',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 14.5,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 6px 20px rgba(0,168,140,0.28)'
                }}
              >
                <IconUser size={18} />
                লগইন বা সাইন-আপ করুন
              </Link>

              <Link
                to="/blood-donors"
                style={{
                  color: '#64748B',
                  fontWeight: 700,
                  fontSize: 13.5,
                  textDecoration: 'none',
                  padding: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <IconArrowLeft size={16} />
                রক্তদাতা তালিকায় ফিরে যান
              </Link>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="donor-register-page-wrapper">
      <style>{`
        .donor-register-page-wrapper {
          background: #F8FAFC;
          min-height: 100vh;
          padding-top: calc(var(--header-height, 58px) + 12px);
          padding-bottom: 50px;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
        }

        @keyframes fieldErrorGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
          50% { box-shadow: 0 0 0 5px rgba(225, 29, 72, 0.28); }
        }
        .field-highlight-error {
          animation: fieldErrorGlow 0.8s ease-in-out 3;
          border-radius: 14px;
        }
        .field-error-text {
          color: #E11D48;
          font-size: 12px;
          font-weight: 700;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 4px;
          line-height: 1.4;
        }
        .has-field-error {
          border-color: #E11D48 !important;
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.15) !important;
        }

        /* ── HERO BANNER ── */
        .register-hero-card {
          background: linear-gradient(135deg, #FFFFFF 0%, #FFF5F6 100%);
          border: 1px solid #FFE4E6;
          border-radius: 20px;
          padding: 22px 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(225, 29, 72, 0.04);
          position: relative;
          overflow: hidden;
        }
        .register-hero-card::after {
          content: '';
          position: absolute;
          right: -30px;
          top: -30px;
          width: 140px;
          height: 140px;
          background: radial-gradient(circle, rgba(225, 29, 72, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .hero-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFF1F2;
          color: #BE123C;
          border: 1px solid #FECDD3;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 12.5px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        /* ── EXISTING DONOR CARD (PREMIUM CRIMSON RED THEME) ── */
        .existing-donor-card {
          background: linear-gradient(135deg, #881337 0%, #9F1239 45%, #BE123C 100%);
          border-radius: 20px;
          padding: 22px 26px;
          color: #FFFFFF;
          margin-bottom: 22px;
          box-shadow: 0 12px 32px rgba(159, 18, 57, 0.28);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }
        .existing-donor-card::before {
          content: '';
          position: absolute;
          top: -35px;
          right: -35px;
          width: 170px;
          height: 170px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .existing-donor-card::after {
          content: '';
          position: absolute;
          bottom: -40px;
          left: 15%;
          width: 200px;
          height: 100px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .existing-action-btn {
          background: #FFFFFF;
          color: #9F1239;
          border: 1.5px solid rgba(255, 255, 255, 0.95);
          padding: 9px 18px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        }
        .existing-action-btn:hover {
          background: #FFF1F2;
          color: #881337;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
        }
        .existing-action-btn.cooldown-active {
          background: #FFFFFF !important;
          color: #065F46 !important;
          border: 1.5px solid #A7F3D0 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .existing-status-badge {
          padding: 9px 18px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          white-space: nowrap;
          border: 1.5px solid transparent;
        }
        .existing-status-badge.ready {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.28) 0%, rgba(5, 150, 105, 0.38) 100%);
          border-color: rgba(110, 231, 183, 0.7);
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
        }
        .existing-status-badge.ready:hover {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.38) 0%, rgba(5, 150, 105, 0.48) 100%);
          border-color: #A7F3D0;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        .existing-status-badge.cooldown {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.28) 0%, rgba(217, 119, 6, 0.38) 100%);
          border-color: rgba(253, 224, 71, 0.75);
          color: #FEF08A;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
        }
        .existing-status-badge.cooldown:hover {
          transform: translateY(-1px);
          border-color: #FEF08A;
        }
        .existing-status-badge.paused {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.38);
          color: rgba(255, 255, 255, 0.9);
        }
        .existing-status-badge.paused:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.6);
          transform: translateY(-1px);
        }
        .live-status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }
        .live-status-dot.ready {
          background: #34D399;
          box-shadow: 0 0 10px #34D399;
          animation: pulseStatusDot 2s infinite ease-in-out;
        }
        .live-status-dot.paused {
          background: #CBD5E1;
        }
        @keyframes pulseStatusDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.75; }
        }

        /* ── FORM CARD ── */
        .register-form-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 28px 24px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 25px rgba(15, 23, 42, 0.04);
        }

        /* ── STEP HEADERS ── */
        .form-section-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 800;
          color: #00A88C;
          background: #E6F7F5;
          padding: 6px 14px;
          border-radius: 10px;
          border: 1px solid #A7F3D0;
          margin-bottom: 16px;
        }

        /* ── INTERACTIVE BLOOD GROUP GRID ── */
        .blood-grid-selector {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 6px;
        }
        .blood-chip-item {
          padding: 10px 6px;
          border-radius: 14px;
          border: 1.5px solid #E2E8F0;
          background: #F8FAFC;
          color: #1E293B;
          font-weight: 800;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }
        .blood-chip-item:hover {
          background: #FFF1F2;
          border-color: #FECDD3;
          color: #BE123C;
        }
        .blood-chip-item.active {
          background: linear-gradient(135deg, #E11D48 0%, #BE123C 100%);
          border-color: transparent;
          color: #FFFFFF;
          box-shadow: 0 6px 16px rgba(225, 29, 72, 0.32);
          transform: translateY(-2px);
        }

        /* ── GENDER PILLS ── */
        .gender-grid-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 6px;
        }
        .gender-pill-item {
          padding: 10px 4px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          background: #F8FAFC;
          color: #334155;
          font-weight: 700;
          font-size: 13.5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.18s ease;
          user-select: none;
        }
        .gender-pill-item:hover {
          background: #F1F5F9;
          border-color: #CBD5E1;
        }
        .gender-pill-item.active {
          background: #00A88C;
          border-color: #00A88C;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(0, 168, 140, 0.25);
        }

        /* ── INPUT FIELDS WITH ICONS ── */
        .input-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-left-icon {
          position: absolute;
          left: 14px;
          pointer-events: none;
          color: #94A3B8;
          display: flex;
          align-items: center;
          z-index: 2;
        }
        .form-control-styled {
          width: 100%;
          height: 48px;
          padding: 0 14px 0 42px;
          border-radius: 14px;
          border: 1.5px solid #E2E8F0;
          font-size: 14.5px;
          color: #0F172A;
          background: #FFFFFF;
          outline: none;
          transition: all 0.2s ease;
        }
        .form-control-styled:focus {
          border-color: #00A88C;
          box-shadow: 0 0 0 3px rgba(0, 168, 140, 0.12);
        }
        .form-control-styled:disabled {
          background: #F8FAFC;
          color: #94A3B8;
          cursor: not-allowed;
        }

        /* ── SELECT BOXES ── */
        .select-chevron-arrow {
          position: absolute;
          right: 14px;
          pointer-events: none;
          color: #94A3B8;
          display: flex;
          align-items: center;
          z-index: 2;
        }
        .select-box-styled {
          width: 100%;
          height: 48px;
          padding: 0 34px 0 40px;
          border-radius: 14px;
          border: 1.5px solid #E2E8F0;
          font-size: 13.5px;
          color: #0F172A;
          background: #FFFFFF;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .select-box-styled:focus {
          border-color: #00A88C;
          box-shadow: 0 0 0 3px rgba(0, 168, 140, 0.12);
        }
        .select-box-styled:disabled {
          background: #F8FAFC;
          color: #94A3B8;
          border-color: #EDF2F7;
          cursor: not-allowed;
        }

        /* ── PHOTO UPLOAD SECTION ── */
        .photo-upload-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #F8FAFC;
          border: 1.5px dashed #CBD5E1;
          border-radius: 16px;
          padding: 12px 16px;
          margin-top: 6px;
          transition: border-color 0.2s;
        }
        .photo-upload-wrap:hover {
          border-color: #00A88C;
        }
        .photo-avatar-preview {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          overflow: hidden;
          background: #E2E8F0;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .photo-avatar-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ── READINESS / POLICY BOX ── */
        .policy-toggle-box {
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .policy-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          margin: 0;
          user-select: none;
        }
        .policy-item input[type="checkbox"] {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          accent-color: #00A88C;
          cursor: pointer;
          flex-shrink: 0;
        }

        /* ── SUBMIT BUTTON ── */
        .register-submit-btn {
          height: 50px;
          padding: 0 32px;
          border-radius: 14px;
          background: linear-gradient(135deg, #00A88C 0%, #008C75 100%);
          color: #FFFFFF;
          font-weight: 800;
          font-size: 15px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 8px;
          white-space: nowrap;
          box-shadow: 0 6px 20px rgba(0, 168, 140, 0.28);
          transition: all 0.2s ease;
        }
        .register-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(0, 168, 140, 0.38);
        }
        .register-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ── MOBILE RESPONSIVE ── */
        @media (max-width: 767px) {
          .donor-register-page-wrapper {
            padding-top: calc(var(--header-height, 58px) + 6px) !important;
            padding-bottom: calc(var(--mobile-bottom-nav-height, 65px) + 45px) !important;
          }
          .register-hero-card {
            padding: 16px 14px !important;
            border-radius: 16px !important;
            margin-bottom: 14px !important;
          }
          .register-hero-title {
            font-size: 18px !important;
          }
          .register-form-card {
            padding: 20px 14px !important;
            border-radius: 18px !important;
            margin-bottom: 20px !important;
          }
          .blood-grid-selector {
            gap: 6px !important;
          }
          .blood-chip-item {
            padding: 8px 4px !important;
            font-size: 14px !important;
            border-radius: 12px !important;
          }
          .gender-pill-item {
            padding: 8px 4px !important;
            font-size: 12.5px !important;
          }
          .form-control-styled, .select-box-styled {
            height: 44px !important;
            font-size: 13.5px !important;
          }
          .register-submit-btn {
            width: 100% !important;
            height: 48px !important;
            padding: 0 12px !important;
            font-size: 14px !important;
            white-space: nowrap !important;
            flex-wrap: nowrap !important;
            gap: 7px !important;
          }
          .existing-donor-card {
            padding: 16px 14px !important;
            border-radius: 16px !important;
          }
          .existing-action-btns-wrap {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            margin-top: 12px !important;
            width: 100% !important;
          }
          .existing-action-btn, .existing-status-badge {
            width: 100% !important;
            justify-content: center !important;
            padding: 9px 8px !important;
            font-size: 12px !important;
            letter-spacing: 0 !important;
            text-align: center !important;
          }
        }
      `}</style>

      <Container>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 12 }}>
          <BreadcrumbHUD 
            links={[
              { label: 'রক্তদাতা নেটওয়ার্ক', path: '/blood-donors' },
              { label: isExisting ? 'প্রোফাইল আপডেট' : 'নিবন্ধন' }
            ]} 
            variant="dark" 
            showBack={false}
          />
        </div>

        {/* Existing Donor Dashboard Header (if already registered) */}
        {isExisting && donorData ? (
          <div className="existing-donor-card">
            <Row className="align-items-center g-3" style={{ position: 'relative', zIndex: 1 }}>
              <Col md={7}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '2px 9px', borderRadius: 8,
                    background: '#FFFFFF', 
                    color: '#BE123C',
                    fontWeight: 900, fontSize: 13,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    lineHeight: 1.3
                  }}>
                    <IconDroplet size={13} fill="#E11D48" color="#E11D48" />
                    {donorData.blood_group}
                  </span>
                  <h3 style={{ fontWeight: 900, fontSize: 21, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8, textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                    স্বাগতম, {donorData.name}
                    <IconShieldCheck size={20} color="#FFFFFF" />
                  </h3>
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 13.5, lineHeight: 1.6 }}>
                  <span>মোট রক্তদান: <b style={{ color: '#FDE047', fontWeight: 800 }}>{toBn(donorData.total_donations || 0)} বার</b></span>
                  <span style={{ margin: '0 8px', opacity: 0.6 }}>•</span>
                  <span>সর্বশেষ রক্তদান: <b style={{ color: '#FFFFFF' }}>{donorData.last_donated_at ? toBn(donorData.last_donated_at) : 'রেকর্ড নেই'}</b></span>
                  {donorData.days_until_available > 0 && (
                    <div style={{ color: '#FEF08A', marginTop: 4, fontWeight: 700, fontSize: 13 }}>
                      ⏳ পরবর্তী রক্তদানের জন্য {toBn(donorData.days_until_available)} দিন বাকি রয়েছে
                    </div>
                  )}
                </div>
              </Col>

              <Col md={5} className="text-md-end">
                <div className="existing-action-btns-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                  {/* Action Button: I donated today */}
                  {isCooldown ? (
                    <button
                      type="button"
                      onClick={() => {
                        toast(`আপনার রক্তদান সফলভাবে লিপিবদ্ধ রয়েছে এবং আপনি বর্তমানে বিশ্রামে আছেন। আর ${toBn(donorData.days_until_available)} দিন পর পরবর্তী রক্তদান করতে পারবেন।`, { icon: 'ℹ️' })
                      }}
                      className="existing-action-btn cooldown-active"
                      title="রক্তদান ইতোমধ্যে লিপিবদ্ধ আছে"
                    >
                      <IconCircleCheck size={16} color="#059669" />
                      <span>রক্তদান লিপিবদ্ধ আছে</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLogDonationToday}
                      className="existing-action-btn"
                      title="আজকে রক্তদান করে থাকলে ক্লিক করে রেকর্ড আপডেট করুন"
                    >
                      <IconActivity size={17} color="#BE123C" />
                      <span>আমি আজ রক্ত দিয়েছি</span>
                    </button>
                  )}

                  {/* Live Status Badge / Manual Availability Button */}
                  <button
                    type="button"
                    onClick={handleStatusBadgeClick}
                    className={`existing-status-badge ${isCooldown ? 'cooldown' : isAvailable ? 'ready' : 'paused'}`}
                    title={isCooldown ? 'বর্তমানে বিশ্রামের সময়কাল চলছে' : 'ক্লিক করে প্রাপ্যতা সাময়িক বন্ধ বা চালু করতে পারেন'}
                  >
                    {isCooldown ? (
                      <>
                        <IconClock size={16} color="#FDE047" />
                        <span>বিশ্রামে আছেন ({toBn(donorData.days_until_available)} দিন)</span>
                      </>
                    ) : isAvailable ? (
                      <>
                        <span className="live-status-dot ready" />
                        <span>রক্তদানে প্রস্তুত</span>
                      </>
                    ) : (
                      <>
                        <span className="live-status-dot paused" />
                        <span>প্রাপ্যতা বন্ধ</span>
                      </>
                    )}
                  </button>
                </div>
              </Col>
            </Row>
          </div>
        ) : (
          /* New Donor Warm Motivation Hero */
          <div className="register-hero-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div className="hero-pill-badge">
                <IconHeart size={14} color="#E11D48" />
                <span>মানবতার সেবায় রক্তদান</span>
              </div>
              <Link
                to="/blood-donors"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  color: '#475569', fontWeight: 700, fontSize: 12.5, textDecoration: 'none'
                }}
              >
                <IconArrowLeft size={16} />
                রক্তদাতা তালিকা দেখুন
              </Link>
            </div>

            <h2 className="register-hero-title" style={{ fontWeight: 900, color: '#0F172A', fontSize: 22, margin: '6px 0' }}>
              রক্তদাতা হিসেবে নিবন্ধন করুন
            </h2>
            <p style={{ color: '#475569', fontSize: 13.5, margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
              আপনার এক ব্যাগ রক্ত বাঁচাতে পারে একটি মুমূর্ষু মানুষের জীবন। আমাদের মানবিক নেটওয়ার্কে যুক্ত হয়ে জরুরি মুহূর্তে মানুষের পাশে দাঁড়ান।
            </p>
          </div>
        )}

        {/* ── MAIN FORM CONTAINER ── */}
        <div className="register-form-card">
          <Form onSubmit={handleSubmit}>
            
            {/* Autofill Notification Banner */}
            {autoFilled && !isExisting && (
              <div style={{
                background: '#ECFDF5',
                border: '1.5px solid #A7F3D0',
                borderRadius: 14,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                color: '#065F46',
                fontWeight: 600
              }}>
                <IconSparkles size={20} color="#059669" style={{ flexShrink: 0 }} />
                <span>আপনার একাউন্ট প্রোফাইল থেকে প্রাথমিক তথ্য স্বয়ংক্রিয়ভাবে যুক্ত করা হয়েছে। প্রয়োজনে যেকোনো তথ্য পরিবর্তন করতে পারেন।</span>
              </div>
            )}

            {/* ── 1. BLOOD GROUP & PERSONAL INFORMATION ── */}
            <div style={{ marginBottom: 28 }}>
              <div className="form-section-pill">
                <IconUser size={18} />
                <span>১. রক্তের গ্রুপ ও ব্যক্তিগত তথ্য</span>
              </div>

              {/* Verified Account Profile Card (Fixed Name & Photo from Profile) */}
              <div style={{
                background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                border: '1.5px solid #E2E8F0',
                borderRadius: 16,
                padding: '14px 18px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#E2E8F0',
                    border: '2.5px solid #FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {(photoPreview || user?.photo) ? (
                      <img 
                        src={getMediaUrl(photoPreview || user?.photo)} 
                        alt={name || user?.name || 'User'} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <IconUser size={26} color="#64748B" />
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                        {name || user?.name || 'ব্যবহারকারী'}
                      </h4>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: '#E0F2FE',
                        color: '#0284C7',
                        fontSize: 11,
                        fontWeight: 800
                      }}>
                        <IconShieldCheck size={13} color="#0284C7" />
                        ভেরিফাইড প্রোফাইল
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IconLock size={13} color="#94A3B8" />
                      <span>নাম ও ছবি মূল একাউন্ট থেকে সংযুক্ত</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    padding: '7px 14px',
                    borderRadius: 10,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#00A88C',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                  title="নাম বা ছবি পরিবর্তন করতে মূল প্রোফাইলে যান"
                >
                  <span>প্রোফাইল পরিবর্তন</span>
                  <IconArrowRight size={14} />
                </Link>
              </div>

              {/* Interactive Blood Group Selector */}
              <div id="field-blood_group" style={{ marginBottom: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                  <span>রক্তের গ্রুপ নির্বাচন করুন <span style={{ color: '#E11D48' }}>*</span></span>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>বাছাই করা হয়েছে: <b style={{ color: '#E11D48' }}>{bloodGroup}</b></span>
                </label>
                <div className={`blood-grid-selector ${fieldErrors.blood_group ? 'has-field-error' : ''}`}>
                  {BLOOD_GROUPS.map(bg => (
                    <div
                      key={bg}
                      onClick={() => { setBloodGroup(bg); clearError('blood_group') }}
                      className={`blood-chip-item ${bloodGroup === bg ? 'active' : ''}`}
                    >
                      <IconDroplet size={15} color={bloodGroup === bg ? '#FFFFFF' : '#E11D48'} />
                      <span>{bg}</span>
                    </div>
                  ))}
                </div>
                {fieldErrors.blood_group && (
                  <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.blood_group}</span></div>
                )}
              </div>

              <Row className="g-3">
                {/* Gender Segmented Pills */}
                <Col md={6} id="field-gender">
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    লিঙ্গ <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <div className={`gender-grid-selector ${fieldErrors.gender ? 'has-field-error' : ''}`}>
                    {[
                      { key: 'male', label: 'পুরুষ' },
                      { key: 'female', label: 'নারী' },
                      { key: 'other', label: 'অন্যান্য' }
                    ].map(g => (
                      <div
                        key={g.key}
                        onClick={() => { setGender(g.key); clearError('gender') }}
                        className={`gender-pill-item ${gender === g.key ? 'active' : ''}`}
                      >
                        {gender === g.key && <IconCheck size={15} />}
                        <span>{g.label}</span>
                      </div>
                    ))}
                  </div>
                  {fieldErrors.gender && (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.gender}</span></div>
                  )}
                </Col>

                {/* Date of Birth */}
                <Col md={6} id="field-date_of_birth">
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    জন্মতারিখ (ন্যূনতম ১৮ বছর হতে হবে) <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconCalendar size={18} /></span>
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={e => { setDateOfBirth(e.target.value); clearError('date_of_birth') }}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      className={`form-control-styled ${fieldErrors.date_of_birth ? 'has-field-error' : ''}`}
                    />
                  </div>
                  {fieldErrors.date_of_birth && (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.date_of_birth}</span></div>
                  )}
                </Col>
              </Row>
            </div>

            {/* ── 2. CONTACT DETAILS ── */}
            <div style={{ marginBottom: 28, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
              <div className="form-section-pill">
                <IconPhone size={18} />
                <span>২. যোগাযোগের তথ্য</span>
              </div>

              <Row className="g-3">
                <Col md={6} id="field-contact_number">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>
                      মোবাইল নম্বর <span style={{ color: '#E11D48' }}>*</span>
                    </label>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#64748B',
                      background: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      padding: '2px 8px',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <IconLock size={12} color="#D97706" /> অ্যাকাউন্ট নম্বর
                    </span>
                  </div>

                  <div 
                    className="input-icon-wrap" 
                    onClick={() => {
                      setShowAltPhoneHint(true)
                      if (altContactRef.current) altContactRef.current.focus()
                    }}
                    title="প্রাথমিক নম্বরটি পরিবর্তনযোগ্য নয়। নতুন নম্বর দিতে বিকল্প নম্বর ঘরে লিখুন।"
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    <span className="input-left-icon"><IconPhone size={18} /></span>
                    <input
                      type="tel"
                      required
                      readOnly
                      value={contactNumber}
                      onClick={() => {
                        setShowAltPhoneHint(true)
                        if (altContactRef.current) altContactRef.current.focus()
                      }}
                      onFocus={() => {
                        setShowAltPhoneHint(true)
                        if (altContactRef.current) altContactRef.current.focus()
                      }}
                      placeholder="01XXXXXXXXX"
                      className={`form-control-styled ${fieldErrors.contact_number ? 'has-field-error' : ''}`}
                      style={{
                        background: '#F8FAFC',
                        color: '#475569',
                        cursor: 'pointer',
                        paddingRight: '36px',
                        borderColor: fieldErrors.contact_number ? '#E11D48' : showAltPhoneHint ? '#CBD5E1' : undefined
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <IconLock size={16} />
                    </span>
                  </div>

                  {fieldErrors.contact_number ? (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.contact_number}</span></div>
                  ) : (
                    <div 
                      onClick={() => {
                        setShowAltPhoneHint(true)
                        if (altContactRef.current) altContactRef.current.focus()
                      }}
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: showAltPhoneHint ? '#047857' : '#64748B',
                        background: showAltPhoneHint ? '#ECFDF5' : '#F8FAFC',
                        border: showAltPhoneHint ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                        padding: '7px 10px',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <IconInfoCircle size={15} color={showAltPhoneHint ? '#059669' : '#00A88C'} style={{ flexShrink: 0 }} />
                      <span>
                        {showAltPhoneHint ? (
                          <strong>নম্বর পরিবর্তন করতে চাইলে পাশের 'বিকল্প মোবাইল নম্বর' ঘরে লিখুন।</strong>
                        ) : (
                          <>প্রাথমিক নম্বর পরিবর্তনযোগ্য নয়। নতুন নম্বর দিতে <span style={{ color: '#00A88C', fontWeight: 700, textDecoration: 'underline' }}>বিকল্প নম্বর ব্যবহার করুন</span></>
                        )}
                      </span>
                    </div>
                  )}
                </Col>

                <Col md={6} id="field-alternate_contact_number">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>
                      বিকল্প মোবাইল নম্বর (ঐচ্ছিক)
                    </label>
                    {showAltPhoneHint && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#047857',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '2px 8px',
                        borderRadius: 6
                      }}>
                        এখানে লিখুন ✍️
                      </span>
                    )}
                  </div>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconPhone size={18} /></span>
                    <input
                      ref={altContactRef}
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      value={altContactNumber}
                      onChange={handleAltContactChange}
                      onBlur={handleAltContactBlur}
                      placeholder="01XXXXXXXXX"
                      className={`form-control-styled ${fieldErrors.alternate_contact_number ? 'has-field-error' : ''}`}
                      style={showAltPhoneHint && !fieldErrors.alternate_contact_number ? { borderColor: '#00A88C', boxShadow: '0 0 0 3px rgba(0, 168, 140, 0.15)' } : {}}
                    />
                  </div>
                  {fieldErrors.alternate_contact_number ? (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.alternate_contact_number}</span></div>
                  ) : (
                    <div style={{ fontSize: 11.5, color: '#0F766E', marginTop: 5, paddingLeft: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IconInfoCircle size={13} style={{ flexShrink: 0 }} />
                      <span>রক্তদাতার তালিকায় এই বিকল্প নম্বরটি সরাসরি প্রদর্শিত হবে।</span>
                    </div>
                  )}
                </Col>
              </Row>
            </div>

            {/* ── 3. LOCATION HIERARCHY (2x2 Grid on Mobile) ── */}
            <div style={{ marginBottom: 28, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
              <div className="form-section-pill">
                <IconMapPin size={18} />
                <span>৩. বর্তমান ঠিকানা (এলাকা নির্বাচন)</span>
              </div>

              <Row className="g-2 g-md-3">
                {/* Division */}
                <Col xs={6} md={3} id="field-division_id">
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    বিভাগ <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconMapPin size={16} /></span>
                    <select
                      required
                      value={divisionId}
                      onChange={e => { setDivisionId(e.target.value); clearError('division_id') }}
                      className={`select-box-styled ${fieldErrors.division_id ? 'has-field-error' : ''}`}
                    >
                      <option value="">সকল বিভাগ</option>
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                      ))}
                    </select>
                    <span className="select-chevron-arrow"><IconChevronDown size={16} /></span>
                  </div>
                  {fieldErrors.division_id && (
                    <div className="field-error-text"><IconAlertCircle size={13} /><span>{fieldErrors.division_id}</span></div>
                  )}
                </Col>

                {/* District */}
                <Col xs={6} md={3} id="field-district_id">
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    জেলা <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconMapPin size={16} /></span>
                    <select
                      required
                      value={districtId}
                      onChange={e => { setDistrictId(e.target.value); clearError('district_id') }}
                      disabled={!divisionId}
                      className={`select-box-styled ${fieldErrors.district_id ? 'has-field-error' : ''}`}
                    >
                      <option value="">{divisionId ? 'জেলা নির্বাচন' : 'আগে বিভাগ'}</option>
                      {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                      ))}
                    </select>
                    <span className="select-chevron-arrow"><IconChevronDown size={16} /></span>
                  </div>
                  {fieldErrors.district_id && (
                    <div className="field-error-text"><IconAlertCircle size={13} /><span>{fieldErrors.district_id}</span></div>
                  )}
                </Col>

                {/* Upazila */}
                <Col xs={6} md={3} id="field-upazila_id">
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    উপজেলা / থানা <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconMapPin size={16} /></span>
                    <select
                      required
                      value={upazilaId}
                      onChange={e => { setUpazilaId(e.target.value); clearError('upazila_id') }}
                      disabled={!districtId}
                      className={`select-box-styled ${fieldErrors.upazila_id ? 'has-field-error' : ''}`}
                    >
                      <option value="">{districtId ? 'উপজেলা নির্বাচন' : 'আগে জেলা'}</option>
                      {upazilas.map(u => (
                        <option key={u.id} value={u.id}>{u.bangla_name || u.name}</option>
                      ))}
                    </select>
                    <span className="select-chevron-arrow"><IconChevronDown size={16} /></span>
                  </div>
                  {fieldErrors.upazila_id && (
                    <div className="field-error-text"><IconAlertCircle size={13} /><span>{fieldErrors.upazila_id}</span></div>
                  )}
                </Col>

                {/* Union */}
                <Col xs={6} md={3}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    ইউনিয়ন / ওয়ার্ড
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconMapPin size={16} /></span>
                    <select
                      value={unionId}
                      onChange={e => setUnionId(e.target.value)}
                      disabled={!upazilaId}
                      className="select-box-styled"
                    >
                      <option value="">{upazilaId ? 'ইউনিয়ন (ঐচ্ছিক)' : 'আগে উপজেলা'}</option>
                      {unions.map(un => (
                        <option key={un.id} value={un.id}>{un.bangla_name || un.name}</option>
                      ))}
                    </select>
                    <span className="select-chevron-arrow"><IconChevronDown size={16} /></span>
                  </div>
                </Col>

                {/* Village / Area */}
                <Col md={6}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    গ্রাম / পাড়া / এলাকা
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconMapPin size={18} /></span>
                    <input
                      type="text"
                      value={villageOrArea}
                      onChange={e => setVillageOrArea(e.target.value)}
                      placeholder="যেমন: নতুন পাড়া, স্টেশন রোড"
                      className="form-control-styled"
                    />
                  </div>
                </Col>

                {/* Detailed Address Line */}
                <Col md={6}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    বিস্তারিত ঠিকানা (বাড়ি, রোড নম্বর)
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconMapPin size={18} /></span>
                    <input
                      type="text"
                      value={addressLine}
                      onChange={e => setAddressLine(e.target.value)}
                      placeholder="যেমন: হোল্ডিং ১২, রোড ৫, সেক্টর ৩"
                      className="form-control-styled"
                    />
                  </div>
                </Col>

                {/* Profile Sync Option Checkbox */}
                <Col xs={12}>
                  <div style={{
                    marginTop: 6,
                    padding: '13px 16px',
                    background: '#F0FDF4',
                    border: '1.5px solid #BBF7D0',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12
                  }}>
                    <input
                      type="checkbox"
                      id="syncToProfile"
                      checked={syncToProfile}
                      onChange={e => setSyncToProfile(e.target.checked)}
                      style={{ marginTop: 3, width: 18, height: 18, accentColor: '#00A88C', cursor: 'pointer' }}
                    />
                    <label htmlFor="syncToProfile" style={{ fontSize: 13, color: '#166534', cursor: 'pointer', margin: 0, lineHeight: 1.5 }}>
                      <strong style={{ color: '#14532D', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span>🔄 এই বর্তমান এলাকা ও ঠিকানা মূল পেশেন্ট প্রোফাইলেও আপডেট করুন</span>
                      </strong>
                      <span style={{ fontSize: 12, color: '#15803D' }}>
                        চিহ্নিত থাকলে আপনার প্রদত্ত বিভাগ, জেলা ও এলাকাটি মূল একাউন্ট প্রোফাইলেও একযোগে সিঙ্ক হয়ে সংরক্ষিত হবে।
                      </span>
                    </label>
                  </div>
                </Col>
              </Row>
            </div>

            {/* ── 4. HEALTH RULES, AVAILABILITY & PRIVACY ── */}
            <div style={{ marginBottom: 28, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
              <div className="form-section-pill">
                <IconShieldCheck size={18} />
                <span>৪. স্বাস্থ্য বিরতিকাল ও নিরাপত্তা</span>
              </div>

              <Row className="g-3 mb-4">
                <Col md={6} id="field-last_donated_at">
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    সর্বশেষ রক্তদানের তারিখ (যদি পূর্বে দিয়ে থাকেন)
                  </label>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconClock size={18} /></span>
                    <input
                      type="date"
                      value={lastDonatedAt}
                      onChange={e => { setLastDonatedAt(e.target.value); clearError('last_donated_at') }}
                      max={getBangladeshTodayStr()}
                      className={`form-control-styled ${fieldErrors.last_donated_at ? 'has-field-error' : ''}`}
                    />
                  </div>
                  {fieldErrors.last_donated_at && (
                    <div className="field-error-text"><IconAlertCircle size={13} /><span>{fieldErrors.last_donated_at}</span></div>
                  )}
                  <span style={{ fontSize: 11.5, color: '#64748B', marginTop: 4, display: 'block' }}>
                    💡 তারিখ দেওয়া থাকলে পরবর্তী ৯০ দিন সিস্টেম স্বয়ংক্রিয়ভাবে আপনাকে বিশ্রামে রাখবে।
                  </span>
                </Col>
              </Row>

              {/* Toggles & Readiness Box */}
              <div className="policy-toggle-box">
                <label className="policy-item">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={e => setIsAvailable(e.target.checked)}
                  />
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block' }}>
                      আমি বর্তমানে জরুরি প্রয়োজনে রক্ত দিতে প্রস্তুত ও এভেইলেবল
                    </span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      প্রস্তুত থাকলে জরুরি রোগীরা আপনার সাথে দ্রুত যোগাযোগ করতে পারবে।
                    </span>
                  </div>
                </label>

                <div style={{ height: 1, background: '#E2E8F0' }} />

                <label className="policy-item">
                  <input
                    type="checkbox"
                    checked={hideContactPublicly}
                    onChange={e => setHideContactPublicly(e.target.checked)}
                  />
                  <div>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#334155', display: 'block' }}>
                      মোবাইল নম্বর পাবলিক তালিকায় সরাসরি গোপন রাখুন
                    </span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      শুধুমাত্র রেজিস্টার্ড বা ভেরিফাইড ইউজাররা আপনার নম্বরটি দেখতে পারবে।
                    </span>
                  </div>
                </label>

                <div style={{ height: 1, background: '#E2E8F0' }} />

                <label className={`policy-item ${fieldErrors.eligibility_confirmed ? 'has-field-error' : ''}`} id="field-eligibility_confirmed">
                  <input
                    type="checkbox"
                    required
                    checked={eligibilityConfirmed}
                    onChange={e => { setEligibilityConfirmed(e.target.checked); clearError('eligibility_confirmed') }}
                  />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: fieldErrors.eligibility_confirmed ? '#E11D48' : '#0F172A', display: 'block', lineHeight: 1.5 }}>
                      আমি অঙ্গীকার করছি যে আমার বয়স ১৮ বছরের বেশি, ওজন ৫০ কেজির বেশি এবং আমি রক্তদানের জন্য শারীরিকভাবে সুস্থ।
                    </span>
                    {fieldErrors.eligibility_confirmed && (
                      <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.eligibility_confirmed}</span></div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* ── GENERAL SUBMIT ERROR BANNER (ZERO TOAST) ── */}
            {generalSubmitError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 12,
                padding: '12px 16px',
                color: '#991B1B',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <IconAlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{generalSubmitError}</span>
              </div>
            )}

            {/* ── SUBMIT BUTTON ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, paddingBottom: 6 }}>
              <button
                type="submit"
                disabled={saving}
                className="register-submit-btn"
              >
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    <span style={{ whiteSpace: 'nowrap' }}>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <IconHeart size={18} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap' }}>
                      {isExisting ? 'প্রোফাইল আপডেট করুন' : 'রক্তদাতা নিবন্ধন করুন'}
                    </span>
                    <IconArrowRight size={17} style={{ flexShrink: 0 }} />
                  </>
                )}
              </button>
            </div>
          </Form>
        </div>
      </Container>

      {/* ── LOG DONATION CONFIRMATION MODAL ── */}
      <Modal 
        show={showDonationConfirmModal} 
        onHide={() => !loggingDonation && setShowDonationConfirmModal(false)}
        centered
        backdrop="static"
        keyboard={!loggingDonation}
      >
        <Modal.Body style={{ 
          padding: '34px 28px 28px', 
          textAlign: 'center', 
          borderRadius: 24, 
          background: '#FFFFFF', 
          position: 'relative' 
        }}>
          {/* Top-Right Close Button */}
          <button
            type="button"
            disabled={loggingDonation}
            onClick={() => setShowDonationConfirmModal(false)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#F1F5F9',
              border: 'none',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: loggingDonation ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              padding: 0
            }}
          >
            <IconX size={18} />
          </button>

          {/* Icon Badge */}
          <div style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)',
            color: '#BE123C',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 22px rgba(225, 29, 72, 0.18)'
          }}>
            <IconDroplet size={34} fill="#E11D48" color="#E11D48" />
          </div>

          {/* Title */}
          <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 20, marginBottom: 10 }}>
            আজকে রক্তদান নিশ্চিতকরণ
          </h4>

          {/* Description */}
          <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 18, maxWidth: 390, margin: '0 auto 18px' }}>
            আপনি কি আজ রক্ত দিয়েছেন? এটি নিশ্চিত করলে আপনার মোট রক্তদানের সংখ্যা ১ বৃদ্ধি পাবে এবং স্বাস্থ্য সুরক্ষায় পরবর্তী ৯০ দিন আপনার প্রোফাইল বিশ্রামে (Cooldown) থাকবে।
          </p>

          {/* Highlight Notification Pill */}
          <div style={{
            background: '#FFFBEB',
            border: '1.5px solid #FDE68A',
            borderRadius: 14,
            padding: '10px 16px',
            marginBottom: 24,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: '#92400E',
            fontWeight: 700
          }}>
            <IconClock size={16} color="#D97706" />
            <span>পরবর্তী ৯০ দিনের বিশ্রাম স্বয়ংক্রিয়ভাবে গণনা হবে</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              disabled={loggingDonation}
              onClick={() => setShowDonationConfirmModal(false)}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: 12,
                background: '#F1F5F9',
                border: '1.5px solid #E2E8F0',
                color: '#475569',
                fontWeight: 700,
                fontSize: 14,
                cursor: loggingDonation ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              বাতিল করুন
            </button>

            <button
              type="button"
              disabled={loggingDonation}
              onClick={confirmLogDonationToday}
              style={{
                flex: 1.4,
                padding: '11px 18px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 14,
                cursor: loggingDonation ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(225, 29, 72, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease'
              }}
            >
              {loggingDonation ? (
                <>
                  <Spinner animation="border" size="sm" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <IconCircleCheck size={18} />
                  <span>হ্যাঁ, রক্ত দিয়েছি</span>
                </>
              )}
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ── PROFESSIONAL AVAILABILITY TOGGLE & COOLDOWN NOTICE MODAL ── */}
      <Modal
        show={showAvailabilityModal}
        onHide={() => setShowAvailabilityModal(false)}
        centered
        dialogClassName="blood-availability-modal"
      >
        <Modal.Body style={{ padding: '32px 24px 28px', textAlign: 'center', borderRadius: 24, background: '#FFFFFF', position: 'relative' }}>
          {/* Close button */}
          <button
            type="button"
            onClick={() => setShowAvailabilityModal(false)}
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

          {isCooldown ? (
            /* Cooldown Notice State */
            <>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                color: '#D97706',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 6px 18px rgba(217, 119, 6, 0.2)'
              }}>
                <IconClock size={36} />
              </div>

              <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 19, marginBottom: 6 }}>
                আপনি বর্তমানে বিশ্রামে আছেন
              </h4>
              <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, maxWidth: 360, margin: '0 auto 18px', lineHeight: 1.5 }}>
                রক্তদানের পর আপনার স্বাস্থ্য সুরক্ষায় ৯০ দিনের বিশ্রাম সময়কাল কার্যকর রয়েছে। এই সময়ে প্রাপ্যতা পরিবর্তন করা সম্ভব নয়।
              </p>

              <div style={{
                background: '#FFFBEB',
                borderRadius: 16,
                padding: '16px',
                border: '1px solid #FDE68A',
                textAlign: 'left',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13, color: '#92400E', fontWeight: 700 }}>
                  <IconActivity size={18} color="#D97706" />
                  <span>সর্বশেষ রক্তদান: {toBn(donorData?.last_donated_at || 'রেকর্ড করা হয়েছে')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#92400E', fontWeight: 700 }}>
                  <IconClock size={18} color="#D97706" />
                  <span>রক্তদানে প্রস্তুত হবেন: আর {toBn(donorData?.days_until_available)} দিন পর</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAvailabilityModal(false)}
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
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)'
                }}
              >
                বুঝেছি, ধন্যবাদ
              </button>
            </>
          ) : isAvailable ? (
            /* Currently Available -> Prompt to Pause */
            <>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                color: '#D97706',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 6px 18px rgba(217, 119, 6, 0.2)'
              }}>
                <IconShieldCheck size={36} />
              </div>

              <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 19, marginBottom: 6 }}>
                প্রাপ্যতা সাময়িক বন্ধ করবেন?
              </h4>
              <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, maxWidth: 360, margin: '0 auto 18px', lineHeight: 1.5 }}>
                প্রাপ্যতা বন্ধ রাখলে রক্তদাতা তালিকায় আপনার স্ট্যাটাস 'সাময়িকভাবে অনুপলব্ধ' দেখাবে। আপনি পুনরায় প্রস্তুত না হওয়া পর্যন্ত কেউ আপনাকে কল করবে না।
              </p>

              <div style={{
                background: '#F8FAFC',
                borderRadius: 16,
                padding: '14px 16px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20,
                textAlign: 'left'
              }}>
                <IconInfoCircle size={20} color="#64748B" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                  যেকোনো সময় আপনি এক ক্লিকেই আবার রক্তদানে 'প্রস্তুত' স্ট্যাটাস চালু করতে পারবেন।
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  disabled={togglingAvailability}
                  onClick={() => setShowAvailabilityModal(false)}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 12,
                    background: '#F1F5F9', color: '#475569',
                    fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer'
                  }}
                >
                  না, প্রস্তুত রাখুন
                </button>
                <button
                  type="button"
                  disabled={togglingAvailability}
                  onClick={confirmToggleAvailability}
                  style={{
                    flex: 1.2, padding: '11px', borderRadius: 12,
                    background: '#D97706', color: '#FFFFFF',
                    fontWeight: 800, fontSize: 14, border: 'none',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    cursor: togglingAvailability ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.25)'
                  }}
                >
                  {togglingAvailability ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      <span>পরিবর্তন হচ্ছে...</span>
                    </>
                  ) : (
                    <span>হ্যাঁ, বন্ধ করুন</span>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Currently Paused -> Prompt to Turn Ready */
            <>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 6px 18px rgba(5, 150, 105, 0.2)'
              }}>
                <IconCircleCheck size={36} />
              </div>

              <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 19, marginBottom: 6 }}>
                রক্তদানে প্রস্তুত হিসেবে সক্রিয় করবেন?
              </h4>
              <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, maxWidth: 360, margin: '0 auto 18px', lineHeight: 1.5 }}>
                আপনার প্রাপ্যতা সক্রিয় করলে রক্তগ্রহীতারা আপনাকে 'প্রস্তুত' অবস্থায় দেখতে পাবেন এবং জরুরি প্রয়োজনে আপনার সাথে যোগাযোগ করতে পারবেন।
              </p>

              <div style={{
                background: '#ECFDF5',
                borderRadius: 16,
                padding: '14px 16px',
                border: '1px solid #A7F3D0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20,
                textAlign: 'left'
              }}>
                <IconHeart size={20} color="#059669" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: '#065F46', lineHeight: 1.5, fontWeight: 600 }}>
                  আপনার এই একটি সিদ্ধান্ত বাঁচাতে পারে একজন মুমূর্ষু রোগীর জীবন।
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  disabled={togglingAvailability}
                  onClick={() => setShowAvailabilityModal(false)}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 12,
                    background: '#F1F5F9', color: '#475569',
                    fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer'
                  }}
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  disabled={togglingAvailability}
                  onClick={confirmToggleAvailability}
                  style={{
                    flex: 1.3, padding: '11px', borderRadius: 12,
                    background: '#00A88C', color: '#FFFFFF',
                    fontWeight: 800, fontSize: 14, border: 'none',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    cursor: togglingAvailability ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 168, 140, 0.28)'
                  }}
                >
                  {togglingAvailability ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      <span>সক্রিয় হচ্ছে...</span>
                    </>
                  ) : (
                    <span>হ্যাঁ, প্রস্তুত হিসেবে চালু করুন</span>
                  )}
                </button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* ── SAVE SUCCESS MODAL POPUP (ZERO TOAST) ── */}
      <Modal
        show={showSaveSuccessModal}
        onHide={() => {
          setShowSaveSuccessModal(false)
          navigate('/blood-donors')
        }}
        centered
        dialogClassName="blood-availability-modal"
      >
        <Modal.Body style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            color: '#059669',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.22)'
          }}>
            <IconCircleCheck size={42} />
          </div>

          <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 20, marginBottom: 8 }}>
            প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!
          </h4>
          <p style={{ fontSize: 13.5, color: '#475569', fontWeight: 600, maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
            {saveSuccessMessage || 'আপনার রক্তদাতা প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে। মানবসেবায় এগিয়ে আসার জন্য ধন্যবাদ!'}
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowSaveSuccessModal(false)}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                background: '#F1F5F9', color: '#475569',
                fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer'
              }}
            >
              এখানেই থাকুন
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSaveSuccessModal(false)
                navigate('/blood-donors')
              }}
              style={{
                flex: 1.4, padding: '12px', borderRadius: 12,
                background: '#00A88C', color: '#FFFFFF',
                fontWeight: 800, fontSize: 14, border: 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 168, 140, 0.28)'
              }}
            >
              <span>রক্তদাতা তালিকা দেখুন</span>
              <IconArrowRight size={18} />
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

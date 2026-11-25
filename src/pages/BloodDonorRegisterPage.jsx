import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import { 
  IconDroplet, IconHeart, IconCalendar, IconMapPin, IconPhone, IconUpload, 
  IconShieldCheck, IconClock, IconArrowLeft, IconActivity, IconUser, 
  IconCheck, IconAlertCircle, IconCircleCheck
} from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { getMyDonorProfile, saveDonorProfile, toggleDonorAvailability, logDonation } from '../api/bloodDonorApi'
import { getDivisions, getDistricts, getUpazilas, getUnions } from '../api/locationApi'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined && str !== '' ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

export default function BloodDonorRegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isExisting, setIsExisting] = useState(false)
  const [donorData, setDonorData] = useState(null)

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
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')

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

    getMyDonorProfile()
      .then(res => {
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
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

  // Handle Photo selection
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error('ছবির সাইজ সর্বোচ্চ ৪ মেগাবাইট হতে হবে')
        return
      }
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('আপনার পুরো নাম লিখুন')
    if (!contactNumber.trim()) return toast.error('মোবাইল নম্বর প্রদান করুন')
    if (!dateOfBirth) return toast.error('জন্মতারিখ প্রদান করুন')
    if (!divisionId || !districtId || !upazilaId) return toast.error('বিভাগ, জেলা ও উপজেলা নির্বাচন করুন')
    if (!eligibilityConfirmed) return toast.error('শারীরিক উপযুক্ততা নিশ্চিত করুন')

    setSaving(true)
    const formData = new FormData()
    formData.append('name', name)
    formData.append('blood_group', bloodGroup)
    formData.append('gender', gender)
    formData.append('date_of_birth', dateOfBirth)
    formData.append('contact_number', contactNumber)
    if (altContactNumber) formData.append('alternate_contact_number', altContactNumber)
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
    if (photo) formData.append('photo', photo)

    try {
      const res = await saveDonorProfile(formData)
      if (res.data?.success) {
        toast.success(res.data.message || 'প্রোফাইল সংরক্ষিত হয়েছে')
        setIsExisting(true)
        setDonorData(res.data.data)
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.date_of_birth?.[0] || 'সংরক্ষণ ব্যর্থ হয়েছে'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // Quick Action: "I donated blood today"
  const handleLogDonationToday = async () => {
    if (!window.confirm('আপনি কি আজ রক্ত দিয়েছেন? এটি নিশ্চিত করলে পরবর্তী ৯০ দিন সিস্টেম আপনার স্বাস্থ্য সুরক্ষায় বিশ্রামে রাখবে।')) {
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await logDonation({ donation_date: today })
      if (res.data?.success) {
        toast.success(res.data.message)
        setLastDonatedAt(today)
        if (donorData) {
          setDonorData({
            ...donorData,
            last_donated_at: today,
            total_donations: res.data.total_donations,
            days_until_available: res.data.days_until_available,
            is_ready_to_donate: false,
          })
        }
      }
    } catch {
      toast.error('তথ্য আপডেট করা যায়নি')
    }
  }

  // Quick Action: Toggle Availability
  const handleToggleAvailability = async () => {
    try {
      const res = await toggleDonorAvailability()
      if (res.data?.success) {
        setIsAvailable(res.data.is_available)
        toast.success(res.data.message)
      }
    } catch {
      toast.error('স্ট্যাটাস পরিবর্তন করা যায়নি')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <Spinner animation="border" style={{ color: '#E11D48', width: 44, height: 44 }} />
      </div>
    )
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '100px 0 60px', fontFamily: "'Hind Siliguri', 'Inter', sans-serif" }}>
      
      <style>{`
        .donor-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1.5px solid #CBD5E1;
          font-size: 14.5px;
          color: #0F172A;
          outline: none;
          background: #FFFFFF;
          transition: all 0.2s;
        }
        .donor-input:focus {
          border-color: #00A88C;
          box-shadow: 0 0 0 3px rgba(0,168,140,0.12);
        }
        .donor-input:disabled {
          background: #F1F5F9;
          color: #94A3B8;
        }
        .section-header-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 800;
          color: #047857;
          background: #E6F6F4;
          padding: 6px 14px;
          border-radius: 10px;
          margin-bottom: 18px;
          border: 1px solid #A7F3D0;
        }
      `}</style>

      <Container>
        {/* Top Back Nav & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Link
            to="/blood-donors"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: '#475569', fontWeight: 800, fontSize: 14, textDecoration: 'none'
            }}
          >
            <IconArrowLeft size={18} />
            রক্তদাতা তালিকায় ফিরে যান
          </Link>

          {isExisting && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0',
              padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 800
            }}>
              <IconShieldCheck size={18} color="#10B981" />
              ভেরিফাইড ডোনার প্রোফাইল
            </span>
          )}
        </div>

        {/* Existing Donor Quick Action Card */}
        {isExisting && donorData && (
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #134E4A 100%)',
            borderRadius: 24, padding: '28px 24px', color: '#FFFFFF',
            marginBottom: 28, boxShadow: '0 12px 35px rgba(15,23,42,0.15)'
          }}>
            <Row className="align-items-center g-3">
              <Col md={7}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 8,
                    background: '#FFF1F2', color: '#BE123C',
                    fontWeight: 900, fontSize: 16, border: '1px solid #FECDD3'
                  }}>
                    {donorData.blood_group}
                  </span>
                  <h3 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>
                    স্বাগতম, {donorData.name}
                  </h3>
                </div>
                <p style={{ color: '#E2E8F0', fontSize: 13.5, margin: 0 }}>
                  মোট রক্তদান: <b>{toBn(donorData.total_donations || 0)} বার</b> • সর্বশেষ রক্তদান:{' '}
                  <b>{donorData.last_donated_at ? toBn(donorData.last_donated_at) : 'রেকর্ড নেই'}</b>
                  {donorData.days_until_available > 0 && (
                    <span style={{ marginLeft: 8, color: '#FDE68A' }}>
                      (পরবর্তী রক্তদানের জন্য {toBn(donorData.days_until_available)} দিন বাকি)
                    </span>
                  )}
                </p>
              </Col>

              <Col md={5} className="text-md-end">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleLogDonationToday}
                    style={{
                      background: '#FFFFFF', color: '#0F172A', border: 'none',
                      padding: '10px 18px', borderRadius: 12, fontWeight: 900, fontSize: 13.5,
                      display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                    }}
                  >
                    <IconActivity size={17} color="#00A88C" />
                    আমি আজ রক্ত দিয়েছি
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleAvailability}
                    style={{
                      background: isAvailable ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.15)',
                      border: '1.5px solid rgba(255,255,255,0.3)',
                      color: '#FFFFFF', padding: '10px 16px', borderRadius: 12,
                      fontWeight: 800, fontSize: 13.5, cursor: 'pointer'
                    }}
                  >
                    {isAvailable ? '🟢 প্রাপ্যতা: প্রস্তুত' : '⚪ প্রাপ্যতা: সাময়িক বন্ধ'}
                  </button>
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* Main Form Container */}
        <div style={{
          background: '#FFFFFF', borderRadius: 24,
          padding: '36px 30px', border: '1px solid #E2E8F0',
          boxShadow: '0 10px 35px rgba(0,0,0,0.03)'
        }}>
          <div style={{ marginBottom: 28, paddingBottom: 18, borderBottom: '1.5px solid #F1F5F9' }}>
            <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 24, marginBottom: 6 }}>
              {isExisting ? 'রক্তদাতা প্রোফাইল আপডেট' : 'রক্তদাতা হিসেবে নিবন্ধন'}
            </h3>
            <p style={{ color: '#64748B', fontSize: 14.5, margin: 0 }}>
              জরুরি মুহূর্তে রোগীদের পাশে দাঁড়াতে আপনার সঠিক তথ্য প্রদান করুন।
            </p>
          </div>

          <Form onSubmit={handleSubmit}>
            {/* Section 1: Personal Info */}
            <div style={{ marginBottom: 30 }}>
              <div className="section-header-pill">
                <IconUser size={18} />
                ১. ব্যক্তিগত তথ্য
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    আপনার পুরো নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="যেমন: মোঃ সাকিব হাসান"
                    className="donor-input"
                  />
                </Col>

                <Col md={3}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    রক্তের গ্রুপ *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="donor-input"
                    style={{ fontWeight: 800, color: '#BE123C' }}
                  >
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </Col>

                <Col md={3}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    লিঙ্গ *
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="donor-input"
                  >
                    <option value="male">পুরুষ</option>
                    <option value="female">নারী</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </Col>

                <Col md={6}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    জন্মতারিখ (ন্যূনতম ১৮ বছর হতে হবে) *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className="donor-input"
                  />
                </Col>

                <Col md={6}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    প্রোফাইল ছবি (ঐচ্ছিক)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {photoPreview && (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2px solid #E2E8F0', flexShrink: 0 }}>
                        <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ fontSize: 12.5 }}
                    />
                  </div>
                </Col>
              </Row>
            </div>

            {/* Section 2: Contact Info */}
            <div style={{ marginBottom: 30, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
              <div className="section-header-pill">
                <IconPhone size={18} />
                ২. যোগাযোগের তথ্য
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="donor-input"
                  />
                </Col>

                <Col md={6}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    বিকল্প মোবাইল নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="tel"
                    value={altContactNumber}
                    onChange={e => setAltContactNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="donor-input"
                  />
                </Col>
              </Row>
            </div>

            {/* Section 3: 5-Tier Location (Division, District, Upazila, Union) */}
            <div style={{ marginBottom: 30, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
              <div className="section-header-pill">
                <IconMapPin size={18} />
                ৩. বর্তমান ঠিকানা (৫-স্তরের লোকেশন)
              </div>

              <Row className="g-3">
                <Col xs={12} sm={6} lg={3}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    বিভাগ *
                  </label>
                  <select
                    required
                    value={divisionId}
                    onChange={e => setDivisionId(e.target.value)}
                    className="donor-input"
                  >
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    {divisions.map(d => (
                      <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                    ))}
                  </select>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    জেলা *
                  </label>
                  <select
                    required
                    value={districtId}
                    onChange={e => setDistrictId(e.target.value)}
                    disabled={!divisionId}
                    className="donor-input"
                  >
                    <option value="">জেলা নির্বাচন করুন</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                    ))}
                  </select>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    উপজেলা / থানা *
                  </label>
                  <select
                    required
                    value={upazilaId}
                    onChange={e => setUpazilaId(e.target.value)}
                    disabled={!districtId}
                    className="donor-input"
                  >
                    <option value="">উপজেলা নির্বাচন করুন</option>
                    {upazilas.map(u => (
                      <option key={u.id} value={u.id}>{u.bangla_name || u.name}</option>
                    ))}
                  </select>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    ইউনিয়ন / ওয়ার্ড
                  </label>
                  <select
                    value={unionId}
                    onChange={e => setUnionId(e.target.value)}
                    disabled={!upazilaId}
                    className="donor-input"
                  >
                    <option value="">ইউনিয়ন নির্বাচন করুন (ঐচ্ছিক)</option>
                    {unions.map(un => (
                      <option key={un.id} value={un.id}>{un.bangla_name || un.name}</option>
                    ))}
                  </select>
                </Col>

                <Col md={6}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    গ্রাম / পাড়া / এলাকা
                  </label>
                  <input
                    type="text"
                    value={villageOrArea}
                    onChange={e => setVillageOrArea(e.target.value)}
                    placeholder="যেমন: নতুন পাড়া, স্টেশন রোড"
                    className="donor-input"
                  />
                </Col>

                <Col md={6}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    বিস্তারিত ঠিকানা (বাড়ি, রোড নম্বর)
                  </label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={e => setAddressLine(e.target.value)}
                    placeholder="যেমন: হোল্ডিং ১২, রোড ৫, সেক্টর ৩"
                    className="donor-input"
                  />
                </Col>
              </Row>
            </div>

            {/* Section 4: Health Rules & Privacy Safeguard */}
            <div style={{ marginBottom: 30, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
              <div className="section-header-pill">
                <IconShieldCheck size={18} />
                ৪. চিকিৎসা বিরতিকাল ও নিরাপত্তা
              </div>

              <Row className="g-3 mb-4">
                <Col md={6}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    সর্বশেষ রক্তদানের তারিখ (যদি পূর্বে দিয়ে থাকেন)
                  </label>
                  <input
                    type="date"
                    value={lastDonatedAt}
                    onChange={e => setLastDonatedAt(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="donor-input"
                  />
                  <span style={{ fontSize: 11.5, color: '#64748B', marginTop: 4, display: 'block' }}>
                    * তারিখ দেওয়া থাকলে পরবর্তী ৯০ দিন সিস্টেম স্বয়ংক্রিয়ভাবে আপনাকে বিশ্রামে রাখবে।
                  </span>
                </Col>
              </Row>

              {/* Toggles Box */}
              <div style={{
                background: '#F8FAFC', borderRadius: 16, padding: '20px',
                border: '1.5px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 14
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={e => setIsAvailable(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#00A88C', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    আমি বর্তমানে জরুরি প্রয়োজনে রক্ত দিতে প্রস্তুত ও এভেইলেবল
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={hideContactPublicly}
                    onChange={e => setHideContactPublicly(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#00A88C', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13.5, color: '#475569' }}>
                    আমার নম্বরটি পাবলিক তালিকায় সরাসরি গোপন রাখুন (শুধুমাত্র লগইন করা ইউজাররা দেখতে পারবে)
                  </span>
                </label>

                <div style={{ paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      required
                      checked={eligibilityConfirmed}
                      onChange={e => setEligibilityConfirmed(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#00A88C', cursor: 'pointer', marginTop: 2 }}
                    />
                    <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                      আমি অঙ্গীকার করছি যে আমার বয়স ১৮ বছরের বেশি, ওজন ৫০ কেজির বেশি এবং আমি রক্তদানের জন্য শারীরিকভাবে সুস্থ।
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '14px 36px',
                  borderRadius: 14,
                  background: '#00A88C',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 15,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 6px 20px rgba(0,168,140,0.25)',
                  transition: '0.2s'
                }}
              >
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <IconHeart size={19} />
                    {isExisting ? 'প্রোফাইল আপডেট করুন' : 'নিবন্ধন সম্পন্ন করুন'}
                  </>
                )}
              </button>
            </div>
          </Form>
        </div>
      </Container>
    </div>
  )
}

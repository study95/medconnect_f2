import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Container, Row, Col, Form, InputGroup, Nav, Badge } from 'react-bootstrap'
import { useSearchParams, Link } from 'react-router-dom'
import {
  IconSearch, IconStethoscope, IconBuildingHospital, IconActivity,
  IconX, IconMapPin, IconUsers, IconChevronRight, IconFilter, IconArrowRight
} from '@tabler/icons-react'
import useSearch from '../hooks/useSearch'
import useLocations from '../hooks/useLocations'
import useDebounce from '../hooks/useDebounce'
import DoctorCard from '../components/common/DoctorCard'
import HospitalCard from '../components/common/HospitalCard'
import SeoHead from '../components/common/SeoHead'
import ErrorState from '../components/common/ErrorState'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialQuery = searchParams.get('query') || searchParams.get('search') || searchParams.get('q') || ''
  const initialType = searchParams.get('type') || 'all'
  const initialDistrict = searchParams.get('district') || searchParams.get('district_slug') || ''
  const initialUpazila = searchParams.get('upazila') || searchParams.get('upazila_slug') || ''

  const [inputText, setInputText] = useState(initialQuery)
  const debouncedQuery = useDebounce(inputText, 350)
  const [activeType, setActiveType] = useState(initialType)
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict)
  const [selectedUpazila, setSelectedUpazila] = useState(initialUpazila)
  const [page, setPage] = useState(1)

  const { districts, upazilas } = useLocations()

  // Sync state when URL params change
  useEffect(() => {
    const q = searchParams.get('query') || searchParams.get('search') || searchParams.get('q') || ''
    const t = searchParams.get('type') || 'all'
    const d = searchParams.get('district') || searchParams.get('district_slug') || ''
    const u = searchParams.get('upazila') || searchParams.get('upazila_slug') || ''

    setInputText(q)
    setActiveType(t)
    setSelectedDistrict(d)
    setSelectedUpazila(u)
  }, [searchParams])

  // Update URL helper
  const updateUrl = useCallback((updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      Object.entries(updates).forEach(([k, v]) => {
        if (v && v !== 'all') {
          next.set(k, v)
        } else {
          next.delete(k)
        }
      })
      return next
    }, { replace: true })
  }, [setSearchParams])

  // Search filter payload for TanStack Query
  const searchFilterPayload = useMemo(() => {
    const p = {}
    if (debouncedQuery.trim()) p.query = debouncedQuery.trim()
    if (activeType && activeType !== 'all') p.type = activeType
    if (selectedDistrict) p.district_slug = selectedDistrict
    if (selectedUpazila) p.upazila_slug = selectedUpazila
    p.page = page
    p.per_page = 12
    return p
  }, [debouncedQuery, activeType, selectedDistrict, selectedUpazila, page])

  const {
    results,
    type,
    counts,
    doctors,
    doctorMeta,
    hospitals,
    hospitalMeta,
    specialties,
    specialtyMeta,
    loading,
    error,
  } = useSearch(searchFilterPayload)

  // Dynamic SEO calculation (noindex, follow for search results)
  const seoData = useMemo(() => {
    const q = debouncedQuery.trim()
    let title = 'অনুসন্ধান | MedConnect'
    let description = 'বাংলাদেশের সেরা ডাক্তার, হাসপাতাল ও বিশেষজ্ঞ স্বাস্থ্যসেবা অনুসন্ধান করুন।'

    if (q) {
      title = `"${q}" — অনুসন্ধান ফলাফল | MedConnect`
      description = `"${q}" সংক্রান্ত সকল ডাক্তার, হাসপাতাল ও বিশেষজ্ঞ বিভাগের অনুসন্ধান ফলাফল।`
    }

    const canonicalUrl = `https://medconnect.com.bd/search${q ? `?query=${encodeURIComponent(q)}` : ''}`

    return {
      title,
      description,
      canonicalUrl,
      metaRobots: 'noindex, follow', // Protect search engine index bloat
    }
  }, [debouncedQuery])

  const handleClearAll = () => {
    setInputText('')
    setActiveType('all')
    setSelectedDistrict('')
    setSelectedUpazila('')
    setPage(1)
    setSearchParams({}, { replace: true })
  }

  const handleTypeChange = (newType) => {
    setActiveType(newType)
    setPage(1)
    updateUrl({ type: newType })
  }

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingTop: 'var(--header-height, 110px)', paddingBottom: 60, fontFamily: "'Inter', sans-serif" }}>
      <SeoHead
        title={seoData.title}
        description={seoData.description}
        canonicalUrl={seoData.canonicalUrl}
      />

      <Container className="py-4">
        {/* Search Hero Box */}
        <div
          className="p-4 p-md-5 rounded-4 mb-4"
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
            color: '#FFFFFF',
          }}
        >
          <div className="text-center mx-auto" style={{ maxWidth: 700 }}>
            <span className="badge rounded-pill px-3 py-1 mb-2" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#38BDF8', fontSize: '0.82rem' }}>
              ইউনিফাইড সার্চ ইঞ্জিন
            </span>
            <h1 className="fw-bold mb-3" style={{ fontSize: '2rem' }}>
              ডাক্তার, হাসপাতাল ও স্পেশালিটি অনুসন্ধান
            </h1>

            {/* Search Input */}
            <div className="mt-4">
              <InputGroup style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <InputGroup.Text style={{ background: '#FFFFFF', border: 'none', paddingLeft: 18 }}>
                  <IconSearch size={22} color="#64748B" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="ডাক্তার, বিভাগ, বা হাসপাতালের নাম লিখুন..."
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value)
                    updateUrl({ query: e.target.value })
                  }}
                  style={{
                    border: 'none',
                    padding: '14px 16px',
                    fontSize: '1rem',
                    boxShadow: 'none',
                  }}
                />
                {inputText && (
                  <InputGroup.Text
                    style={{ background: '#FFFFFF', border: 'none', cursor: 'pointer', paddingRight: 18 }}
                    onClick={() => {
                      setInputText('')
                      updateUrl({ query: '' })
                    }}
                  >
                    <IconX size={18} color="#94A3B8" />
                  </InputGroup.Text>
                )}
              </InputGroup>
            </div>

            {/* Location Selector Bar */}
            <div className="d-flex flex-wrap gap-2 justify-content-center mt-3">
              <div style={{ minWidth: 160 }}>
                <select
                  className="form-select form-select-sm border-0"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', borderRadius: 8, fontSize: '0.85rem' }}
                  value={selectedDistrict}
                  onChange={(e) => {
                    const dist = e.target.value
                    setSelectedDistrict(dist)
                    setSelectedUpazila('')
                    updateUrl({ district: dist, upazila: '' })
                  }}
                >
                  <option value="" style={{ color: '#000' }}>সকল জেলা</option>
                  {(districts || []).map(d => (
                    <option key={d.id} value={d.slug} style={{ color: '#000' }}>{d.bangla_name || d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
          <Nav variant="pills" className="gap-2">
            <Nav.Item>
              <button
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${activeType === 'all' ? 'btn-primary' : 'btn-light border'}`}
                onClick={() => handleTypeChange('all')}
              >
                সকল ফলাফল <Badge bg={activeType === 'all' ? 'light' : 'secondary'} text={activeType === 'all' ? 'dark' : 'white'} className="ms-1 rounded-pill">{counts.total}</Badge>
              </button>
            </Nav.Item>
            <Nav.Item>
              <button
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${activeType === 'doctors' ? 'btn-primary' : 'btn-light border'}`}
                onClick={() => handleTypeChange('doctors')}
              >
                ডাক্তারগণ <Badge bg={activeType === 'doctors' ? 'light' : 'secondary'} text={activeType === 'doctors' ? 'dark' : 'white'} className="ms-1 rounded-pill">{counts.doctors}</Badge>
              </button>
            </Nav.Item>
            <Nav.Item>
              <button
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${activeType === 'hospitals' ? 'btn-primary' : 'btn-light border'}`}
                onClick={() => handleTypeChange('hospitals')}
              >
                হাসপাতালসমূহ <Badge bg={activeType === 'hospitals' ? 'light' : 'secondary'} text={activeType === 'hospitals' ? 'dark' : 'white'} className="ms-1 rounded-pill">{counts.hospitals}</Badge>
              </button>
            </Nav.Item>
            <Nav.Item>
              <button
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${activeType === 'specialties' ? 'btn-primary' : 'btn-light border'}`}
                onClick={() => handleTypeChange('specialties')}
              >
                স্পেশালিটি <Badge bg={activeType === 'specialties' ? 'light' : 'secondary'} text={activeType === 'specialties' ? 'dark' : 'white'} className="ms-1 rounded-pill">{counts.specialties}</Badge>
              </button>
            </Nav.Item>
          </Nav>

          {/* Active Filter Chips */}
          {(debouncedQuery || selectedDistrict || activeType !== 'all') && (
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted">ফিল্টার:</span>
              {debouncedQuery && (
                <span className="badge bg-white text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
                  "{debouncedQuery}"
                  <IconX size={12} className="cursor-pointer" onClick={() => { setInputText(''); updateUrl({ query: '' }) }} />
                </span>
              )}
              {selectedDistrict && (
                <span className="badge bg-white text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
                  জেলা: {selectedDistrict}
                  <IconX size={12} className="cursor-pointer" onClick={() => { setSelectedDistrict(''); updateUrl({ district: '' }) }} />
                </span>
              )}
              <button className="btn btn-link btn-sm text-danger text-decoration-none p-0 ms-2" onClick={handleClearAll}>
                সব মুছুন
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted">অনুসন্ধান ফলাফল প্রস্তুত হচ্ছে...</p>
          </div>
        )}

        {/* Error State */}
        {error && <ErrorState message={error} />}

        {/* Empty State */}
        {!loading && !error && counts.total === 0 && (
          <div className="text-center py-5 bg-white rounded-4 border p-5">
            <IconSearch size={48} color="#94A3B8" className="mb-3" />
            <h4 className="fw-bold text-dark">কোনো ফলাফল পাওয়া যায়নি</h4>
            <p className="text-muted mx-auto" style={{ maxWidth: 450 }}>
              আপনার অনুসন্ধান কিওয়ার্ড বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
            </p>
            <button className="btn btn-primary btn-sm rounded-pill px-4 mt-2" onClick={handleClearAll}>
              সকল ফিল্টার রিসেট করুন
            </button>
          </div>
        )}

        {/* Unified All View */}
        {!loading && !error && activeType === 'all' && counts.total > 0 && (
          <div>
            {/* 1. Specialties Result */}
            {specialties.length > 0 && (
              <div className="mb-5">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h4 className="fw-bold text-dark fs-5 mb-0">স্পেশালিটি ও বিভাগ</h4>
                  <button className="btn btn-link btn-sm text-primary text-decoration-none fw-semibold" onClick={() => handleTypeChange('specialties')}>
                    সব দেখুন ({counts.specialties}) <IconArrowRight size={14} />
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {specialties.map((spec) => (
                    <Link
                      key={spec.id}
                      to={spec.canonical_url || `/specialties/${spec.slug || spec.id}`}
                      className="btn btn-white rounded-pill px-3 py-2 text-dark border bg-white shadow-sm"
                      style={{ fontSize: '0.9rem' }}
                    >
                      <IconStethoscope size={16} className="me-1 text-primary" />
                      <span>{spec.name}</span>
                      <span className="badge bg-light text-muted rounded-pill ms-2">{spec.doctors_count ?? 0}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Doctors Result */}
            {doctors.length > 0 && (
              <div className="mb-5">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h4 className="fw-bold text-dark fs-5 mb-0">ডাক্তারগণ</h4>
                  <button className="btn btn-link btn-sm text-primary text-decoration-none fw-semibold" onClick={() => handleTypeChange('doctors')}>
                    সব ডাক্তার দেখুন ({counts.doctors}) <IconArrowRight size={14} />
                  </button>
                </div>
                <Row className="g-4">
                  {doctors.map((doc) => (
                    <Col key={doc.id} xs={12} sm={6} md={4}>
                      <DoctorCard doctor={doc} />
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* 3. Hospitals Result */}
            {hospitals.length > 0 && (
              <div className="mb-5">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h4 className="fw-bold text-dark fs-5 mb-0">হাসপাতালসমূহ</h4>
                  <button className="btn btn-link btn-sm text-primary text-decoration-none fw-semibold" onClick={() => handleTypeChange('hospitals')}>
                    সব হাসপাতাল দেখুন ({counts.hospitals}) <IconArrowRight size={14} />
                  </button>
                </div>
                <Row className="g-4">
                  {hospitals.map((hosp) => (
                    <Col key={hosp.id} xs={12} sm={6} md={4}>
                      <HospitalCard hospital={hosp} />
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        )}

        {/* Scoped Doctors View */}
        {!loading && !error && activeType === 'doctors' && doctors.length > 0 && (
          <Row className="g-4">
            {doctors.map((doc) => (
              <Col key={doc.id} xs={12} sm={6} md={4} lg={4}>
                <DoctorCard doctor={doc} />
              </Col>
            ))}
          </Row>
        )}

        {/* Scoped Hospitals View */}
        {!loading && !error && activeType === 'hospitals' && hospitals.length > 0 && (
          <Row className="g-4">
            {hospitals.map((hosp) => (
              <Col key={hosp.id} xs={12} sm={6} md={4} lg={4}>
                <HospitalCard hospital={hosp} />
              </Col>
            ))}
          </Row>
        )}

        {/* Scoped Specialties View */}
        {!loading && !error && activeType === 'specialties' && specialties.length > 0 && (
          <Row className="g-3">
            {specialties.map((spec) => (
              <Col key={spec.id} xs={12} sm={6} md={4} lg={3}>
                <Link
                  to={spec.canonical_url || `/specialties/${spec.slug || spec.id}`}
                  className="p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between text-decoration-none text-dark shadow-sm h-100"
                >
                  <div className="d-flex align-items-center gap-2">
                    <IconActivity size={20} className="text-primary" />
                    <span className="fw-semibold">{spec.name}</span>
                  </div>
                  <Badge bg="light" text="dark" className="rounded-pill border">{spec.doctors_count ?? 0} জন</Badge>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  )
}

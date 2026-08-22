import React, { useMemo } from 'react'
import { Container, Row, Col, Breadcrumb } from 'react-bootstrap'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  IconStethoscope, IconUsers, IconBuildingHospital, IconMapPin,
  IconChevronRight, IconArrowLeft, IconHeart, IconBrain, IconBone,
  IconBabyCarriage, IconDroplet, IconDental, IconActivity
} from '@tabler/icons-react'
import useSpecialtyHub from '../hooks/useSpecialtyHub'
import useLocations from '../hooks/useLocations'
import DoctorCard from '../components/common/DoctorCard'
import HospitalCard from '../components/common/HospitalCard'
import SeoHead from '../components/common/SeoHead'
import ErrorState from '../components/common/ErrorState'

const ICON_MAP = {
  cardiology: IconHeart,
  medicine: IconStethoscope,
  surgery: IconActivity,
  pediatrics: IconBabyCarriage,
  gynecology: IconHeart,
  neurology: IconBrain,
  orthopedics: IconBone,
  dental: IconDental,
  dentistry: IconDental,
  dermatology: IconDroplet,
}

export default function SpecialtyDetailPage() {
  const { slug, district: districtParam, upazila: upazilaParam } = useParams()
  const navigate = useNavigate()
  const { districts, upazilas } = useLocations()

  const {
    specialty,
    doctors,
    doctorTotal,
    hospitals,
    hospitalTotal,
    relatedSpecialties,
    loading,
    error,
  } = useSpecialtyHub(slug, districtParam, upazilaParam)

  const districtObj = useMemo(() => {
    return districts?.find(d => d.slug === districtParam)
  }, [districts, districtParam])

  const upazilaObj = useMemo(() => {
    return upazilas?.find(u => u.slug === upazilaParam)
  }, [upazilas, upazilaParam])

  const distNameBn = districtObj?.bangla_name || districtObj?.name_bn || districtObj?.name
  const upaNameBn = upazilaObj?.bangla_name || upazilaObj?.name_bn || upazilaObj?.name
  const distNameEn = districtObj?.name || districtParam
  const upaNameEn = upazilaObj?.name || upazilaParam

  // Dynamic SEO calculation
  const seoData = useMemo(() => {
    const specName = specialty?.name || 'Specialty'
    const specNameBn = specialty?.name_bn || specName

    let canonicalPath = `/specialties/${slug}`
    let title = `${specName} বিশেষজ্ঞ ডাক্তার ও হাসপাতাল তালিকা | MedConnect`
    let description = `বাংলাদেশের শীর্ষস্থানীয় ${specName} (${specNameBn}) বিশেষজ্ঞ ডাক্তারদের প্রোফাইল, চেম্বার লোকেশন ও সংশ্লিষ্ট হাসপাতালের তালিকা।`

    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Specialties', url: '/specialties' },
    ]

    if (districtParam) {
      canonicalPath = `/specialties/${slug}/${districtParam}`
      title = `${distNameBn || distNameEn} জেলার সেরা ${specName} বিশেষজ্ঞ ডাক্তার তালিকা | MedConnect`
      description = `${distNameBn || distNameEn} জেলার শীর্ষ ${specName} বিশেষজ্ঞ ডাক্তার, চেম্বার সময়সূচী ও হাসপাতালের তালিকা।`
      breadcrumbs.push({ name: specName, url: `/specialties/${slug}` })
      breadcrumbs.push({ name: distNameEn || 'District', url: `/specialties/${slug}/${districtParam}` })

      if (upazilaParam) {
        canonicalPath = `/specialties/${slug}/${districtParam}/${upazilaParam}`
        title = `${upaNameBn || upaNameEn}, ${distNameBn || distNameEn} — ${specName} বিশেষজ্ঞ ডাক্তার | MedConnect`
        description = `${upaNameBn || upaNameEn}, ${distNameBn || distNameEn} এলাকার সেরা ${specName} বিশেষজ্ঞ ডাক্তার ও ক্লিনিক তালিকা।`
        breadcrumbs.push({ name: upaNameEn || 'Upazila', url: `/specialties/${slug}/${districtParam}/${upazilaParam}` })
      }
    } else {
      breadcrumbs.push({ name: specName, url: `/specialties/${slug}` })
    }

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description: description,
      url: `https://medconnect.com.bd${canonicalPath}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: doctors.slice(0, 10).map((doc, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: doc.name || doc.name_bn,
          url: doc.canonical_url ? `https://medconnect.com.bd${doc.canonical_url}` : undefined,
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
        item: `https://medconnect.com.bd${crumb.url}`,
      })),
    }

    return {
      title,
      description,
      canonicalUrl: `https://medconnect.com.bd${canonicalPath}`,
      schema: [collectionSchema, breadcrumbSchema],
    }
  }, [specialty, slug, districtParam, upazilaParam, distNameBn, distNameEn, upaNameBn, upaNameEn, doctors])

  const IconComponent = ICON_MAP[slug?.toLowerCase()] || IconStethoscope

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingTop: 'var(--header-height, 110px)', paddingBottom: 60, fontFamily: "'Inter', sans-serif" }}>
      <SeoHead
        title={seoData.title}
        description={seoData.description}
        canonicalUrl={seoData.canonicalUrl}
        schema={seoData.schema}
      />

      <Container className="py-4">
        {/* Navigation Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb mb-0" style={{ fontSize: '0.88rem' }}>
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/specialties" className="text-decoration-none text-muted">Specialties</Link></li>
            {districtParam && (
              <li className="breadcrumb-item">
                <Link to={`/specialties/${slug}`} className="text-decoration-none text-muted">{specialty?.name || slug}</Link>
              </li>
            )}
            {districtParam && !upazilaParam && (
              <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">{distNameEn || districtParam}</li>
            )}
            {upazilaParam && (
              <>
                <li className="breadcrumb-item">
                  <Link to={`/specialties/${slug}/${districtParam}`} className="text-decoration-none text-muted">{distNameEn || districtParam}</Link>
                </li>
                <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">{upaNameEn || upazilaParam}</li>
              </>
            )}
            {!districtParam && (
              <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">{specialty?.name || slug}</li>
            )}
          </ol>
        </nav>

        {/* Hero Hub Card */}
        <div
          className="p-4 p-md-5 rounded-4 mb-5 text-white position-relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)',
            boxShadow: '0 10px 30px rgba(37, 99, 235, 0.15)',
          }}
        >
          <Row className="align-items-center">
            <Col lg={8}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 56, height: 56, background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)' }}
                >
                  <IconComponent size={32} color="#fff" />
                </div>
                <div>
                  <span className="badge bg-white text-primary rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.8rem' }}>
                    মেডিকেল বিভাগ
                  </span>
                  <h1 className="fw-bold mb-0 text-white mt-1" style={{ fontSize: '2.2rem' }}>
                    {specialty?.name || slug}
                    {districtParam ? ` — ${distNameBn || distNameEn}` : ''}
                    {upazilaParam ? ` (${upaNameBn || upaNameEn})` : ''}
                  </h1>
                </div>
              </div>

              <p className="lead text-white-50 mb-4" style={{ fontSize: '1rem', maxWidth: 650 }}>
                {specialty?.name_bn || 'অভিজ্ঞ বিশেষজ্ঞ ডাক্তার এবং শীর্ষ হাসপাতালের তালিকা। সরাসরি অ্যাপয়েন্টমেন্ট বুকিং ও সিরিয়াল সেবা।'}
              </p>

              {/* Counts Badge Strip */}
              <div className="d-flex flex-wrap gap-3">
                <div className="px-3 py-2 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  <div className="small text-white-50">মোট ডাক্তার</div>
                  <div className="fw-bold text-white fs-5">{doctorTotal} জন</div>
                </div>
                <div className="px-3 py-2 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  <div className="small text-white-50">সংশ্লিষ্ট হাসপাতাল</div>
                  <div className="fw-bold text-white fs-5">{hospitalTotal} টি</div>
                </div>
              </div>
            </Col>

            {/* Regional Filter Switcher */}
            <Col lg={4} className="mt-4 mt-lg-0">
              <div className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <div className="d-flex align-items-center gap-2 mb-2 text-white fw-semibold small">
                  <IconMapPin size={16} />
                  <span>অন্যান্য জেলা নির্বাচন করুন:</span>
                </div>
                <select
                  className="form-select border-0 shadow-none"
                  style={{ background: '#FFFFFF', color: '#1E293B', borderRadius: 8, fontSize: '0.9rem' }}
                  value={districtParam || ''}
                  onChange={(e) => {
                    const targetDist = e.target.value
                    if (targetDist) {
                      navigate(`/specialties/${slug}/${targetDist}`)
                    } else {
                      navigate(`/specialties/${slug}`)
                    }
                  }}
                >
                  <option value="">সকল জেলা (সমগ্র বাংলাদেশ)</option>
                  {(districts || []).map(d => (
                    <option key={d.id} value={d.slug}>{d.bangla_name || d.name}</option>
                  ))}
                </select>
              </div>
            </Col>
          </Row>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2">স্পেশালিটির তথ্য লোড হচ্ছে...</p>
          </div>
        )}

        {error && <ErrorState message={error} />}

        {!loading && !error && (
          <>
            {/* Section 1: Doctors in this Specialty */}
            <div className="mb-5">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '1.4rem' }}>
                    {specialty?.name} বিশেষজ্ঞ ডাক্তারগণ
                  </h3>
                  <p className="text-muted small mb-0">অভিজ্ঞ ডাক্তারদের সাথে পরামর্শ করুন ও চেম্বার সিরিয়াল নিন</p>
                </div>
                <Link
                  to={`/doctors?specialty_id=${specialty?.id}${districtParam ? `&district_slug=${districtParam}` : ''}`}
                  className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold"
                >
                  সকল ডাক্তার দেখুন ({doctorTotal})
                </Link>
              </div>

              {doctors.length === 0 ? (
                <div className="p-4 rounded-4 text-center bg-white border border-light-subtle">
                  <IconUsers size={36} color="#94A3B8" className="mb-2" />
                  <p className="text-muted mb-0">এই অঞ্চলে বর্তমানে কোনো তালিকাভুক্ত ডাক্তার পাওয়া যায়নি।</p>
                </div>
              ) : (
                <Row className="g-4">
                  {doctors.slice(0, 6).map((doc) => (
                    <Col key={doc.id} xs={12} sm={6} md={4} lg={4}>
                      <DoctorCard doctor={doc} />
                    </Col>
                  ))}
                </Row>
              )}
            </div>

            {/* Section 2: Hospitals Offering this Specialty */}
            {hospitals.length > 0 && (
              <div className="mb-5">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '1.4rem' }}>
                      {specialty?.name} সেবা সমৃদ্ধ হাসপাতালসমূহ
                    </h3>
                    <p className="text-muted small mb-0">উন্নত স্বাস্থ্যসেবা ও ওপিডি সুবিধা সম্বলিত হাসপাতাল</p>
                  </div>
                  <Link
                    to={`/hospitals?type=&specialty_id=${specialty?.id}${districtParam ? `&district_slug=${districtParam}` : ''}`}
                    className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold"
                  >
                    সকল হাসপাতাল দেখুন ({hospitalTotal})
                  </Link>
                </div>

                <Row className="g-4">
                  {hospitals.slice(0, 3).map((hosp) => (
                    <Col key={hosp.id} xs={12} md={4}>
                      <HospitalCard hospital={hosp} />
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Section 3: Related / Popular Specialties */}
            {relatedSpecialties.length > 0 && (
              <div className="mt-5 pt-4 border-top">
                <h4 className="fw-bold text-dark mb-3" style={{ fontSize: '1.2rem' }}>
                  অন্যান্য জনপ্রিয় বিশেষজ্ঞ বিভাগ
                </h4>
                <div className="d-flex flex-wrap gap-2">
                  {relatedSpecialties.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/specialties/${rel.slug || rel.id}${districtParam ? `/${districtParam}` : ''}`}
                      className="btn btn-light rounded-pill px-3 py-2 text-dark border"
                      style={{ fontSize: '0.9rem' }}
                    >
                      <span>{rel.name}</span>
                      <span className="badge bg-secondary-subtle text-secondary rounded-pill ms-2">
                        {rel.doctors_count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  )
}

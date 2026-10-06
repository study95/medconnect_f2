import React, { useMemo } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  IconStethoscope, IconUsers, IconBuildingHospital, IconMapPin,
  IconChevronRight, IconArrowLeft, IconHeart, IconBrain, IconBone,
  IconBabyCarriage, IconDroplet, IconDental, IconActivity, IconEye,
  IconHeadset, IconMoodSmile
} from '@tabler/icons-react'
import useSpecialtyHub from '../hooks/useSpecialtyHub'
import useLocations from '../hooks/useLocations'
import DoctorCard from '../components/common/DoctorCard'
import HospitalCard from '../components/common/HospitalCard'
import SeoHead from '../components/common/SeoHead'
import ErrorState from '../components/common/ErrorState'

// Dynamic specialty metadata & icon generator
const getSpecialtyMeta = (slug = '', name = '') => {
  const key = (String(slug) + ' ' + String(name)).toLowerCase()

  if (key.includes('uro') || key.includes('kidney') || key.includes('ইউরোলজি') || key.includes('মূত্র')) {
    return { icon: IconActivity, color: '#0D9488', bg: 'linear-gradient(135deg, #0F766E 0%, #0D9488 60%, #14B8A6 100%)', badgeBg: '#CCFBF1', badgeColor: '#0F766E', label: 'ইউরোলজি ও কিডনি রোগ' }
  }
  if (key.includes('cardio') || key.includes('heart') || key.includes('হৃদ')) {
    return { icon: IconHeart, color: '#EF4444', bg: 'linear-gradient(135deg, #991B1B 0%, #DC2626 60%, #EF4444 100%)', badgeBg: '#FEE2E2', badgeColor: '#991B1B', label: 'হৃদরোগ ও কার্ডিওলজি' }
  }
  if (key.includes('neuro') || key.includes('brain') || key.includes('স্নায়ু')) {
    return { icon: IconBrain, color: '#9333EA', bg: 'linear-gradient(135deg, #581C87 0%, #7E22CE 60%, #9333EA 100%)', badgeBg: '#F3E8FF', badgeColor: '#581C87', label: 'নিউরোমেডিসিন ও স্নায়ুরোগ' }
  }
  if (key.includes('derma') || key.includes('skin') || key.includes('চর্ম')) {
    return { icon: IconDroplet, color: '#D97706', bg: 'linear-gradient(135deg, #78350F 0%, #B45309 60%, #D97706 100%)', badgeBg: '#FEF3C7', badgeColor: '#78350F', label: 'চর্ম ও এলার্জি রোগ' }
  }
  if (key.includes('pedia') || key.includes('child') || key.includes('শিশু')) {
    return { icon: IconBabyCarriage, color: '#0284C7', bg: 'linear-gradient(135deg, #075985 0%, #0369A1 60%, #0284C7 100%)', badgeBg: '#E0F2FE', badgeColor: '#075985', label: 'শিশু স্বাস্থ্য ও শিশুরোগ' }
  }
  if (key.includes('gyne') || key.includes('female') || key.includes('woman') || key.includes('স্ত্রী') || key.includes('প্রসূতি')) {
    return { icon: IconHeart, color: '#DB2777', bg: 'linear-gradient(135deg, #831843 0%, #BE185D 60%, #DB2777 100%)', badgeBg: '#FCE7F3', badgeColor: '#831843', label: 'স্ত্রী রোগ ও প্রসূতি বিদ্যা' }
  }
  if (key.includes('dent') || key.includes('দন্ত') || key.includes('দাঁত')) {
    return { icon: IconDental, color: '#16A34A', bg: 'linear-gradient(135deg, #14532D 0%, #15803D 60%, #16A34A 100%)', badgeBg: '#DCFCE7', badgeColor: '#14532D', label: 'দন্ত চিকিৎসা ও ডেন্টাল' }
  }
  if (key.includes('ortho') || key.includes('bone') || key.includes('অর্থোপেডিক্স') || key.includes('হাড়')) {
    return { icon: IconBone, color: '#EA580C', bg: 'linear-gradient(135deg, #7C2D12 0%, #C2410C 60%, #EA580C 100%)', badgeBg: '#FFEDD5', badgeColor: '#7C2D12', label: 'অর্থোপেডিক্স ও হাড়জোড়া' }
  }
  if (key.includes('eye') || key.includes('ophthalm') || key.includes('চক্ষু') || key.includes('চোখ')) {
    return { icon: IconEye, color: '#0284C7', bg: 'linear-gradient(135deg, #0F4C81 0%, #0284C7 60%, #38BDF8 100%)', badgeBg: '#E0F2FE', badgeColor: '#0F4C81', label: 'চক্ষু রোগ বিশেষজ্ঞ' }
  }
  if (key.includes('ent') || key.includes('ear') || key.includes('nose') || key.includes('throat') || key.includes('ইএনটি')) {
    return { icon: IconHeadset, color: '#4F46E5', bg: 'linear-gradient(135deg, #312E81 0%, #4338CA 60%, #4F46E5 100%)', badgeBg: '#E0E7FF', badgeColor: '#312E81', label: 'ইএনটি (কান, নাক, গলা)' }
  }
  if (key.includes('psych') || key.includes('mind') || key.includes('মানসিক')) {
    return { icon: IconMoodSmile, color: '#7C3AED', bg: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 60%, #7C3AED 100%)', badgeBg: '#EDE9FE', badgeColor: '#4C1D95', label: 'মনোরোগ ও মানসিক স্বাস্থ্য' }
  }
  if (key.includes('gastro') || key.includes('liver') || key.includes('লিভার')) {
    return { icon: IconActivity, color: '#059669', bg: 'linear-gradient(135deg, #064E3B 0%, #047857 60%, #059669 100%)', badgeBg: '#D1FAE5', badgeColor: '#064E3B', label: 'গ্যাস্ট্রোএন্টারোলজি ও লিভার' }
  }

  // Default Theme
  return { icon: IconStethoscope, color: '#2563EB', bg: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)', badgeBg: '#DBEAFE', badgeColor: '#1E3A8A', label: 'মেডিকেল বিশেষজ্ঞ বিভাগ' }
}

const enToBnDigits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBengaliNumber = (str) => (str !== null && str !== undefined && str !== '') ? String(str).replace(/\d/g, d => enToBnDigits[d] || d) : ''

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
    const specName = specialty?.name || slug || 'Specialty'
    const specNameBn = specialty?.name_bn || specName

    let canonicalPath = `/specialties/${slug}`
    let title = `${specName} বিশেষজ্ঞ ডাক্তার ও হাসপাতাল তালিকা | DoctorBooklet`
    let description = `বাংলাদেশের শীর্ষস্থানীয় ${specName} (${specNameBn}) বিশেষজ্ঞ ডাক্তারদের প্রোফাইল, চেম্বার লোকেশন ও সংশ্লিষ্ট হাসপাতালের তালিকা।`

    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Specialties', url: '/specialties' },
    ]

    if (districtParam) {
      canonicalPath = `/specialties/${slug}/${districtParam}`
      title = `${distNameBn || distNameEn} জেলার সেরা ${specName} বিশেষজ্ঞ ডাক্তার তালিকা | DoctorBooklet`
      description = `${distNameBn || distNameEn} জেলার শীর্ষ ${specName} বিশেষজ্ঞ ডাক্তার, চেম্বার সময়সূচী ও হাসপাতালের তালিকা।`
      breadcrumbs.push({ name: specName, url: `/specialties/${slug}` })
      breadcrumbs.push({ name: distNameEn || 'District', url: `/specialties/${slug}/${districtParam}` })

      if (upazilaParam) {
        canonicalPath = `/specialties/${slug}/${districtParam}/${upazilaParam}`
        title = `${upaNameBn || upaNameEn}, ${distNameBn || distNameEn} — ${specName} বিশেষজ্ঞ ডাক্তার | DoctorBooklet`
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
      url: `https://doctorbooklet.com.bd${canonicalPath}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: doctors.slice(0, 10).map((doc, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: doc.name || doc.name_bn,
          url: doc.canonical_url ? `https://doctorbooklet.com.bd${doc.canonical_url}` : undefined,
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
        item: `https://doctorbooklet.com.bd${crumb.url}`,
      })),
    }

    return {
      title,
      description,
      canonicalUrl: `https://doctorbooklet.com.bd${canonicalPath}`,
      schema: [collectionSchema, breadcrumbSchema],
    }
  }, [specialty, slug, districtParam, upazilaParam, distNameBn, distNameEn, upaNameBn, upaNameEn, doctors])

  const meta = useMemo(() => {
    return getSpecialtyMeta(slug, specialty?.name)
  }, [slug, specialty])

  const IconComponent = meta.icon

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingTop: 'var(--header-height, 100px)', paddingBottom: 60, fontFamily: "'Inter', sans-serif" }}>
      <SeoHead
        title={seoData.title}
        description={seoData.description}
        canonicalUrl={seoData.canonicalUrl}
        schema={seoData.schema}
      />

      <style>{`
        .specialty-hero-card {
          padding: 24px 20px;
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
        }
        @media (min-width: 768px) {
          .specialty-hero-card {
            padding: 36px 40px;
            border-radius: 20px;
          }
        }
        .specialty-title {
          font-size: 1.45rem;
          line-height: 1.35;
          letter-spacing: -0.3px;
        }
        @media (min-width: 768px) {
          .specialty-title {
            font-size: 2.1rem;
          }
        }
        .spec-section-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (min-width: 576px) {
          .spec-section-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .spec-chip-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .spec-chip-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
      `}</style>

      <Container className="py-3 py-md-4">
        {/* Navigation Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb mb-0" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
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

        {/* Dynamic Responsive Hero Card */}
        <div
          className="specialty-hero-card mb-4 mb-md-5 text-white position-relative overflow-hidden"
          style={{
            background: meta.bg,
          }}
        >
          <Row className="align-items-center g-4">
            <Col lg={8}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 52, height: 52, background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}
                >
                  <IconComponent size={28} color="#fff" />
                </div>
                <div>
                  <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: meta.badgeBg, color: meta.badgeColor, fontSize: '0.75rem', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {meta.label}
                  </span>
                  <h1 className="fw-extrabold mb-0 text-white specialty-title mt-1" style={{ fontFamily: "'Hind Siliguri', 'Inter', sans-serif" }}>
                    {specialty?.name_bn || specialty?.name || slug}
                    {districtParam ? ` — ${distNameBn || distNameEn}` : ''}
                    {upazilaParam ? ` (${upaNameBn || upaNameEn})` : ''}
                  </h1>
                </div>
              </div>

              <p className="text-white-50 mb-3 mb-md-4" style={{ fontSize: '0.92rem', maxWidth: 650, fontFamily: "'Hind Siliguri', sans-serif", lineHeight: 1.6 }}>
                {specialty?.description || 'অভিজ্ঞ বিশেষজ্ঞ ডাক্তার এবং শীর্ষ হাসপাতালের তালিকা। সরাসরি অ্যাপয়েন্টমেন্ট বুকিং ও সিরিয়াল সেবা।'}
              </p>

              {/* Counts Badge Strip */}
              <div className="d-flex flex-wrap gap-2 gap-sm-3">
                <div className="px-3 py-2 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  <div className="small text-white-50" style={{ fontSize: '0.75rem', fontFamily: "'Hind Siliguri', sans-serif" }}>মোট বিশেষজ্ঞ ডাক্তার</div>
                  <div className="fw-bold text-white fs-6" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{toBengaliNumber(doctorTotal)} জন</div>
                </div>
                <div className="px-3 py-2 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  <div className="small text-white-50" style={{ fontSize: '0.75rem', fontFamily: "'Hind Siliguri', sans-serif" }}>সংশ্লিষ্ট হাসপাতাল</div>
                  <div className="fw-bold text-white fs-6" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{toBengaliNumber(hospitalTotal)} টি</div>
                </div>
              </div>
            </Col>

            {/* Regional Filter Switcher */}
            <Col lg={4}>
              <div className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
                <div className="d-flex align-items-center gap-2 mb-2 text-white fw-semibold small" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                  <IconMapPin size={16} />
                  <span>অন্যান্য জেলা নির্বাচন করুন:</span>
                </div>
                <select
                  className="form-select border-0 shadow-sm"
                  style={{ background: '#FFFFFF', color: '#0F172A', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}
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
                    <option key={d.id} value={d.slug}>{d.bangla_name || d.name_bn || d.name}</option>
                  ))}
                </select>
              </div>
            </Col>
          </Row>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>বিশেষজ্ঞ বিভাগের তথ্য লোড হচ্ছে...</p>
          </div>
        )}

        {error && <ErrorState message={error} />}

        {!loading && !error && (
          <>
            {/* Section 1: Doctors in this Specialty */}
            <div className="mb-5">
              <div className="spec-section-header">
                <div>
                  <h2 className="fw-bold text-dark mb-1" style={{ fontSize: '1.25rem', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {specialty?.name_bn || specialty?.name || slug} বিশেষজ্ঞ ডাক্তারগণ
                  </h2>
                  <p className="text-muted small mb-0" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>অভিজ্ঞ ডাক্তারদের সাথে পরামর্শ করুন ও চেম্বার সিরিয়াল নিন</p>
                </div>
                <Link
                  to={`/doctors?specialty_id=${specialty?.id}${districtParam ? `&district_slug=${districtParam}` : ''}`}
                  className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold"
                  style={{ fontSize: '0.82rem', fontFamily: "'Hind Siliguri', sans-serif", whiteSpace: 'nowrap' }}
                >
                  সকল ডাক্তার দেখুন ({toBengaliNumber(doctorTotal)}) ❯
                </Link>
              </div>

              {doctors.length === 0 ? (
                <div className="p-4 rounded-4 text-center bg-white border border-light-subtle">
                  <IconUsers size={36} color="#94A3B8" className="mb-2" />
                  <p className="text-muted mb-0" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>এই অঞ্চলে বর্তমানে কোনো তালিকাভুক্ত ডাক্তার পাওয়া যায়নি।</p>
                </div>
              ) : (
                <Row className="g-3 g-md-4">
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
                <div className="spec-section-header">
                  <div>
                    <h2 className="fw-bold text-dark mb-1" style={{ fontSize: '1.25rem', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      {specialty?.name_bn || specialty?.name || slug} সেবা সমৃদ্ধ হাসপাতালসমূহ
                    </h2>
                    <p className="text-muted small mb-0" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>উন্নত স্বাস্থ্যসেবা ও ওপিডি সুবিধা সম্বলিত হাসপাতাল</p>
                  </div>
                  <Link
                    to={`/hospitals?type=&specialty_id=${specialty?.id}${districtParam ? `&district_slug=${districtParam}` : ''}`}
                    className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold"
                    style={{ fontSize: '0.82rem', fontFamily: "'Hind Siliguri', sans-serif", whiteSpace: 'nowrap' }}
                  >
                    সকল হাসপাতাল দেখুন ({toBengaliNumber(hospitalTotal)}) ❯
                  </Link>
                </div>

                <Row className="g-3 g-md-4">
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
                <h3 className="fw-bold text-dark mb-3" style={{ fontSize: '1.15rem', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  অন্যান্য জনপ্রিয় বিশেষজ্ঞ বিভাগ
                </h3>
                <div className="d-flex flex-wrap gap-2">
                  {relatedSpecialties.map((rel) => {
                    const relMeta = getSpecialtyMeta(rel.slug, rel.name)
                    const RelIcon = relMeta.icon
                    return (
                      <Link
                        key={rel.id}
                        to={`/specialties/${rel.slug || rel.id}${districtParam ? `/${districtParam}` : ''}`}
                        className="spec-chip-btn btn bg-white text-dark border rounded-pill px-3 py-2 d-inline-flex alignItems-center gap-2"
                        style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif", boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                      >
                        <RelIcon size={16} color={relMeta.color} />
                        <span>{rel.name_bn || rel.name}</span>
                        {rel.doctors_count !== undefined && (
                          <span className="badge rounded-pill ms-1" style={{ background: '#F1F5F9', color: '#64748B', fontSize: '0.72rem' }}>
                            {toBengaliNumber(rel.doctors_count)}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { Container, Row, Col, Form, InputGroup } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import {
  IconSearch, IconStethoscope, IconHeart, IconBrain,
  IconBabyCarriage, IconDroplet, IconBone, IconDental,
  IconChevronRight, IconUsers, IconBuildingHospital, IconActivity
} from '@tabler/icons-react'
import useSpecialties from '../hooks/useSpecialties'
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

export default function SpecialtiesPage() {
  const { specialties, loading, error } = useSpecialties()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSpecialties = useMemo(() => {
    if (!searchTerm.trim()) return specialties
    const q = searchTerm.toLowerCase().trim()
    return specialties.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.slug || '').toLowerCase().includes(q)
    )
  }, [specialties, searchTerm])

  const seoData = useMemo(() => {
    const title = 'সকল মেডিকেল স্পেশালিটি ও বিশেষজ্ঞ বিভাগ | MedConnect'
    const description = 'বাংলাদেশের সকল মেডিকেল স্পেশালিটি, বিশেষজ্ঞ ডাক্তার এবং সংশ্লিষ্ট হাসপাতালের তালিকা। আপনার প্রয়োজনীয় বিভাগের বিশেষজ্ঞ ডাক্তার খুঁজুন।'
    const canonicalUrl = 'https://medconnect.com.bd/specialties'

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description: description,
      url: canonicalUrl,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: (specialties || []).map((spec, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: spec.name,
          url: `https://medconnect.com.bd/specialties/${spec.slug || spec.id}`,
        })),
      },
    }

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://medconnect.com.bd/' },
        { '@type': 'ListItem', position: 2, name: 'Specialties', item: canonicalUrl },
      ],
    }

    return { title, description, canonicalUrl, schema: [collectionSchema, breadcrumbSchema] }
  }, [specialties])

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingTop: 'var(--header-height, 110px)', paddingBottom: 60, fontFamily: "'Inter', sans-serif" }}>
      <SeoHead
        title={seoData.title}
        description={seoData.description}
        canonicalUrl={seoData.canonicalUrl}
        schema={seoData.schema}
      />

      <Container className="py-4">
        {/* Header Banner */}
        <div className="text-center mb-5">
          <span className="badge rounded-pill px-3 py-2 mb-2" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', fontWeight: 600, fontSize: '0.85rem' }}>
            মেডিকেল স্পেশালিটি ডিরেক্টরি
          </span>
          <h1 className="fw-bold text-dark mt-2" style={{ fontSize: '2.2rem', letterSpacing: '-0.5px' }}>
            সকল বিশেষজ্ঞ বিভাগ
          </h1>
          <p className="text-muted mx-auto" style={{ maxWidth: 650, fontSize: '1rem', lineHeight: 1.6 }}>
            আপনার নির্দিষ্ট স্বাস্থ্য সমস্যার জন্য উপযুক্ত বিশেষজ্ঞ বিভাগ বেছে নিন এবং অভিজ্ঞ ডাক্তার ও হাসপাতালের তথ্য দেখুন।
          </p>

          {/* Search Box */}
          <div className="mx-auto mt-4" style={{ maxWidth: 480 }}>
            <InputGroup style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 14, overflow: 'hidden' }}>
              <InputGroup.Text style={{ background: '#fff', border: '1px solid #E2E8F0', borderRight: 'none', paddingLeft: 18 }}>
                <IconSearch size={20} color="#94A3B8" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="স্পেশালিটি খুঁজুন (যেমন: Cardiology, Medicine)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: '1px solid #E2E8F0',
                  borderLeft: 'none',
                  padding: '12px 16px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              />
            </InputGroup>
          </div>
        </div>

        {/* Loading / Error / Empty States */}
        {loading && (
          <Row className="g-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Col key={i} xs={12} sm={6} md={4} lg={3}>
                <div style={{ height: 140, background: '#E2E8F0', borderRadius: 16, animation: 'pulse 1.5s infinite ease-in-out' }} />
              </Col>
            ))}
          </Row>
        )}

        {error && <ErrorState message={error} />}

        {!loading && !error && filteredSpecialties.length === 0 && (
          <div className="text-center py-5">
            <IconStethoscope size={48} color="#94A3B8" className="mb-3" />
            <h5 className="fw-bold text-dark">কোনো স্পেশালিটি খুঁজে পাওয়া যায়নি</h5>
            <p className="text-muted">ভিন্ন নাম দিয়ে অনুসন্ধান করার চেষ্টা করুন।</p>
          </div>
        )}

        {/* Specialties Grid */}
        {!loading && !error && filteredSpecialties.length > 0 && (
          <Row className="g-4">
            {filteredSpecialties.map((spec) => {
              const IconComponent = ICON_MAP[spec.slug?.toLowerCase()] || IconStethoscope
              const detailUrl = `/specialties/${spec.slug || spec.id}`

              return (
                <Col key={spec.id} xs={12} sm={6} md={4} lg={3}>
                  <Link
                    to={detailUrl}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      className="h-100 p-4 rounded-4 transition-all"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.25s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(37, 99, 235, 0.08)'
                        e.currentTarget.style.borderColor = '#BFDBFE'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'
                        e.currentTarget.style.borderColor = '#E2E8F0'
                      }}
                    >
                      <div>
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                          style={{
                            width: 48,
                            height: 48,
                            background: 'rgba(37, 99, 235, 0.08)',
                            color: '#2563EB',
                          }}
                        >
                          <IconComponent size={24} />
                        </div>
                        <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.1rem' }}>
                          {spec.name}
                        </h5>
                        <p className="text-muted small mb-3" style={{ fontSize: '0.85rem' }}>
                          {spec.name_bn || 'মেডিকেল স্পেশালিটি ও পরামর্শ'}
                        </p>
                      </div>

                      <div className="d-flex align-items-center justify-content-between pt-3 border-top" style={{ borderColor: '#F1F5F9' }}>
                        <span className="small text-muted d-flex align-items-center gap-1">
                          <IconUsers size={15} color="#64748B" />
                          <span>{spec.doctors_count ?? 0} জন ডাক্তার</span>
                        </span>
                        <IconChevronRight size={18} color="#2563EB" />
                      </div>
                    </div>
                  </Link>
                </Col>
              )
            })}
          </Row>
        )}
      </Container>
    </div>
  )
}

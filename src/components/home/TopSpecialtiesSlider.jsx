import React, { useEffect, useState, useMemo, memo, useRef } from 'react'
import { Container, Modal, Form, InputGroup, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getSpecialties } from '../../api/doctorApi'
import { useTranslation } from 'react-i18next'
import { translateMetadata } from '../../utils/translationUtils'
import {
  IconStethoscope, IconActivity, IconHeart, IconBrain,
  IconBabyCarriage, IconMicroscope, IconLungs, IconFlower,
  IconPuzzle, IconPill, IconScissors, IconEar, IconEye,
  IconBone, IconLayoutGrid, IconArrowRight, IconDental,
  IconVaccine, IconBottle, IconDroplet, IconFlame,
  IconChevronLeft, IconChevronRight, IconSearch, IconX
} from '@tabler/icons-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

// ─── Icon Map ────────────────────────────────────────────────────────────────
const SPECIALTY_ICONS = {
  cardiology: IconHeart,
  neurology: IconBrain,
  neuro: IconBrain,
  orthopedic: IconBone,
  ophthalmology: IconEye,
  eye: IconEye,
  dental: IconDental,
  dentistry: IconDental,
  pediatrics: IconBabyCarriage,
  dermatology: IconMicroscope,
  pulmonology: IconLungs,
  respiratory: IconLungs,
  chest: IconLungs,
  gynecology: IconFlower,
  obstetrics: IconFlower,
  psychiatry: IconPuzzle,
  urology: IconPill,
  gastroenterology: IconActivity,
  allergy: IconVaccine,
  immunology: IconVaccine,
  plastic: IconScissors,
  burn: IconFlame,
  diabetology: IconDroplet,
  diabetes: IconDroplet,
  endocrinology: IconDroplet,
  medicine: IconBottle,
  internal: IconStethoscope,
  surgery: IconScissors,
  ent: IconEar,
  general: IconStethoscope,
  nutrition: IconActivity,
}

// ─── Description Map ─────────────────────────────────────────────────────────
const SPECIALTY_DESC = {
  cardiology:      { bn: 'হৃদরোগের যত্নে বিশেষজ্ঞ চিকিৎসা সেবা',             en: 'Specialized care for heart diseases' },
  neurology:       { bn: 'মস্তিষ্ক ও স্নায়ু রোগের উন্নত চিকিৎসা',            en: 'Advanced brain & nerve treatment' },
  neuro:           { bn: 'মস্তিষ্ক ও স্নায়ু রোগের উন্নত চিকিৎসা',            en: 'Advanced brain & nerve treatment' },
  orthopedic:      { bn: 'হাড় ও জোড়ার সমস্যার বিশেষজ্ঞ সমাধান',              en: 'Expert bone & joint solutions' },
  ophthalmology:   { bn: 'চোখের যত্নে বিশেষজ্ঞ চিকিৎসা',                     en: 'Specialized eye care treatment' },
  dental:          { bn: 'দাঁতের যত্নে আধুনিক চিকিৎসা',                      en: 'Modern dental care treatment' },
  pediatrics:      { bn: 'শিশুদের সুস্বাস্থ্য ও যত্নে বিশেষজ্ঞ',              en: 'Expert child health & care' },
  gynecology:      { bn: 'নারীদের স্বাস্থ্য ও প্রজননতন্ত্রের যত্নে বিশেষজ্ঞ', en: "Women's reproductive health" },
  obstetrics:      { bn: 'নারীদের স্বাস্থ্য ও প্রজননতন্ত্রের যত্নে বিশেষজ্ঞ', en: "Women's reproductive health" },
  gastroenterology:{ bn: 'হজম ও পরিপাকতন্ত্রের সমস্যার বিশেষজ্ঞ সমাধান',     en: 'Digestive & gut health expert' },
  diabetology:     { bn: 'হরমোন ও ডায়াবেটিস বিশেষজ্ঞ চিকিৎসা',              en: 'Diabetes & hormone specialist' },
  endocrinology:   { bn: 'হরমোন ও ডায়াবেটিস বিশেষজ্ঞ চিকিৎসা',              en: 'Diabetes & hormone specialist' },
  pulmonology:     { bn: 'ফুসফুস ও শ্বাসতন্ত্রের রোগের বিশেষজ্ঞ চিকিৎসা',     en: 'Lung & respiratory diseases' },
  chest:           { bn: 'ফুসফুস ও শ্বাসতন্ত্রের রোগের বিশেষজ্ঞ চিকিৎসা',     en: 'Chest & breathing disorders' },
  allergy:         { bn: 'অ্যালার্জি ও রোগ প্রতিরোধ ক্ষমতার চিকিৎসা',         en: 'Allergy & immunity treatment' },
  surgery:         { bn: 'অভিজ্ঞ সার্জন ও আধুনিক চিকিৎসা সেবা',              en: 'Expert surgeons & modern care' },
  ent:             { bn: 'কান, নাক ও গলার বিশেষজ্ঞ চিকিৎসা',                 en: 'Ear, nose & throat specialist' },
  medicine:        { bn: 'প্রাথমিক ও সাধারণ স্বাস্থ্য সমস্যার সমাধান',         en: 'Primary & general health care' },
  nutrition:       { bn: 'পুষ্টি ও স্বাস্থ্যকর খাদ্যাভ্যাস গড়ার পথপ্রদর্শক',  en: 'Nutrition & healthy diet guidance' },
  general:         { bn: 'সাধারণ স্বাস্থ্য সমস্যা ও প্রাথমিক চিকিৎসা',        en: 'General health & primary care' },
  burn:            { bn: 'পোড়া ও প্লাস্টিক সার্জারি বিশেষজ্ঞ সেবা',           en: 'Burn & plastic surgery care' },
  plastic:         { bn: 'পোড়া ও প্লাস্টিক সার্জারি বিশেষজ্ঞ সেবা',           en: 'Burn & plastic surgery care' },
}

// ─── Image Map ───────────────────────────────────────────────────────────────
const SPECIALTY_IMAGES = {
  cardiology:       'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=70',
  neurology:        'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=70',
  neuro:            'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=70',
  orthopedic:       'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop&q=70',
  ophthalmology:    'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=600&auto=format&fit=crop&q=70',
  eye:              'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=600&auto=format&fit=crop&q=70',
  dental:           'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&auto=format&fit=crop&q=70',
  dentistry:        'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&auto=format&fit=crop&q=70',
  pediatrics:       'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600&auto=format&fit=crop&q=70',
  dermatology:      'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&auto=format&fit=crop&q=70',
  pulmonology:      'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=600&auto=format&fit=crop&q=70',
  respiratory:      'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=600&auto=format&fit=crop&q=70',
  chest:            'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=600&auto=format&fit=crop&q=70',
  gynecology:       'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=70',
  obstetrics:       'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=70',
  psychiatry:       'https://images.unsplash.com/photo-1527137341206-1a2ab8144b56?w=600&auto=format&fit=crop&q=70',
  urology:          'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=70',
  gastroenterology: 'https://images.unsplash.com/photo-1579684389823-38c29b8c8d84?w=600&auto=format&fit=crop&q=70',
  allergy:          'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop&q=70',
  immunology:       'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop&q=70',
  plastic:          'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&auto=format&fit=crop&q=70',
  burn:             'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&auto=format&fit=crop&q=70',
  diabetology:      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=70',
  diabetes:         'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=70',
  endocrinology:    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=70',
  nutrition:        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=70',
  diet:             'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=70',
  medicine:         'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&auto=format&fit=crop&q=70',
  surgery:          'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&auto=format&fit=crop&q=70',
  ent:              'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=70',
  general:          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=70',
  internal:         'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=70',
}

const SPECIALTY_COUNTS = {
  diagnostic: '1200+', cardiology: '850+', dental: '400+',
  pediatrics: '600+',  ophthalmology: '300+', surgery: '250+'
}

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=70'

function getImage(name = '') {
  const key = name.toLowerCase()
  for (const [k, url] of Object.entries(SPECIALTY_IMAGES)) {
    if (key.includes(k)) return url
  }
  return DEFAULT_IMG
}

function getIcon(name = '', size = 22) {
  const key = name.toLowerCase()
  for (const [k, IconComp] of Object.entries(SPECIALTY_ICONS)) {
    if (key.includes(k)) return <IconComp size={size} stroke={1.5} />
  }
  return <IconStethoscope size={size} stroke={1.5} />
}

function getDesc(name = '', lang = 'en') {
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(SPECIALTY_DESC)) {
    if (key.includes(k)) return v[lang]
  }
  return lang === 'bn' ? 'বিশেষজ্ঞ চিকিৎসা ও উন্নত সেবা' : 'Expert medical care & advanced service'
}

function getCount(name = '') {
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(SPECIALTY_COUNTS)) {
    if (key.includes(k)) return v
  }
  return '100+'
}

// ─── Specialty Card ───────────────────────────────────────────────────────────
function SpecCard({ spec, language, t, navigate }) {
  return (
    <div
      onClick={() => navigate(`/doctors?specialty_id=${spec.id}`)}
      className="tss-card"
      style={{
        background: 'white',
        borderRadius: 7,
        padding: 0,
        border: '1px solid #E2E8F0',
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      {/* Banner Image */}
      <div style={{ height: 80, position: 'relative', overflow: 'hidden', background: '#F1F5F9', flexShrink: 0 }}>
        <img
          src={getImage(spec.name)}
          alt={spec.name}
          className="tss-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(15,23,42,0.25) 100%)' }} />
        {/* Glassmorphic icon */}
        <div
          className="tss-icon"
          style={{
            position: 'absolute', bottom: 6, left: 10,
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)',
            color: '#00A88C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            transition: 'all 0.3s ease',
          }}
        >
          {getIcon(spec.name, 16)}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '12px 12px 10px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 4, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {translateMetadata(spec.name, language, t)}
        </h4>
        <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.3, marginBottom: 8, fontWeight: 500, flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {getDesc(spec.name, language)}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#00A88C' }}>{getCount(spec.name)}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', marginLeft: 4 }}>
              {language === 'bn' ? 'ডাক্তার' : 'Doctors'}
            </span>
          </div>
          <div
            className="tss-arrow"
            style={{
              width: 20, height: 20, borderRadius: '50%',
              background: '#F8FAFC', color: '#64748B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <IconArrowRight size={12} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ height: 160, borderRadius: 7, background: '#F8FAFC', border: '1px solid #E2E8F0' }} className="placeholder-glow">
      <span className="placeholder col-12 h-100" style={{ borderRadius: 7 }} />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const TopSpecialtiesSlider = memo(function TopSpecialtiesSlider({ specialties: propSpecialties, loading: propLoading }) {
  const [fallbackSpecialties, setFallbackSpecialties] = useState([])
  const [fallbackLoading, setFallbackLoading]         = useState(propSpecialties === undefined)
  const [showModal, setShowModal]                     = useState(false)
  const [searchQuery, setSearchQuery]                 = useState('')
  const navigate   = useNavigate()
  const { t, i18n } = useTranslation()
  const language   = i18n.language
  
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  // Fallback fetch only when no props provided
  useEffect(() => {
    if (propSpecialties !== undefined) return
    getSpecialties()
      .then(res => setFallbackSpecialties(res.data?.data || res.data || []))
      .catch(() => setFallbackSpecialties([]))
      .finally(() => setFallbackLoading(false))
  }, [propSpecialties])

  const allSpecialties = propSpecialties !== undefined ? propSpecialties : fallbackSpecialties
  const loading        = propLoading     !== undefined ? propLoading     : fallbackLoading

  const displayed = useMemo(() => allSpecialties.slice(0, 6), [allSpecialties])

  const filteredSpecialties = useMemo(() => {
    if (!searchQuery) return allSpecialties
    const lowerQ = searchQuery.toLowerCase()
    return allSpecialties.filter(s => {
      const bnName = translateMetadata(s.name, 'bn', t).toLowerCase()
      const enName = translateMetadata(s.name, 'en', t).toLowerCase()
      return bnName.includes(lowerQ) || enName.includes(lowerQ)
    })
  }, [allSpecialties, searchQuery, t])

  if (!loading && allSpecialties.length === 0) return null

  return (
    <section
      id="tss-section"
      style={{ padding: '20px 0', background: 'white', borderTop: '1px solid rgba(226,232,240,0.6)' }}
    >
      <Container>
        {/* ── Section Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#E0F2FE', color: '#0369A1',
              fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 99, marginBottom: 14,
            }}>
              <IconStethoscope size={16} stroke={2.5} />
              <span>SPECIALTIES / বিশেষজ্ঞ সেবা</span>
            </div>
          </div>
        </div>
 
         {/* ── Slider ── */}
         <div style={{ position: 'relative' }}>
           {loading ? (
             <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
               {[...Array(6)].map((_, i) => (
                 <div key={i} style={{ flex: '0 0 calc(16.666% - 14px)' }}>
                   <SkeletonCard />
                 </div>
               ))}
             </div>
           ) : (
             <Swiper
               modules={[Autoplay]}
               spaceBetween={16}
               slidesPerView={2.3}
               autoplay={{ delay: 3000, disableOnInteraction: false }}
               loop={false}
               breakpoints={{
                 480: { slidesPerView: 3 },
                 768: { slidesPerView: 4 },
                 1024: { slidesPerView: 5 },
                 1200: { slidesPerView: 6 },
               }}
               style={{ padding: '10px 0' }}
             >
              {displayed.map(spec => (
                <SwiperSlide key={spec.id} style={{ height: 'auto' }}>
                  <SpecCard spec={spec} language={language} t={t} navigate={navigate} />
                </SwiperSlide>
              ))}

              {allSpecialties.length > 6 && (
                <SwiperSlide style={{ height: 'auto' }}>
                  <div
                    onClick={() => setShowModal(true)}
                    className="tss-show-all-card"
                    style={{
                      background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                      borderRadius: 7,
                      border: '2px dashed #00A88C',
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '24px 16px',
                    }}
                  >
                    <div style={{
                      width: 50, height: 50, borderRadius: '50%',
                      background: '#00A88C', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 12,
                      boxShadow: '0 4px 12px rgba(0,168,140,0.25)',
                    }}>
                      <IconLayoutGrid size={24} stroke={1.5} />
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                      {language === 'bn' ? 'সব বিভাগ দেখুন' : 'View All'}
                    </h4>
                    <p style={{ fontSize: 12, color: '#475569', margin: 0, fontWeight: 500 }}>
                      {language === 'bn'
                        ? `আরও ${allSpecialties.length - 6}টি বিভাগ`
                        : `${allSpecialties.length - 6} more specialties`}
                    </p>
                  </div>
                </SwiperSlide>
              )}
            </Swiper>
          )}
        </div>
      </Container>

      {/* ── All Specialties Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered scrollable>
        <Modal.Header style={{ borderBottom: '1px solid #E2E8F0', padding: '20px 24px' }}>
          <Modal.Title style={{ fontWeight: 800, fontSize: 20, color: '#0F172A' }}>
            {language === 'bn' ? 'সব বিশেষজ্ঞ সেবাসমূহ' : 'All Specialties'}
            <span style={{ fontSize: 14, color: '#64748B', marginLeft: 8, fontWeight: 600 }}>
              ({allSpecialties.length})
            </span>
          </Modal.Title>
          <button
            onClick={() => setShowModal(false)}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
          >
            <IconX size={24} />
          </button>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, background: '#F8FAFC' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F8FAFC', padding: '24px 24px 12px 24px', borderBottom: '1px solid rgba(226,232,240,0.5)' }}>
            <InputGroup style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 12, overflow: 'hidden' }}>
              <InputGroup.Text style={{ background: 'white', border: '1px solid #E2E8F0', borderRight: 'none', paddingLeft: 16 }}>
                <IconSearch size={18} color="#94A3B8" />
              </InputGroup.Text>
              <Form.Control
                placeholder={language === 'bn' ? 'বিভাগ খুঁজুন...' : 'Search specialties...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: '1px solid #E2E8F0', borderLeft: 'none', boxShadow: 'none', padding: '12px 16px', fontSize: 15 }}
              />
            </InputGroup>
          </div>

          <div style={{ padding: '16px 24px 40px 24px', overflowX: 'hidden' }}>
            <Row className="g-3">
              {filteredSpecialties.length > 0 ? (
                filteredSpecialties.map(spec => (
                  <Col xs={6} sm={6} md={4} key={spec.id}>
                    <div style={{ height: '100%' }} onClick={() => setShowModal(false)}>
                      <SpecCard spec={spec} language={language} t={t} navigate={navigate} />
                    </div>
                  </Col>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B', width: '100%' }}>
                  {language === 'bn' ? 'কোনো বিভাগ পাওয়া যায়নি' : 'No specialties found'}
                </div>
              )}
            </Row>
          </div>
        </Modal.Body>
      </Modal>

      {/* ── CSS ── */}
      <style>{`
        .tss-nav-btn:hover {
          background: #00A88C !important;
          border-color: #00A88C !important;
          color: white !important;
        }
        .tss-card:hover {
          border-color: #00A88C !important;
          box-shadow: 0 8px 24px rgba(0,168,140,0.08) !important;
          transform: translateY(-4px);
        }
        .tss-card:hover .tss-img {
          transform: scale(1.07);
        }
        .tss-card:hover .tss-icon {
          background: #00A88C !important;
          color: white !important;
          transform: scale(1.08) rotate(-8deg);
        }
        .tss-card:hover .tss-arrow {
          background: #00A88C !important;
          color: white !important;
        }
        .tss-show-all-card:hover {
          background: #DCFCE7 !important;
          border-style: solid !important;
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,168,140,0.1) !important;
        }
      `}</style>
    </section>
  )
})

export default TopSpecialtiesSlider

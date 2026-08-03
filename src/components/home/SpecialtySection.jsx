import React, { useEffect, useState, useMemo } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getSpecialties } from '../../api/doctorApi'
import { useTranslation } from 'react-i18next'
import { translateMetadata } from '../../utils/translationUtils'
import {
  IconStethoscope, IconActivity, IconHeart, IconBrain,
  IconBabyCarriage, IconMicroscope, IconLungs, IconFlower,
  IconPuzzle, IconPill, IconScissors, IconEar, IconEye,
  IconBone, IconLayoutGrid, IconSearch,
  IconVaccine, IconBottle, IconDroplet, IconFlame,
  IconArrowRight, IconDental
} from '@tabler/icons-react'

const SPECIALTY_ICONS = {
  cardiology: IconHeart,
  neurology: IconBrain,
  orthopedic: IconBone,
  ophthalmology: IconEye,
  dental: IconDental,
  dentistry: IconDental,
  pediatrics: IconBabyCarriage,
  dermatology: IconMicroscope,
  pulmonology: IconLungs,
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
  endocrinology: IconDroplet,
  medicine: IconBottle,
  surgery: IconScissors,
  ent: IconEar,
  general: IconStethoscope,
}

const SPECIALTY_DESC = {
  cardiology: { bn: "হৃদরোগের যত্নে বিশেষজ্ঞ চিকিৎসা সেবা", en: "Specialized medical care for heart diseases" },
  neurology: { bn: "মস্তিষ্ক ও স্নায়ু রোগের উন্নত চিকিৎসা", en: "Advanced treatment for brain & nerve diseases" },
  orthopedic: { bn: "হাড় ও জোড়ার সমস্যার বিশেষজ্ঞ সমাধান", en: "Expert solution for bone & joint problems" },
  ophthalmology: { bn: "চোখের যত্নে বিশেষজ্ঞ চিকিৎসা", en: "Specialized treatment for eye care" },
  dental: { bn: "দাঁতের যত্নে আধুনিক চিকিৎসা", en: "Modern treatment for dental care" },
  dentistry: { bn: "দাঁতের যত্নে আধুনিক চিকিৎসা", en: "Modern treatment for dental care" },
  pediatrics: { bn: "মা ও শিশুর সুস্বাস্থ্যতায় বিশেষজ্ঞ", en: "Specialist in mother & child health" },
  surgery: { bn: "অভিজ্ঞ সার্জন ও আধুনিক চিকিৎসা সেবা", en: "Experienced surgeons & modern medical care" },
  general: { bn: "সাধারণ স্বাস্থ্য সমস্যা ও প্রাথমিক চিকিৎসা", en: "General health problems & primary care" },
  diagnostic: { bn: "বিভিন্ন পরীক্ষা-নিরীক্ষা ও ল্যাব সেবা", en: "Various tests and lab services" }
}

const SPECIALTY_COUNTS = {
  diagnostic: "1200+",
  cardiology: "850+",
  dental: "400+",
  pediatrics: "600+",
  ophthalmology: "300+",
  surgery: "250+"
}

const SPECIALTY_IMAGES = {
  cardiology: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=60",
  neurology: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=60",
  neuro: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=60",
  orthopedic: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop&q=60",
  ophthalmology: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=600&auto=format&fit=crop&q=60",
  eye: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=600&auto=format&fit=crop&q=60",
  dental: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&auto=format&fit=crop&q=60",
  dentistry: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&auto=format&fit=crop&q=60",
  pediatrics: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600&auto=format&fit=crop&q=60",
  dermatology: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&auto=format&fit=crop&q=60",
  pulmonology: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=600&auto=format&fit=crop&q=60",
  chest: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=600&auto=format&fit=crop&q=60",
  gynecology: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=60",
  obstetrics: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=60",
  psychiatry: "https://images.unsplash.com/photo-1527137341206-1a2ab8144b56?w=600&auto=format&fit=crop&q=60",
  urology: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=60",
  gastroenterology: "https://images.unsplash.com/photo-1579684389823-38c29b8c8d84?w=600&auto=format&fit=crop&q=60",
  allergy: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop&q=60",
  immunology: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop&q=60",
  plastic: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&auto=format&fit=crop&q=60",
  burn: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&auto=format&fit=crop&q=60",
  diabetology: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=60",
  endocrinology: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=60",
  nutrition: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60",
  nutritionist: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60",
  diet: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60",
  medicine: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=60",
  মেডিসিন: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=60",
  surgery: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&auto=format&fit=crop&q=60",
  ent: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=60",
  general: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=60",
}

function getImage(name = '') {
  const key = name.toLowerCase()
  for (const [k, url] of Object.entries(SPECIALTY_IMAGES)) {
    if (key.includes(k)) return url
  }
  return "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=60"
}

function getIcon(name = '', size = 32) {
  const key = name.toLowerCase()
  for (const [k, IconComp] of Object.entries(SPECIALTY_ICONS)) {
    if (key.includes(k)) return <IconComp size={size} stroke={1.5} />
  }
  return <IconStethoscope size={size} />
}

function getDesc(name = '', lang = 'en') {
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(SPECIALTY_DESC)) {
    if (key.includes(k)) return v[lang]
  }
  return lang === 'bn' ? "বিশেষজ্ঞ চিকিৎসা ও উন্নত সেবা" : "Expert medical care and advanced service."
}

function getCount(name = '') {
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(SPECIALTY_COUNTS)) {
    if (key.includes(k)) return v
  }
  return "100+"
}

function SpecialtySection() {
  const [allSpecialties, setAllSpecialties] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const language = i18n.language

  useEffect(() => {
    getSpecialties()
      .then((res) => {
        const data = res.data?.data || res.data || []
        setAllSpecialties(data)
      })
      .catch(() => setAllSpecialties([]))
      .finally(() => setLoading(false))
  }, [])

  const specialties = useMemo(() => {
    if (showAll) {
      return allSpecialties
    }
    return allSpecialties.slice(0, 6)
  }, [allSpecialties, showAll])

  return (
    <section id="specialty-section" style={{ padding: '80px 0', background: 'white' }}>
      <Container>
        <div className="d-flex justify-content-between align-items-end mb-5">
          <div>
            <h2 style={{ 
              fontWeight: 900, 
              fontSize: 'clamp(28px, 3vw, 36px)', 
              color: 'var(--mc-text)',
              marginBottom: 8,
              fontFamily: language === 'bn' ? "'Hind Siliguri', sans-serif" : 'inherit'
            }}>
              {language === 'bn' ? 'জনপ্রিয় সেবা সমূহ' : 'Popular Services'}
            </h2>
            <div style={{ width: 60, height: 4, background: '#00A88C', borderRadius: 2 }} />
          </div>
          <button 
            onClick={() => navigate('/doctors')}
            style={{
              background: 'none', border: 'none', color: '#00A88C', 
              fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8,
              padding: 0, cursor: 'pointer'
            }}
          >
            {language === 'bn' ? 'সব সেবা দেখুন' : 'See all services'} <IconArrowRight size={20} />
          </button>
        </div>

        <Row className="g-4">
          {loading ? (
             [...Array(6)].map((_, i) => (
              <Col key={i} xs={12} sm={6} lg={4}>
                <div style={{ height: 380, borderRadius: 24, background: '#F8FAFC', border: '1px solid var(--mc-border)' }} className="placeholder-glow">
                  <span className="placeholder col-12 h-100" style={{ borderRadius: 24 }}></span>
                </div>
              </Col>
            ))
          ) : (
            <>
              {specialties.map((spec) => (
                <Col key={spec.id} xs={12} sm={6} lg={4}>
                  <div 
                    onClick={() => navigate(`/doctors?specialty_id=${spec.id}`)}
                    style={{
                      background: 'white',
                      borderRadius: 24,
                      padding: '24px',
                      border: '1px solid #E2E8F0',
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    className="specialty-card"
                  >
                    {/* Specialty Banner Image */}
                    <div style={{
                      height: '160px',
                      width: '100%',
                      position: 'relative',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      marginBottom: '20px',
                      background: '#F1F5F9'
                    }}>
                      <img 
                        src={getImage(spec.name)} 
                        alt={spec.name} 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease'
                        }} 
                        className="specialty-img"
                      />
                      {/* Floating Glassmorphic Icon */}
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        color: '#00A88C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s'
                      }} className="icon-box">
                        {getIcon(spec.name, 24)}
                      </div>
                    </div>

                    <h4 style={{ 
                      fontSize: 19, fontWeight: 800, color: 'var(--mc-text)', 
                      marginBottom: 12, transition: '0.3s' 
                    }}>
                      {translateMetadata(spec.name, language, t)}
                    </h4>

                    <p style={{ 
                      fontSize: 14, color: '#64748B', lineHeight: 1.6, 
                      marginBottom: 24, fontWeight: 500,
                      flexGrow: 1
                    }}>
                      {getDesc(spec.name, language)}
                    </p>

                    <div className="d-flex justify-content-between align-items-center mt-auto" style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#00A88C' }}>{getCount(spec.name)}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', marginLeft: 8 }}>
                          {language === 'bn' ? (
                             spec.name.toLowerCase().includes('diagnostic') ? 'ডায়াগনস্টিক সেন্টার' : 
                             spec.name.toLowerCase().includes('dental') ? 'ডেন্টাল ক্লিনিক' :
                             spec.name.toLowerCase().includes('surgery') ? 'হাসপাতাল' : 'বিশেষজ্ঞ ডাক্তার'
                          ) : (
                             spec.name.toLowerCase().includes('diagnostic') ? 'Diagnostic Centers' : 
                             spec.name.toLowerCase().includes('dental') ? 'Dental Clinics' :
                             spec.name.toLowerCase().includes('surgery') ? 'Hospitals' : 'Specialist Doctors'
                          )}
                        </span>
                      </div>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: '50%', 
                        background: '#F8FAFC', color: '#64748B',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: '0.3s'
                      }} className="arrow-box">
                        <IconArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </Col>
              ))}

              {/* Show All Card */}
              {!showAll && allSpecialties.length > 6 && (
                <Col xs={12} sm={6} lg={4}>
                  <div 
                    onClick={() => setShowAll(true)}
                    style={{
                      background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                      borderRadius: 24,
                      padding: '32px',
                      border: '2px dashed #00A88C',
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      minHeight: '380px'
                    }}
                    className="show-all-card"
                  >
                    <div style={{ 
                      width: 72, height: 72, borderRadius: '50%', 
                      background: '#00A88C', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 20, transition: 'all 0.3s',
                      boxShadow: '0 8px 16px rgba(0, 168, 140, 0.2)'
                    }} className="show-all-icon-box">
                      <IconLayoutGrid size={36} stroke={1.5} />
                    </div>
                    
                    <h4 style={{ 
                      fontSize: 20, fontWeight: 800, color: 'var(--mc-text)', 
                      marginBottom: 8,
                      fontFamily: language === 'bn' ? "'Hind Siliguri', sans-serif" : 'inherit'
                    }}>
                      {language === 'bn' ? 'সব সেবা ও বিভাগ' : 'All Specialties'}
                    </h4>
                    
                    <p style={{ 
                      fontSize: 14, color: '#475569', lineHeight: 1.5, 
                      marginBottom: 0, fontWeight: 500 
                    }}>
                      {language === 'bn' ? 'আমাদের সব বিভাগের চিকিৎসকদের দেখতে এখানে ক্লিক করুন' : 'Click here to view all departments and specialist doctors'}
                    </p>
                    
                    <div className="d-flex align-items-center gap-2 mt-4" style={{ color: '#00A88C', fontWeight: 700, fontSize: 15 }}>
                      <span>{language === 'bn' ? 'সব বিভাগ দেখুন' : 'View All'}</span>
                      <IconArrowRight size={18} />
                    </div>
                  </div>
                </Col>
              )}
            </>
          )}
        </Row>

        {/* Show Less Collapsing Button */}
        {showAll && (
          <div className="text-center mt-5">
            <button
              onClick={() => {
                setShowAll(false)
                document.getElementById('specialty-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                background: '#F0FDF4',
                color: '#00A88C',
                border: '1px solid #00A88C',
                borderRadius: '50px',
                padding: '12px 32px',
                fontWeight: 700,
                fontSize: '15px',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              className="show-less-btn"
            >
              {language === 'bn' ? 'সংক্ষেপ করুন' : 'Show Less'}
            </button>
          </div>
        )}
      </Container>

      <style>{`
        .specialty-card:hover {
          border-color: #00A88C !important;
          box-shadow: 0 20px 40px rgba(0, 168, 140, 0.08);
          transform: translateY(-8px);
        }
        .specialty-card:hover .specialty-img {
          transform: scale(1.05);
        }
        .specialty-card:hover .icon-box {
          background: #00A88C !important;
          color: white !important;
        }
        .specialty-card:hover .arrow-box {
          background: #00A88C !important;
          color: white !important;
        }
        .show-all-card:hover {
          border-style: solid !important;
          box-shadow: 0 20px 40px rgba(0, 168, 140, 0.08);
          transform: translateY(-8px);
        }
        .show-all-card:hover .show-all-icon-box {
          transform: scale(1.1) rotate(90deg);
        }
        .show-less-btn:hover {
          background: #00A88C !important;
          color: white !important;
          box-shadow: 0 8px 16px rgba(0, 168, 140, 0.15);
        }
      `}</style>
    </section>
  )
}

export default SpecialtySection

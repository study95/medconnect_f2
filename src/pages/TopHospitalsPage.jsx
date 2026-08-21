import { useState, useMemo } from 'react'
import { getMediaUrl } from '../utils/mediaUtils'
import { getHospitalUrl } from '../utils/identifierHelper'
import { Container, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import useHospitals from '../hooks/useHospitals'
import useDistricts from '../hooks/useDistricts'
import { HospitalGridSkeleton } from '../components/common/Skeletons'
import ErrorState from '../components/common/ErrorState'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import { useTranslation } from 'react-i18next'
import { translateMetadata } from '../utils/translationUtils'

const FALLBACK_COLORS = [
  'linear-gradient(135deg,#00A88C,#008a74)',
  'linear-gradient(135deg,#00C9A7,#008a74)',
  'linear-gradient(135deg,#7C3AED,#5B21B6)',
  'linear-gradient(135deg,#DB2777,#9D174D)',
  'linear-gradient(135deg,#D97706,#B45309)',
  'linear-gradient(135deg,#059669,#047857)'
]

function TopHospitalsPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const language = i18n.language

  const [districtId, setDistrictId] = useState('')

  // TanStack Query — cached 30min, shared across pages
  const { districts } = useDistricts()

  // TanStack Query — cached by district filter, instant on back-nav
  const queryParams = useMemo(() => ({
    top_10: true,
    district_id: districtId,
    per_page: 6,
  }), [districtId])

  const { hospitals, loading, error, refresh } = useHospitals(queryParams)

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC' }}>
      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', 
        padding: '60px 0', 
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, background: 'rgba(255,255,255,0.1)', borderRadius: '40%' }} />
        <div style={{ position: 'absolute', bottom: -20, right: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

        <Container>
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 30 }}>
            <BreadcrumbHUD 
              links={[{ label: t('hospitals'), url: '/hospitals' }, { label: 'Top 10 Hospitals' }]} 
              light={true} 
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: 50, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              🏥 Clinical Excellence
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, marginBottom: 16, textShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>{t('top_10_hospitals') || 'Top 10 Hospitals'}</h1>
            <p style={{ fontSize: 20, opacity: 0.9, maxWidth: 650, margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>
              {t('top_hospitals_desc') || 'Discover the most advanced healthcare facilities equipped with state-of-the-art technology and expert medical staff.'}
            </p>
          </div>
        </Container>
      </div>

      {/* District Filter Bar - Glassmorphism Sticky */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #E2E8F0', 
        padding: '16px 0', 
        position: 'sticky', 
        top: 80, 
        zIndex: 100,
        boxShadow: '0 4px 30px rgba(0,0,0,0.03)'
      }}>
        <Container>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: '#F0F9FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <span style={{ fontWeight: 800, color: '#475569', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Location:</span>
            </div>
            
            <div style={{ position: 'relative' }}>
              <select 
                value={districtId} 
                onChange={(e) => setDistrictId(e.target.value)}
                style={{ 
                  padding: '12px 40px 12px 24px', 
                  borderRadius: 14, 
                  border: districtId ? '2px solid #0284C7' : '2px solid #E2E8F0', 
                  fontWeight: 700, 
                  color: districtId ? '#0284C7' : '#1E293B',
                  minWidth: 260,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  background: 'white',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: districtId ? '0 0 0 4px rgba(2, 132, 199, 0.1)' : 'none'
                }}
              >
                <option value="">National (All Districts)</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: districtId ? '#0284C7' : '#94A3B8' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>

            {districtId && (
              <button 
                onClick={() => setDistrictId('')}
                style={{ 
                  background: '#F1F5F9', 
                  border: 'none', 
                  borderRadius: 10, 
                  padding: '10px 20px', 
                  fontSize: 13, 
                  fontWeight: 700, 
                  color: '#64748B',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#E2E8F0'}
                onMouseOut={(e) => e.currentTarget.style.background = '#F1F5F9'}
              >
                Reset Filter
              </button>
            )}
          </div>
        </Container>
      </div>

      <Container style={{ paddingTop: 60, paddingBottom: 80 }}>
        {loading && <HospitalGridSkeleton count={6} />}

        {error && !loading && (
          <ErrorState
            title="সেরা হাসপাতালের তালিকা লোড করা যায়নি"
            message={error}
            onRetry={refresh}
            retryText={t('try_again') || 'আবার চেষ্টা করুন'}
            onSecondary={() => setDistrictId('')}
            secondaryText="ফিল্টার রিসেট করুন"
          />
        )}

        {!loading && !error && hospitals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 20 }}>🏥</div>
            <h3 style={{ fontWeight: 800, color: '#1E293B' }}>{t('no_top_hospitals_yet') || 'No top hospitals found'}</h3>
            <p style={{ color: '#64748B' }}>We are currently vetting and curating our list of top medical facilities.</p>
            <button onClick={() => navigate('/hospitals')} style={{ background: '#0284C7', color: 'white', border: 'none', borderRadius: 10, padding: '12px 30px', marginTop: 20, fontWeight: 600 }}>Explore All Hospitals</button>
          </div>
        )}

        {!loading && hospitals.length > 0 && (
          <Row className="g-4">
            {hospitals.map((h, i) => (
              <Col md={6} lg={4} key={h.id}>
                <div
                  onClick={() => navigate(getHospitalUrl(h))}
                  style={{
                    background: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: 20,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    height: '100%',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Rank Badge */}
                  <div style={{ 
                    position: 'absolute', top: 15, left: 15, zIndex: 5,
                    background: 'white', color: '#0369A1', fontWeight: 800,
                    padding: '4px 10px', borderRadius: 8, fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    #{i + 1} Best
                  </div>

                  <div style={{ height: 200, position: 'relative' }}>
                    <img
                      src={getMediaUrl(h.photo_url) || '/images/hospitals/hospital-1.jpg'}
                      alt={h.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                    <div style={{ display: 'none', height: '100%', background: FALLBACK_COLORS[i % FALLBACK_COLORS.length], alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🏥</div>
                  </div>

                  <div style={{ padding: 24 }}>
                    <h5 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 10, fontSize: 20 }}>{h.name}</h5>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'start', fontSize: 14, color: '#64748B', marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>📍</span>
                      <span>{translateMetadata(h.district?.name, language, t) || 'Local'}, {h.address}</span>
                    </div>
                    {h.phone && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: '#64748B' }}>
                        <span style={{ fontSize: 18 }}>📞</span>
                        <span>{h.phone}</span>
                      </div>
                    )}
                    
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: 12, fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Facility</span>
                       <span style={{ color: '#0284C7', fontWeight: 700 }}>View Details →</span>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  )
}

export default TopHospitalsPage

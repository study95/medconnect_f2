import { useState, useCallback, useMemo } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import DoctorCard from '../components/common/DoctorCard'
import ErrorState from '../components/common/ErrorState'
import { DoctorGridSkeleton } from '../components/common/Skeletons'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import { useTranslation } from 'react-i18next'
import useDoctors from '../hooks/useDoctors'
import useDistricts from '../hooks/useDistricts'

function TopDoctorsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [districtId, setDistrictId] = useState('')

  // TanStack Query — cached 30min, shared across pages
  const { districts } = useDistricts()

  // Force top_10: true + district filter
  const doctorsParams = useMemo(() => ({
    top_10: true,
    district_id: districtId,
    page,
    per_page: 6
  }), [page, districtId])

  const { doctors, loading, error, pagination, refresh } = useDoctors(doctorsParams)

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC' }}>
      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #00A88C 0%, #008a74 100%)', 
        padding: '60px 0', 
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background decoration */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        
        <Container>
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 30 }}>
            <BreadcrumbHUD links={[{ label: t('doctors'), url: '/doctors' }, { label: 'Top 10 Doctors' }]} light={true} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: 50, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              🏆 Curated Excellence
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, marginBottom: 16, textShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>{t('top_10_doctors') || 'Top 10 Doctors'}</h1>
            <p style={{ fontSize: 20, opacity: 0.9, maxWidth: 650, margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>
              {t('top_doctors_desc') || 'Discover the highest-rated medical specialists across the nation, recognized for clinical expertise and patient trust.'}
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
              <div style={{ width: 36, height: 36, background: '#F1F5F9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <span style={{ fontWeight: 800, color: '#475569', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Location:</span>
            </div>
            
            <div style={{ position: 'relative' }}>
              <select 
                value={districtId} 
                onChange={(e) => { setDistrictId(e.target.value); setPage(1); }}
                style={{ 
                  padding: '12px 40px 12px 24px', 
                  borderRadius: 14, 
                  border: districtId ? '2px solid #00A88C' : '2px solid #E2E8F0', 
                  fontWeight: 700, 
                  color: districtId ? '#00A88C' : '#1E293B',
                  minWidth: 260,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  background: 'white',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: districtId ? '0 0 0 4px rgba(0, 168, 140, 0.1)' : 'none'
                }}
              >
                <option value="">National (All Districts)</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: districtId ? '#00A88C' : '#94A3B8' }}>
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
        {loading && <DoctorGridSkeleton count={6} />}

        {error && !loading && (
          <ErrorState
            title="সেরা ডাক্তারদের তালিকা লোড করা যায়নি"
            message={error}
            onRetry={refresh}
            retryText={t('try_again') || 'আবার চেষ্টা করুন'}
            onSecondary={() => setDistrictId('')}
            secondaryText="ফিল্টার রিসেট করুন"
          />
        )}

        {!loading && !error && doctors.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 20 }}>👨‍⚕️</div>
            <h3 style={{ fontWeight: 800, color: '#1E293B' }}>{t('no_top_doctors_yet') || 'No top doctors found'}</h3>
            <p style={{ color: '#64748B' }}>Check back soon as we curate our list of top professionals.</p>
            <button onClick={() => navigate('/doctors')} style={{ background: '#00A88C', color: 'white', border: 'none', borderRadius: 10, padding: '12px 30px', marginTop: 20, fontWeight: 600 }}>Browse All Doctors</button>
          </div>
        )}

        {!loading && doctors.length > 0 && (
          <Row className="g-4">
            {doctors.map((doctor, index) => (
              <Col key={doctor.id} xs={12} lg={6}>
                <div style={{ position: 'relative' }}>
                   {/* Rank Badge */}
                   <div style={{ 
                     position: 'absolute', 
                     top: 10, 
                     left: 10, 
                     zIndex: 10, 
                     background: '#FEF3C7', 
                     color: '#92400E', 
                     fontWeight: 900, 
                     padding: '4px 12px', 
                     borderRadius: 8, 
                     fontSize: 14,
                     boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                   }}>
                     RANK #{index + 1}
                   </div>
                   <DoctorCard doctor={doctor} showBookingButton={true} />
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  )
}

export default TopDoctorsPage

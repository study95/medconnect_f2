import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import { 
  IconStethoscope, 
  IconBuildingHospital, 
  IconArrowLeft, 
  IconRotateClockwise, 
  IconSearch, 
  IconHome, 
  IconShieldCheck
} from '@tabler/icons-react'

/**
 * NotFoundEntityState - Enterprise-grade, empathetic, beautiful 404/Not Found state
 * for Doctor and Hospital public profile pages.
 */
export default function NotFoundEntityState({
  type = 'doctor',
  title,
  message,
  onRetry,
}) {
  const navigate = useNavigate()
  const isDoctor = type === 'doctor'

  // Default localized texts (ensures no raw translation keys leak)
  let heading = title
  if (!heading || heading === 'doctor_not_found' || heading === 'hospital_not_found') {
    heading = isDoctor ? 'ডাক্তার পাওয়া যায়নি' : 'হাসপাতাল পাওয়া যায়নি'
  }
  const description = message || (isDoctor
    ? 'অনুরোধকৃত ডাক্তারের প্রোফাইলটি বর্তমানে সক্রিয় নেই অথবা লিংকটি পরিবর্তিত হয়েছে।'
    : 'অনুরোধকৃত হাসপাতালের প্রোফাইলটি বর্তমানে সক্রিয় নেই অথবা লিংকটি পরিবর্তিত হয়েছে।')

  const browsePath = isDoctor ? '/doctors' : '/hospitals'
  const browseLabel = isDoctor ? 'সকল ডাক্তার তালিকা দেখুন' : 'সকল হাসপাতাল তালিকা দেখুন'
  const searchPlaceholder = isDoctor ? 'অন্য কোনো ডাক্তার খুঁজুন...' : 'অন্য কোনো হাসপাতাল খুঁজুন...'

  const [searchTerm, setSearchTerm] = React.useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    navigate(`${browsePath}?search=${encodeURIComponent(searchTerm.trim())}`)
  }

  return (
    <div 
      className="not-found-entity-wrapper"
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px 80px',
        position: 'relative',
        background: 'radial-gradient(circle at 50% 15%, rgba(0, 168, 140, 0.05) 0%, transparent 60%), #F8FAFB',
        fontFamily: "'Hind Siliguri', sans-serif"
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} md={10} xs={12}>
            {/* Top Back Navigation Pill */}
            <div className="d-flex justify-content-center mb-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 18px',
                  borderRadius: 99,
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00A88C'
                  e.currentTarget.style.color = '#00A88C'
                  e.currentTarget.style.transform = 'translateX(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0'
                  e.currentTarget.style.color = '#475569'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <IconArrowLeft size={16} />
                <span>পূর্বের পেজে ফিরে যান</span>
              </button>
            </div>

            {/* Main Interactive Card */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 28,
                border: '1px solid #E5EAF0',
                padding: '44px 32px',
                textAlign: 'center',
                boxShadow: '0 12px 40px -8px rgba(0, 168, 140, 0.08), 0 2px 10px rgba(0, 0, 0, 0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Soft decorative background glow */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '240px',
                  height: '140px',
                  background: 'rgba(0, 168, 140, 0.12)',
                  borderRadius: '50%',
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                  zIndex: 0
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Visual Medical Badge */}
                <div
                  style={{
                    width: 92,
                    height: 92,
                    margin: '0 auto 20px',
                    borderRadius: 24,
                    background: 'linear-gradient(135deg, #E6F6F4 0%, #D1FAE5 100%)',
                    border: '2px solid #A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00A88C',
                    position: 'relative',
                    boxShadow: '0 8px 24px rgba(0, 168, 140, 0.15)'
                  }}
                >
                  {isDoctor ? (
                    <IconStethoscope size={46} stroke={1.8} />
                  ) : (
                    <IconBuildingHospital size={46} stroke={1.8} />
                  )}

                  {/* Status badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: '#F59E0B',
                      color: '#FFFFFF',
                      fontSize: 15,
                      fontWeight: 800,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #FFFFFF',
                      boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    !
                  </span>
                </div>

                {/* Status Tag */}
                <div className="mb-2">
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 14px',
                      borderRadius: 99,
                      background: '#F1F5F9',
                      color: '#64748B',
                      fontSize: 12.5,
                      fontWeight: 700,
                      letterSpacing: '0.3px'
                    }}
                  >
                    <IconShieldCheck size={14} color="#00A88C" />
                    <span>ভেরিফাইড স্বাস্থ্যসেবা ডিরেক্টরি</span>
                  </span>
                </div>

                {/* Main Heading */}
                <h3
                  style={{
                    fontSize: 'clamp(22px, 3.5vw, 28px)',
                    fontWeight: 800,
                    color: '#1E293B',
                    marginBottom: 10,
                    letterSpacing: '-0.3px',
                    lineHeight: 1.3
                  }}
                >
                  {heading}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: 15,
                    color: '#64748B',
                    maxWidth: 520,
                    margin: '0 auto 28px',
                    lineHeight: 1.6,
                    fontWeight: 400
                  }}
                >
                  {description}
                </p>

                {/* Inline Quick Search Box */}
                <form
                  onSubmit={handleSearch}
                  style={{
                    maxWidth: 480,
                    margin: '0 auto 28px',
                    display: 'flex',
                    alignItems: 'center',
                    background: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 50,
                    padding: '4px 6px 4px 18px',
                    transition: 'all 0.2s ease',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                  }}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.borderColor = '#00A88C'
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 168, 140, 0.1)'
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0'
                    e.currentTarget.style.background = '#F8FAFC'
                    e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <IconSearch size={18} color="#94A3B8" style={{ marginRight: 10, flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      fontSize: 14,
                      color: '#1E293B',
                      fontWeight: 500
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      border: 'none',
                      background: '#00A88C',
                      color: '#FFFFFF',
                      borderRadius: 50,
                      padding: '8px 20px',
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#008a74')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#00A88C')}
                  >
                    খুঁজুন
                  </button>
                </form>

                {/* Primary Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 32
                  }}
                >
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      style={{
                        background: '#FFFFFF',
                        color: '#00A88C',
                        border: '1.5px solid #00A88C',
                        borderRadius: 12,
                        padding: '11px 24px',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#E6F6F4'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FFFFFF'
                      }}
                    >
                      <IconRotateClockwise size={16} />
                      <span>পুনরায় চেষ্টা করুন</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(browsePath)}
                    style={{
                      background: '#00A88C',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 12,
                      padding: '11px 26px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(0, 168, 140, 0.25)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#008a74'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#00A88C'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {isDoctor ? <IconStethoscope size={17} /> : <IconBuildingHospital size={17} />}
                    <span>{browseLabel}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    style={{
                      background: '#F1F5F9',
                      color: '#334155',
                      border: '1px solid #CBD5E1',
                      borderRadius: 12,
                      padding: '11px 22px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                  >
                    <IconHome size={16} />
                    <span>হোম পেজে যান</span>
                  </button>
                </div>

                {/* Helpful Quick Navigation Links */}
                <div
                  style={{
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 20,
                    flexWrap: 'wrap',
                    color: '#64748B',
                    fontSize: 13
                  }}
                >
                  <span style={{ fontWeight: 600 }}>দ্রুত লিংক:</span>
                  <span
                    onClick={() => navigate('/specialties')}
                    style={{ cursor: 'pointer', color: '#00A88C', fontWeight: 600 }}
                  >
                    বিশেষজ্ঞ ক্যাটাগরি
                  </span>
                  <span>•</span>
                  <span
                    onClick={() => navigate('/top-doctors')}
                    style={{ cursor: 'pointer', color: '#00A88C', fontWeight: 600 }}
                  >
                    সেরা ডাক্তারগণ
                  </span>
                  <span>•</span>
                  <span
                    onClick={() => navigate('/top-hospitals')}
                    style={{ cursor: 'pointer', color: '#00A88C', fontWeight: 600 }}
                  >
                    সেরা হাসপাতাল
                  </span>
                  <span>•</span>
                  <span
                    onClick={() => navigate('/contact')}
                    style={{ cursor: 'pointer', color: '#00A88C', fontWeight: 600 }}
                  >
                    সহায়তা কেন্দ্র
                  </span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

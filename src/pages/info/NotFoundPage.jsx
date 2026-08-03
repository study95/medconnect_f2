import { useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/ThemeContext'
import { 
  IconSearch, 
  IconHome, 
  IconArrowLeft, 
  IconStethoscope, 
  IconHeadset 
} from '@tabler/icons-react'

export default function NotFoundPage() {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Text in Bengali
  const bnTexts = {
    errorCode: '৪০৪',
    title: 'দুঃখিত, পেজটি খুঁজে পাওয়া যায়নি!',
    desc: 'আপনি যে লিংকটি খুঁজছেন তা হয়তো পরিবর্তন করা হয়েছে, সরিয়ে ফেলা হয়েছে অথবা সাময়িকভাবে বন্ধ আছে। আমাদের ডাক্তার তালিকা অনুসন্ধান করে দেখতে পারেন অথবা নীচের অপশনগুলো ব্যবহার করুন।',
    searchPlaceholder: 'ডাক্তার, স্পেশালিস্ট বা হাসপাতাল খুঁজুন...',
    searchBtn: 'খুঁজুন',
    btnHome: 'হোম পেজে ফিরে যান',
    btnBack: 'আগের পেজে যান',
    btnDoctors: 'ডাক্তারদের খুঁজুন',
    btnSupport: 'সহায়তা কেন্দ্র',
    quickLinks: 'সহায়ক লিঙ্কসমূহ:',
    ecgLabel: 'রিয়েল-টাইম হার্টবিট মনিটর - সিগন্যাল সংযোগ বিচ্ছিন্ন'
  }

  return (
    <div className="page-wrapper" style={{ 
      background: 'var(--mc-bg)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingBottom: 100,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Embedded CSS for Keyframes and Micro-interactions */}
      <style>{`
        /* Floating background decoration */
        .decor-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.08;
          z-index: 1;
          pointer-events: none;
        }
        [data-theme='dark'] .decor-blob {
          opacity: 0.15;
        }
        .blob-1 {
          width: 300px;
          height: 300px;
          background: var(--mc-primary);
          top: 10%;
          left: -5%;
          animation: float-slow 12s infinite alternate ease-in-out;
        }
        .blob-2 {
          width: 400px;
          height: 400px;
          background: var(--mc-accent);
          bottom: 5%;
          right: -10%;
          animation: float-slow 16s infinite alternate-reverse ease-in-out;
        }

        @keyframes float-slow {
          0% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-40px) rotate(90deg) scale(1.1); }
          100% { transform: translateY(0) rotate(180deg) scale(1); }
        }

        /* Glassmorphism main card */
        .glass-error-card {
          background: var(--mc-white);
          border: 1px solid var(--mc-border);
          border-radius: 32px;
          padding: 40px;
          box-shadow: var(--mc-shadow);
          z-index: 2;
          position: relative;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
        }
        .glass-error-card:hover {
          box-shadow: var(--mc-shadow-hover);
        }

        /* ECG pulse drawing animation */
        .pulse-svg {
          width: 100%;
          max-width: 380px;
          height: auto;
          margin: 0 auto;
          display: block;
        }
        .pulse-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw-pulse 3s linear infinite;
        }
        .pulse-dot {
          animation: follow-pulse 3s linear infinite;
        }

        @keyframes draw-pulse {
          0% { stroke-dashoffset: 1000; }
          70%, 100% { stroke-dashoffset: 0; }
        }
        @keyframes follow-pulse {
          0% { motion-offset: 0%; }
          70%, 100% { motion-offset: 100%; }
        }

        /* Glitchy pulse number 404 */
        .number-404 {
          font-size: clamp(80px, 12vw, 130px);
          font-weight: 950;
          line-height: 0.9;
          letter-spacing: -4px;
          background: linear-gradient(135deg, var(--mc-primary) 0%, var(--mc-accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 5px;
          text-shadow: 0 10px 30px rgba(0, 168, 140, 0.15);
          animation: text-pulse 2s infinite ease-in-out;
        }

        @keyframes text-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.02); filter: brightness(1.1); }
        }

        /* Search input container hover/focus */
        .notfound-search-bar {
          position: relative;
          max-width: 500px;
          margin: 25px auto 35px;
          transition: transform 0.3s ease;
        }
        .notfound-search-bar:focus-within {
          transform: scale(1.02);
        }
        .notfound-search-bar input {
          width: 100%;
          height: 54px;
          padding: 0 120px 0 50px;
          border-radius: 50px;
          border: 1.5px solid var(--mc-border);
          background: var(--mc-bg);
          color: var(--mc-text);
          font-size: 15px;
          font-weight: 600;
          outline: none;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .notfound-search-bar input:focus {
          border-color: var(--mc-primary);
          background: var(--mc-white);
          box-shadow: 0 10px 25px rgba(0, 168, 140, 0.08);
        }
        .notfound-search-bar .search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--mc-text-muted);
          transition: color 0.3s;
        }
        .notfound-search-bar input:focus + .search-icon {
          color: var(--mc-primary);
        }
        .notfound-search-bar button {
          position: absolute;
          right: 6px;
          top: 6px;
          bottom: 6px;
          padding: 0 24px;
          border-radius: 50px;
          background: var(--mc-primary);
          color: white;
          border: none;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 10px rgba(0, 168, 140, 0.2);
        }
        .notfound-search-bar button:hover {
          background: var(--mc-primary-dark);
          box-shadow: 0 6px 15px rgba(0, 168, 140, 0.3);
        }

        /* Action cards list style */
        .action-grid-card {
          background: var(--mc-bg);
          border: 1px solid var(--mc-border);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          height: 100%;
        }
        .action-grid-card:hover {
          transform: translateY(-3px);
          border-color: var(--mc-primary);
          background: var(--mc-white);
          box-shadow: 0 8px 25px rgba(0, 168, 140, 0.08);
        }
        .action-card-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: var(--mc-primary-light);
          color: var(--mc-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .action-grid-card:hover .action-card-icon {
          background: var(--mc-primary);
          color: white;
          transform: scale(1.1);
        }
        .action-card-title {
          font-weight: 800;
          color: var(--mc-text);
          margin: 0 0 2px 0;
          font-size: 15px;
        }
        .action-card-desc {
          color: var(--mc-text-muted);
          font-size: 12px;
          margin: 0;
          font-weight: 500;
        }

        .back-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: var(--mc-primary);
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 99px;
          background: var(--mc-primary-light);
          transition: all 0.2s;
          margin-bottom: 25px;
          border: 1px solid transparent;
        }
        .back-nav-link:hover {
          background: var(--mc-primary);
          color: white;
          transform: translateX(-4px);
        }
      `}</style>

      {/* Decorative Blobs */}
      <div className="decor-blob blob-1" />
      <div className="decor-blob blob-2" />

      <Container style={{ zIndex: 5 }}>
        <Row className="justify-content-center">
          <Col lg={8} md={10} xs={12} className="text-center">
            {/* Back to previous page button */}
            <div className="d-flex justify-content-center">
              <button 
                onClick={() => navigate(-1)} 
                className="back-nav-link"
              >
                <IconArrowLeft size={18} />
                <span>{bnTexts.btnBack}</span>
              </button>
            </div>

            <div className="glass-error-card">
              {/* ECG Heartbeat Graphic */}
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <svg className="pulse-svg" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="ecg-grid" width="15" height="15" patternUnits="userSpaceOnUse">
                      <path d="M 15 0 L 0 0 0 15" fill="none" stroke={theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,168,140,0.04)'} strokeWidth="1" />
                    </pattern>
                  </defs>
                  {/* Grid overlay */}
                  <rect width="100%" height="100%" fill="url(#ecg-grid)" rx="16" />
                  
                  {/* ECG flatline with break/pulse */}
                  <path
                    className="pulse-path"
                    d="M 10,60 L 110,60 L 120,40 L 130,80 L 140,15 L 155,105 L 165,55 L 175,65 L 185,60 L 260,60 L 270,35 L 280,85 L 290,20 L 305,100 L 315,55 L 325,65 L 335,60 L 390,60"
                    fill="none"
                    stroke="var(--mc-primary)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Confused face icon in center */}
                  <circle cx="210" cy="60" r="18" fill="var(--mc-primary-light)" stroke="var(--mc-primary)" strokeWidth="2" />
                  <text x="210" y="66" textAnchor="middle" fontSize="18" fill="var(--mc-primary)" fontWeight="bold">?</text>
                </svg>
              </div>

              {/* Large styled 404 number */}
              <div className="number-404">{bnTexts.errorCode}</div>

              {/* Title & Description */}
              <h2 style={{ 
                fontWeight: 900, 
                color: 'var(--mc-text)', 
                fontSize: 'clamp(22px, 3.5vw, 30px)',
                letterSpacing: '-0.5px',
                marginBottom: 15
              }}>
                {bnTexts.title}
              </h2>
              
              <p style={{ 
                color: 'var(--mc-text-muted)', 
                fontSize: 16, 
                fontWeight: 500,
                maxWidth: 620,
                margin: '0 auto 25px',
                lineHeight: 1.7
              }}>
                {bnTexts.desc}
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="notfound-search-bar">
                <input 
                  type="text" 
                  placeholder={bnTexts.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <IconSearch className="search-icon" size={20} />
                <button type="submit">{bnTexts.searchBtn}</button>
              </form>

              {/* Helpful links grid */}
              <h6 style={{ 
                textAlign: 'left', 
                fontWeight: 800, 
                color: 'var(--mc-text)', 
                fontSize: 14, 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                marginBottom: 15 
              }}>
                {bnTexts.quickLinks}
              </h6>

              <Row className="g-3">
                <Col md={6} xs={12}>
                  <div className="action-grid-card" onClick={() => navigate('/')}>
                    <div className="action-card-icon">
                      <IconHome size={22} />
                    </div>
                    <div>
                      <h5 className="action-card-title">{bnTexts.btnHome}</h5>
                      <p className="action-card-desc">প্রধান পাতায় ফিরে যান</p>
                    </div>
                  </div>
                </Col>
                <Col md={6} xs={12}>
                  <div className="action-grid-card" onClick={() => navigate('/doctors')}>
                    <div className="action-card-icon">
                      <IconStethoscope size={22} />
                    </div>
                    <div>
                      <h5 className="action-card-title">{bnTexts.btnDoctors}</h5>
                      <p className="action-card-desc">পছন্দের বিশেষজ্ঞ ডাক্তার খুঁজুন</p>
                    </div>
                  </div>
                </Col>
                <Col md={6} xs={12}>
                  <div className="action-grid-card" onClick={() => navigate('/support')}>
                    <div className="action-card-icon">
                      <IconHeadset size={22} />
                    </div>
                    <div>
                      <h5 className="action-card-title">{bnTexts.btnSupport}</h5>
                      <p className="action-card-desc">যেকোনো প্রশ্ন বা সাহায্যের জন্য</p>
                    </div>
                  </div>
                </Col>
                <Col md={6} xs={12}>
                  <div className="action-grid-card" onClick={() => navigate('/contact')}>
                    <div className="action-card-icon">
                      <IconSearch size={22} />
                    </div>
                    <div>
                      <h5 className="action-card-title">যোগাযোগ করুন</h5>
                      <p className="action-card-desc">আমাদের সাথে ইমেইল বা ফোনে যোগাযোগ করুন</p>
                    </div>
                  </div>
                </Col>
              </Row>

            </div>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

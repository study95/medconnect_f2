import React, { useState, useRef, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  IconStethoscope, IconActivity, IconSearch, IconArrowRight, 
  IconShieldCheck, IconClock, IconStar, IconHeadset, IconUsers,
  IconChevronLeft, IconChevronRight, IconLayoutGrid, IconX
} from '@tabler/icons-react'
import axiosInstance from '../api/axiosInstance'
import { useTypewriter } from '../hooks/useTypewriter'

const SEARCH_PHRASES = [
  'সেবা বা কীওয়ার্ড লিখুন...',
  'যেমন: হার্ট স্পেশালিস্ট',
  'যেমন: ডায়াবেটিস চিকিৎসা',
  'যেমন: ফিজিওথেরাপি সেবা',
  'যেমন: ল্যাব ডায়াগনস্টিক'
]

const CATS = [
  { key: 'all', label: 'সকল সেবা', icon: '🏥' },
  { key: 'diagnostic', label: 'ডায়াগনস্টিক', icon: '🔬' },
  { key: 'clinical', label: 'চিকিৎসা সেবা', icon: '🩺' },
  { key: 'surgical', label: 'সার্জারি সেবা', icon: '⚕️' },
  { key: 'check', label: 'হেলথ চেকআপ', icon: '❤️' },
  { key: 'mother', label: 'মা ও শিশু সেবা', icon: '👶' },
  { key: 'dental', label: 'ডেন্টাল সেবা', icon: '🦷' },
  { key: 'eye', label: 'চোখের সেবা', icon: '👁️' },
  { key: 'mental', label: 'মানসিক স্বাস্থ্য', icon: '🧠' },
  { key: 'physio', label: 'ফিজিওথেরাপি', icon: '🏃' },
]

const DEFAULT_SERVICES = [
  { id: 1, title_bn: 'ডায়াগনস্টিক সেবা', description_bn: 'প্রত্যয়িত কেন্দ্র থেকে উন্নত ল্যাবরেটরি এবং ইমেজিং ডায়াগনস্টিক।', icon: 'diagnostic', category: 'Diagnostic', count: '১২০০+', count_label: 'ডায়াগনস্টিক কেন্দ্র', items_bn: ['রক্ত পরীক্ষা', 'এক্স-রে ও সিটি স্ক্যান', 'আলট্রাসাউন্ড', 'ইসিজি'] },
  { id: 2, title_bn: 'ক্লিনিক্যাল সেবা', description_bn: 'সকল চিকিৎসা ক্ষেত্রে বিশেষজ্ঞ ডাক্তারদের কাছ থেকে পরামর্শ।', icon: 'clinical', category: 'Clinical', count: '৮৫০+', count_label: 'বিশেষজ্ঞ ডাক্তার', items_bn: ['হৃদরোগ', 'স্নায়ুবিদ্যা', 'অর্থোপেডিক্স', 'গ্যাস্ট্রোএন্টেরোলজি'] },
  { id: 3, title_bn: 'সার্জিক্যাল সেবা', description_bn: 'মানসম্মত হাসপাতালে প্রত্যয়িত সার্জনদের দ্বারা আধুনিক অস্ত্রোপচার।', icon: 'surgical', category: 'Surgical', count: '৩০০+', count_label: 'হাসপাতাল', items_bn: ['ল্যাপারোস্কোপিক', 'অর্থোপেডিক সার্জারি', 'কার্ডিয়াক সার্জারি', 'সাধারণ সার্জারি'] },
  { id: 4, title_bn: 'হেলথ চেকআপ', description_bn: 'নিয়মিত পর্যবেক্ষণ ও প্রতিরোধের জন্য ব্যাপক স্বাস্থ্য প্যাকেজ।', icon: 'check', category: 'Health Check', count: '৮০০+', count_label: 'চেকআপ প্যাকেজ', items_bn: ['বেসিক চেকআপ', 'প্রিমিয়াম চেকআপ', 'কর্পোরেট স্বাস্থ্য', 'প্রাক-বিবাহ পরীক্ষা'] },
  { id: 5, title_bn: 'মা ও শিশু সেবা', description_bn: 'গর্ভাবস্থায় মায়েদের জন্য বিশেষায়িত যত্ন ও শিশু স্বাস্থ্য সেবা।', icon: 'mother', category: 'Mother & Child', count: '৬০০+', count_label: 'ক্লিনিক', items_bn: ['প্রসবপূর্ব যত্ন', 'শিশু চিকিৎসা', 'নবজাতক সেবা', 'পুষ্টি পরামর্শ'] },
  { id: 6, title_bn: 'ডেন্টাল সেবা', description_bn: 'যোগ্য ক্লিনিকে প্রত্যয়িত দন্ত চিকিৎসকদের কাছ থেকে আধুনিক দাঁতের যত্ন।', icon: 'dental', category: 'Dental', count: '৪০০+', count_label: 'ডেন্টাল ক্লিনিক', items_bn: ['দাঁত পরিষ্কার', 'রুট ক্যানাল', 'দাঁত সাদা করা', 'ডেন্টাল ইমপ্লান্ট'] },
  { id: 7, title_bn: 'চোখের সেবা', description_bn: 'আধুনিক যন্ত্রপাতির সাহায্যে চোখের পরীক্ষা, চশমা নির্ধারণ এবং ছানি অপারেশনসহ উন্নত সেবা।', icon: 'eye', category: 'Eye Care', count: '২৫০+', count_label: 'চক্ষু কেন্দ্র', items_bn: ['চোখের পরীক্ষা', 'ছানি অপারেশন', 'কনট্যাক্ট লেন্স', 'চশমা নির্ধারণ'] },
  { id: 8, title_bn: 'মানসিক স্বাস্থ্য', description_bn: 'মানসিক চাপ, বিষণ্ণতা, উদ্বেগ ও অন্যান্য মানসিক সমস্যার জন্য বিশেষজ্ঞ থেরাপিস্টদের কাউন্সিলিং।', icon: 'mental', category: 'Mental Health', count: '১৫০+', count_label: 'থেরাপিস্ট ও কাউন্সিলর', items_bn: ['কাউন্সিলিং ও থেরাপি', 'বিষণ্ণতা নিরাময়', 'পারিবারিক থেরাপি', 'উদ্বেগ নিয়ন্ত্রণ'] },
  { id: 9, title_bn: 'ফিজিওথেরাপি', description_bn: 'হাড়ের ব্যথা, প্যারালাইসিস, স্ট্রোক ও স্পোর্টস ইনজুরির জন্য দক্ষ থেরাপিস্টদের দ্বারা আধুনিক থেরাপি সেবা।', icon: 'physio', category: 'Physiotherapy', count: '৫০০+', count_label: 'থেরাপি সেন্টার', items_bn: ['পেইন ম্যানেজমেন্ট', 'স্ট্রোক পুনর্বাসন', 'স্পোর্টস ইনজুরি থেরাপি', 'পক্ষাঘাতগ্রস্ত পুনর্বাসন'] },
]

const FEATURES = [
  { icon: <IconShieldCheck size={26} />, title: 'নির্ভরযোগ্য সেবা', desc: 'লাইসেন্সপ্রাপ্ত hospital ও বিশেষজ্ঞ' },
  { icon: <IconClock size={26} />, title: 'সহজ ও দ্রুত', desc: 'সহজে খুঁজুন, বুক করুন এবং দ্রুত সেবা পান' },
  { icon: <IconStar size={26} />, title: 'মানসম্মত সেবা', desc: 'আধুনিক ক্লিনিক ও মান-নিয়ন্ত্রিত দল দ্বারা সেবা' },
  { icon: <IconUsers size={26} />, title: 'সাশ্রয়ী মূল্য', desc: 'স্বচ্ছ মূল্য নির্ধারণ, কোনো লুকানো চার্জ নেই' },
  { icon: <IconHeadset size={26} />, title: '২৪/৭ সহায়তা', desc: 'সর্বদা প্রস্তুত আমাদের সহায়তা দল' },
]

const ICON_MAP = { 
  diagnostic: '🔬', 
  clinical: '🩺', 
  surgical: '⚕️', 
  check: '❤️', 
  mother: '👶', 
  dental: '🦷',
  eye: '👁️',
  mental: '🧠',
  physio: '🏃'
}

const CARD_THEMES = {
  diagnostic: { primary: '#00A88C', secondary: '#F0FDF4', text: '#065F46', border: 'rgba(0, 168, 140, 0.12)', glow: 'rgba(0, 168, 140, 0.15)' },
  clinical: { primary: '#0EA5E9', secondary: '#F0F9FF', text: '#0369A1', border: 'rgba(14, 165, 233, 0.12)', glow: 'rgba(14, 165, 233, 0.15)' },
  surgical: { primary: '#6366F1', secondary: '#EEF2FF', text: '#3730A3', border: 'rgba(99, 102, 241, 0.12)', glow: 'rgba(99, 102, 241, 0.15)' },
  check: { primary: '#F43F5E', secondary: '#FFF1F2', text: '#9F1239', border: 'rgba(244, 63, 94, 0.12)', glow: 'rgba(244, 63, 94, 0.15)' },
  mother: { primary: '#F59E0B', secondary: '#FEF3C7', text: '#92400E', border: 'rgba(245, 158, 11, 0.12)', glow: 'rgba(245, 158, 11, 0.15)' },
  dental: { primary: '#14B8A6', secondary: '#F0FDFA', text: '#0F766E', border: 'rgba(20, 184, 166, 0.12)', glow: 'rgba(20, 184, 166, 0.15)' },
  eye: { primary: '#8B5CF6', secondary: '#F5F3FF', text: '#5B21B6', border: 'rgba(139, 92, 246, 0.12)', glow: 'rgba(139, 92, 246, 0.15)' },
  mental: { primary: '#EC4899', secondary: '#FDF2F8', text: '#9D174D', border: 'rgba(236, 72, 153, 0.12)', glow: 'rgba(236, 72, 153, 0.15)' },
  physio: { primary: '#22C55E', secondary: '#F0FDF4', text: '#166534', border: 'rgba(34, 197, 94, 0.12)', glow: 'rgba(34, 197, 94, 0.15)' },
}

const DEFAULT_THEME = { primary: '#00A88C', secondary: '#F0FDF4', text: '#065F46', border: 'rgba(0, 168, 140, 0.12)', glow: 'rgba(0, 168, 140, 0.15)' }

function ServiceCard({ service, idx }) {
  const [hovered, setHovered] = useState(false)
  const title = service.title_bn || service.title_en || service.name
  const desc = service.description_bn || service.description_en || ''
  const items = service.items_bn || service.items_en || []
  const icon = ICON_MAP[service.icon] || '🏥'

  const theme = CARD_THEMES[service.icon] || DEFAULT_THEME

  return (
    <div 
      onMouseEnter={() => setHovered(true)} 
      onMouseLeave={() => setHovered(false)} 
      style={{
        background: 'white', 
        borderRadius: 24, 
        padding: '30px 28px',
        border: '1.5px solid #F1F5F9',
        boxShadow: hovered 
          ? `0 24px 48px -12px ${theme.glow}, 0 8px 16px -8px ${theme.glow}` 
          : '0 4px 20px rgba(15, 23, 42, 0.02)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        animation: `fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s both`,
      }}
    >
      {/* Dynamic top gradient bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 6,
        background: `linear-gradient(90deg, ${theme.primary} 0%, ${theme.primary}B0 100%)`,
        opacity: hovered ? 1 : 0,
        transition: 'all 0.3s ease',
      }} />

      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: -60,
        right: -60,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.primary}0D 0%, transparent 70%)`,
        transition: 'all 0.3s ease',
        transform: hovered ? 'scale(1.3)' : 'scale(1)',
        pointerEvents: 'none'
      }} />

      {/* Icon Container with bouncy hover */}
      <div style={{ 
        width: 68, 
        height: 68, 
        borderRadius: 18, 
        background: hovered ? theme.primary : theme.secondary, 
        color: hovered ? 'white' : theme.text,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 24, 
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', 
        fontSize: 32,
        transform: hovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
        boxShadow: hovered ? `0 12px 24px -6px ${theme.glow}` : 'none'
      }}>
        {icon}
      </div>

      {/* Title */}
      <h3 style={{ 
        fontSize: 20, 
        fontWeight: 800, 
        color: '#0F172A', 
        marginBottom: 12,
        transition: 'color 0.3s ease',
        fontFamily: "'Hind Siliguri', sans-serif"
      }}>
        {title}
      </h3>

      {/* Description */}
      <p style={{ 
        fontSize: 14, 
        color: '#475569', 
        lineHeight: 1.7, 
        marginBottom: 20, 
        flexGrow: 1,
        fontFamily: "'Hind Siliguri', sans-serif"
      }}>
        {desc}
      </p>

      {/* Item bullet points */}
      {items.length > 0 && (
        <ul style={{ 
          listStyle: 'none', 
          margin: '0 0 24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 8,
          background: '#F8FAFC',
          padding: 16,
          borderRadius: 16,
          border: '1.5px solid #F1F5F9',
          transition: 'all 0.3s ease',
          borderColor: hovered ? `${theme.primary}1A` : '#F1F5F9',
        }}>
          {items.slice(0, 4).map((item, i) => (
            <li key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10, 
              fontSize: 13, 
              color: '#334155',
              fontFamily: "'Hind Siliguri', sans-serif"
            }}>
              <span style={{ 
                width: 7, 
                height: 7, 
                borderRadius: '50%', 
                background: theme.primary, 
                flexShrink: 0,
                boxShadow: `0 0 0 4px ${theme.primary}20`
              }} />
              {item}
            </li>
          ))}
        </ul>
      )}

      {/* Footer statistics & Action Button */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderTop: '1.5px solid #F1F5F9', 
        paddingTop: 20,
        marginTop: 'auto'
      }}>
        <div>
          <span style={{ 
            fontSize: 20, 
            fontWeight: 900, 
            color: theme.primary,
            transition: 'color 0.3s ease'
          }}>
            {service.count || '৫০০+'}
          </span>
          <span style={{ 
            fontSize: 12, 
            color: '#64748B', 
            marginLeft: 6,
            fontWeight: 600,
            fontFamily: "'Hind Siliguri', sans-serif"
          }}>
            {service.count_label || 'কেন্দ্র'}
          </span>
        </div>

        <Link to={`/services/${service.id}`} style={{ textDecoration: 'none' }}>
          <button style={{ 
            background: hovered ? theme.primary : `${theme.primary}0D`, 
            color: hovered ? 'white' : theme.primary, 
            border: 'none', 
            borderRadius: 12, 
            padding: '10px 18px', 
            fontWeight: 800, 
            fontSize: 13, 
            cursor: 'pointer', 
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            fontFamily: "'Hind Siliguri', sans-serif",
            boxShadow: hovered ? `0 8px 16px -4px ${theme.glow}` : 'none',
            transform: hovered ? 'translateX(2px)' : 'none'
          }}>
            বিস্তারিত দেখুন 
            <IconArrowRight size={14} style={{ 
              transition: 'transform 0.3s ease',
              transform: hovered ? 'translateX(2px)' : 'none'
            }} />
          </button>
        </Link>
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [email, setEmail] = useState('')
  const catScrollRef = useRef(null)
  
  const typingPlaceholder = useTypewriter(SEARCH_PHRASES)

  const [canScroll, setCanScroll] = useState({ left: false, right: true })

  // TanStack Query — cached 10min, services rarely change
  const { data: services = [], isLoading: loading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/services')
        return res.data && res.data.length > 0 ? res.data : DEFAULT_SERVICES
      } catch (err) {
        console.warn('Failed to fetch services from backend, using default services fallback:', err)
        return DEFAULT_SERVICES
      }
    },
    staleTime: 10 * 60 * 1000,
    placeholderData: DEFAULT_SERVICES,
  })

  const filtered = services.filter(s => {
    const matchCat = activeCategory === 'all' || 
      (s.icon === activeCategory) || 
      (s.category || '').toLowerCase().includes(activeCategory.toLowerCase())

    const titleBn = s.title_bn || ''
    const titleEn = s.title_en || s.name || ''
    const descBn = s.description_bn || ''
    const descEn = s.description_en || ''
    const matchSearch = searchTerm === '' || 
      `${titleBn} ${titleEn} ${descBn} ${descEn}`.toLowerCase().includes(searchTerm.toLowerCase())

    return matchCat && matchSearch
  })

  const checkScroll = () => {
    if (catScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = catScrollRef.current
      setCanScroll({
        left: scrollLeft > 10,
        right: scrollLeft < (scrollWidth - clientWidth - 10)
      })
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [])

  const handleCatScroll = (direction) => {
    if (catScrollRef.current) {
      const amount = catScrollRef.current.clientWidth * 0.7
      catScrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
    }
  }

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC' }}>
      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #F8FAFC 100%)', padding: '20px 0 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,168,140,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="pb-5">
              <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 20 }}>সেবাসমূহ</span>
              <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 20, color: '#0F172A' }}>
                আপনার সুস্থতার জন্য<br /><span style={{ color: '#00A88C' }}>আমাদের সেরা সেবাসমূহ</span>
              </h1>
              <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.8, marginBottom: 36, maxWidth: 520 }}>
                বিশ্বস্ত ডাক্তার, আধুনিক হাসপাতাল ও উন্নত স্বাস্থ্যসেবা নিয়ে আমরা আছি আপনার পাশে।
              </p>
              <div className="premium-search-container">
                <IconSearch size={20} className="search-icon" style={{ transition: 'all 0.3s ease' }} />
                <input 
                  type="text" 
                  placeholder={typingPlaceholder} 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0F172A', background: 'transparent', fontFamily: "'Hind Siliguri', sans-serif" }} 
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: 6, 
                      borderRadius: '50%', 
                      color: '#94A3B8', 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                      marginRight: 4
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#F43F5E';
                      e.currentTarget.style.background = '#FFE4E6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94A3B8';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <IconX size={16} stroke={3} />
                  </button>
                )}
                <button className="premium-search-btn">খুঁজুন</button>
              </div>
            </Col>
            <Col lg={6} className="d-none d-lg-flex justify-content-end">
              <div style={{ position: 'relative' }}>
                <div style={{ width: 460, height: 340, borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', background: 'rgba(0,168,140,0.08)', position: 'absolute', inset: -20 }} />
                <img src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=700&q=80" alt="স্বাস্থ্যসেবা" style={{ width: 440, height: 320, objectFit: 'cover', borderRadius: 32, position: 'relative', zIndex: 2, boxShadow: '0 30px 60px rgba(0,168,140,0.15)' }} />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CATEGORY NAV BAR */}
      <section className="sticky-cat-navbar" style={{ background: 'white', borderBottom: '1px solid #E2E8F0', position: 'sticky', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <style>{`
          .sticky-cat-navbar {
            top: 58px !important;
          }
          @media (min-width: 992px) {
            .sticky-cat-navbar {
              top: 64px !important;
            }
          }
        `}</style>
        <Container style={{ position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '10px 0' }}>
            {/* Left Scroll Button */}
            {canScroll.left && (
              <>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 48,
                  background: 'linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 60%, rgba(255,255,255,0) 100%)',
                  zIndex: 9,
                  pointerEvents: 'none'
                }} />
                <button 
                  onClick={() => handleCatScroll('left')} 
                  style={{ 
                    position: 'absolute',
                    left: 2,
                    zIndex: 10,
                    width: 36, 
                    height: 36, 
                    borderRadius: '50%', 
                    border: '1.5px solid #E2E8F0', 
                    background: 'white', 
                    boxShadow: '0 4px 14px rgba(0,0,0,0.14)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer', 
                    color: '#00A88C',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <IconChevronLeft size={20} stroke={3} />
                </button>
              </>
            )}

            {/* Scrollable Category Pills */}
            <div 
              ref={catScrollRef}
              onScroll={checkScroll}
              style={{ 
                display: 'flex', 
                gap: 8, 
                overflowX: 'auto', 
                padding: '4px 40px', 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                width: '100%',
                scrollBehavior: 'smooth'
              }}
            >
              {CATS.map(cat => (
                <button 
                  key={cat.key} 
                  onClick={() => setActiveCategory(cat.key)} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, 
                    whiteSpace: 'nowrap', border: activeCategory === cat.key ? 'none' : '1.5px solid #F1F5F9', 
                    background: activeCategory === cat.key ? '#00A88C' : '#F8FAFC', 
                    color: activeCategory === cat.key ? 'white' : '#475569', 
                    fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', 
                    fontFamily: "'Hind Siliguri', sans-serif",
                    boxShadow: activeCategory === cat.key ? '0 8px 16px rgba(0, 168, 140, 0.15)' : 'none',
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: 18 }}>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>

            {/* Right Scroll Button */}
            {canScroll.right && (
              <>
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 48,
                  background: 'linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 60%, rgba(255,255,255,0) 100%)',
                  zIndex: 9,
                  pointerEvents: 'none'
                }} />
                <button 
                  onClick={() => handleCatScroll('right')} 
                  style={{ 
                    position: 'absolute',
                    right: 2,
                    zIndex: 10,
                    width: 36, 
                    height: 36, 
                    borderRadius: '50%', 
                    border: '1.5px solid #E2E8F0', 
                    background: 'white', 
                    boxShadow: '0 4px 14px rgba(0,0,0,0.14)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer', 
                    color: '#00A88C',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <IconChevronRight size={20} stroke={3} />
                </button>
              </>
            )}
          </div>
        </Container>
      </section>

      {/* SERVICES GRID */}
      <section style={{ padding: '60px 0' }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-5">
            <h2 style={{ fontWeight: 800, fontSize: 24, color: '#0F172A', margin: 0 }}>জনপ্রিয় সেবাসমূহ</h2>
            <div style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600 }}>মোট {filtered.length}টি সেবা পাওয়া গেছে</div>
          </div>
          {loading ? (
            <Row className="g-4">{[1,2,3,4,5,6].map(i => <Col key={i} lg={4} md={6}><div style={{ background: 'white', borderRadius: 20, height: 280, animation: 'pulse 1.5s ease-in-out infinite' }} /></Col>)}</Row>
          ) : (
            <Row className="g-4">
              {filtered.map((service, idx) => (
                <Col key={service.id} lg={4} md={6}><ServiceCard service={service} idx={idx} /></Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* FEATURES STRIP */}
      <section style={{ background: 'white', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', padding: '48px 0' }}>
        <Container>
          <Row className="g-4">
            {FEATURES.map((f, i) => (
              <Col key={i} xs={6} lg className="text-center">
                <div style={{ color: '#00A88C', marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#94A3B8' }}>{f.desc}</div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* NEWSLETTER */}
      <section style={{ padding: '80px 0' }}>
        <Container>
          <div style={{ background: 'linear-gradient(135deg, #004D40 0%, #00A88C 100%)', borderRadius: 28, padding: '60px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ color: 'white', fontWeight: 900, fontSize: 26, marginBottom: 8 }}>স্বাস্থ্য সম্পর্কিত সর্বশেষ তথ্য ও টিপস পেতে আমাদের সাথে থাকুন</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: 15 }}>নিয়মিত আপডেট পেতে আমাদের নিউজলেটারে সাবস্ক্রাইব করুন।</p>
            </div>
            <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
              <input type="email" placeholder="আপনার ইমেইল লিখুন" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '13px 18px', borderRadius: 12, border: 'none', fontSize: 15, width: 260, outline: 'none', fontFamily: "'Hind Siliguri', sans-serif" }} />
              <button style={{ background: 'white', color: '#00A88C', border: 'none', borderRadius: 12, padding: '13px 24px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif" }}>সাবস্ক্রাইব করুন</button>
            </div>
          </div>
        </Container>
      </section>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .cat-nav-btn:hover:not(:disabled) { border-color: #00A88C !important; color: #00A88C !important; box-shadow: 0 4px 12px rgba(0,168,140,0.1); }
        div::-webkit-scrollbar { display: none; }
        
        /* Premium Search Box styling */
        .premium-search-container {
          background: white; 
          border-radius: 20px; 
          border: 1.5px solid #E2E8F0; 
          padding: 8px 8px 8px 20px; 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          box-shadow: 0 8px 30px rgba(0,0,0,0.04); 
          max-width: 500px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-search-container:focus-within {
          border-color: #00A88C;
          box-shadow: 0 12px 36px rgba(0, 168, 140, 0.08), 0 0 0 4px rgba(0, 168, 140, 0.12);
        }
        .premium-search-container .search-icon {
          color: #94A3B8;
        }
        .premium-search-container:focus-within .search-icon {
          transform: scale(1.1);
          color: #00A88C;
        }
        
        .premium-search-btn {
          background: #00A88C; 
          color: white; 
          border: none; 
          border-radius: 14px; 
          padding: 12px 26px; 
          font-weight: 800; 
          font-size: 14.5px; 
          cursor: pointer; 
          white-space: nowrap; 
          font-family: 'Hind Siliguri', sans-serif;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(0, 168, 140, 0.2);
        }
        .premium-search-btn:hover {
          background: #008F77; 
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 168, 140, 0.3);
        }
        .premium-search-btn:active {
          transform: translateY(1px);
        }
      `}</style>
    </div>
  )
}

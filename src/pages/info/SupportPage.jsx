import React, { useState, useMemo } from 'react'
import { Container, Row, Col, Modal } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getContent } from '../../utils/contentService'
import { 
  Phone, Mail, HelpCircle, MessageSquare, Clock, ShieldCheck, 
  ChevronDown, ChevronUp, ArrowRight, LifeBuoy, Sparkles,
  CheckCircle2, AlertTriangle, Send, RefreshCw, ThumbsUp, ThumbsDown,
  Ticket, FileText, Headphones, PhoneCall, Copy, Search
} from 'lucide-react'
import BreadcrumbHUD from '../../components/common/BreadcrumbHUD'

export default function SupportPage() {
  const navigate = useNavigate()
  const cms = getContent()
  const site = cms.site || {}
  const support = cms.support || {}
  const faqData = cms.faq || {}

  // Active state tabs: 'faq' | 'ticket' | 'status'
  const [activeMainTab, setActiveMainTab] = useState('faq')
  const [activeCategory, setActiveCategory] = useState('all')
  const [openFaqId, setOpenFaqId] = useState(1)
  const [votedFaqs, setVotedFaqs] = useState({})
  const [copiedText, setCopiedText] = useState(null)

  // Ticket Submission Form State
  const [ticketForm, setTicketForm] = useState({
    name: '',
    contact: '',
    category: 'অ্যাপয়েন্টমেন্ট সমস্যা',
    priority: 'সাধারণ',
    subject: '',
    message: ''
  })
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState(null)

  // Ticket Status Search State
  const [statusSearchId, setStatusSearchId] = useState('')
  const [searchedTicketResult, setSearchedTicketResult] = useState(null)
  const [statusError, setStatusError] = useState('')

  // Callback Modal State
  const [showCallbackModal, setShowCallbackModal] = useState(false)
  const [callbackPhone, setCallbackPhone] = useState('')
  const [callbackTime, setCallbackTime] = useState('এখনই (Next 15 min)')
  const [callbackSubmitting, setCallbackSubmitting] = useState(false)

  // Categories
  const categories = [
    { id: 'all', label: 'সব প্রশ্ন', icon: '🌐' },
    { id: 'appointment', label: 'অ্যাপয়েন্টমেন্ট', icon: '📅' },
    { id: 'payment', label: 'পেমেন্ট ও রিফান্ড', icon: '💳' },
    { id: 'account', label: 'অ্যাকাউন্ট ও নিরাপত্তা', icon: '🔒' },
    { id: 'services', label: 'ডিজিটাল সেবা', icon: '🩺' },
  ]

  // Master FAQ items
  const rawItems = useMemo(() => {
    const defaultList = [
      { id: 1, category: 'account', q: 'Doctor Booklet-এ কীভাবে অ্যাকাউন্ট তৈরি করব?', a: 'রেজিস্টার পেজে গিয়ে রোগী বা ডাক্তার হিসেবে প্রয়োজনীয় তথ্য পূরণ করুন। মোবাইল নম্বর ও ইমেইলে প্রাপ্ত ওটিপি যাচাই করলেই অ্যাকাউন্ট সক্রিয় হবে।' },
      { id: 2, category: 'appointment', q: 'কীভাবে ডাক্তারের অ্যাপয়েন্টমেন্ট বুক করব?', a: 'ডাক্তার সার্চ বার থেকে আপনার পছন্দের ডাক্তার, বিশেষজ্ঞতা বা এলাকা বেছে নিন। খালি তারিখ ও সময় নির্বাচন করে "বুক করুন" বাটনে ক্লিক করুন।' },
      { id: 3, category: 'payment', q: 'পেমেন্ট পদ্ধতি কী কী এবং এটি কি নিরাপদ?', a: 'আমরা বিকাশ, নগদ, রকেট, ডেবিট/ক্রেডিট কার্ড এবং সরাসরি হাসপাতালে পেমেন্ট সাপোর্ট করি। আমাদের অনলাইন পেমেন্ট সিস্টেম সম্পূর্ণ SSL এনক্রিপ্টেড ও নিরাপদ।' },
      { id: 4, category: 'appointment', q: 'অ্যাপয়েন্টমেন্ট পরিবর্তন বা বাতিল কীভাবে করব?', a: 'আপনার প্রোফাইলের "আমার অ্যাপয়েন্টমেন্ট" সেকশনে গিয়ে অ্যাপয়েন্টমেন্টের ২ ঘণ্টা পূর্বে বিনামূল্যে বাতিল বা সময় পুনর্নির্ধারণ করতে পারবেন।' },
      { id: 5, category: 'account', q: 'আমার ব্যক্তিগত ও স্বাস্থ্য সম্পর্কিত তথ্য কি নিরাপদ?', a: 'হ্যাঁ, সম্পূর্ণভাবে। Doctor Booklet আন্তর্জাতিক তথ্য সুরক্ষা স্ট্যান্ডার্ড এবং এন্ড-টু-এন্ড এনক্রিপশন মেনে চলে। আপনার তথ্য কেবল অনুমোদিত চিকিৎসক দেখতে পাবেন।' },
      { id: 6, category: 'services', q: 'অনলাইন ভিডিও কনসালটেশন কীভাবে কাজ করে?', a: 'অ্যাপয়েন্টমেন্টের সময় হলে আপনার ড্যাশবোর্ড থেকে "ভিডিও কল শুরু করুন" বাটনে ক্লিক করে সরাসরি ডাক্তারের সাথে ভিডিওতে পরামর্শ নিতে পারবেন।' },
      { id: 7, category: 'payment', q: 'অ্যাপয়েন্টমেন্ট বাতিল করলে রিফান্ড কতদিনে পাওয়া যাবে?', a: 'সফলভাবে বাতিল করার পর আপনার অর্থ ৩-৫ কার্যদিবসের মধ্যে আপনার বিকাশ/নগদ/ব্যাংক অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে ফেরত পাঠানো হয়।' },
      { id: 8, category: 'services', q: 'প্রেসক্রিপশন কীভাবে সংগ্রহ করব?', a: 'কনসালটেশন শেষে ডাক্তার ডিজিটাল প্রেসক্রিপশন আপলোড করলে তা আপনার প্রোফাইলের "আমার প্রেসক্রিপশন" সেকশন থেকে যেকোনো সময় ডাউনলোড বা প্রিন্ট করতে পারবেন।' },
    ]

    const cmsItems = faqData.items || []
    if (cmsItems.length === 0) return defaultList

    return cmsItems.map((item, idx) => {
      const id = item.id || idx + 1
      let cat = item.category
      if (!cat) {
        const text = (item.q + ' ' + item.a).toLowerCase()
        if (text.includes('পেমেন্ট') || text.includes('টাকা') || text.includes('বিকাশ') || text.includes('নগদ') || text.includes('রিফান্ড')) {
          cat = 'payment'
        } else if (text.includes('অ্যাপয়েন্টমেন্ট') || text.includes('বুক') || text.includes('বাতিল') || text.includes('তারিখ')) {
          cat = 'appointment'
        } else if (text.includes('অ্যাকাউন্ট') || text.includes('তথ্য') || text.includes('নিরাপদ') || text.includes('এনক্রিপশন') || text.includes('রেজিস্টার')) {
          cat = 'account'
        } else if (text.includes('ভিডিও') || text.includes('চেক-আপ') || text.includes('প্রেসক্রিপশন') || text.includes('সেবা')) {
          cat = 'services'
        } else {
          cat = 'appointment'
        }
      }
      return { ...item, id, category: cat }
    })
  }, [faqData.items])

  // Filter FAQs by Category
  const filteredFaqs = useMemo(() => {
    return rawItems.filter(item => {
      return activeCategory === 'all' || item.category === activeCategory
    })
  }, [rawItems, activeCategory])

  const toggleFaq = (id) => {
    setOpenFaqId(prev => (prev === id ? null : id))
  }

  const handleVote = (id, type) => {
    setVotedFaqs(prev => ({ ...prev, [id]: type }))
  }

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedText(field)
    setTimeout(() => setCopiedText(null), 2000)
  }

  // Handle Ticket Submission
  const handleTicketSubmit = async (e) => {
    e.preventDefault()
    if (!ticketForm.name || !ticketForm.contact || !ticketForm.subject || !ticketForm.message) {
      return
    }
    setTicketSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    const ticketId = 'TK-' + Math.floor(100000 + Math.random() * 900000)
    const newTicket = {
      id: ticketId,
      ...ticketForm,
      status: 'প্রক্রিয়াধীন (In Progress)',
      date: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
      estimatedTime: '২ ঘণ্টা'
    }
    setSubmittedTicket(newTicket)
    setTicketSubmitting(false)
    setTicketForm({ name: '', contact: '', category: 'অ্যাপয়েন্টমেন্ট সমস্যা', priority: 'সাধারণ', subject: '', message: '' })
  }

  // Handle Ticket Search
  const handleSearchTicket = (e) => {
    e.preventDefault()
    setStatusError('')
    if (!statusSearchId.trim()) return
    const cleanId = statusSearchId.trim().toUpperCase()
    if (submittedTicket && submittedTicket.id.toUpperCase() === cleanId) {
      setSearchedTicketResult(submittedTicket)
    } else {
      if (cleanId.startsWith('TK-')) {
        setSearchedTicketResult({
          id: cleanId,
          subject: 'অ্যাপয়েন্টমেন্ট সময় পরিবর্তন সমস্যা',
          category: 'অ্যাপয়েন্টমেন্ট',
          priority: 'জরুরী',
          status: 'সমাধান সম্পন্ন (Resolved)',
          date: '২৫ জুলাই, ২০২৬',
          estimatedTime: 'সম্পন্ন',
          note: 'আপনার ডাক্তারের সাথে কথা বলে সিরিয়াল সময় পুনরায় নিশ্চিত করা হয়েছে।'
        })
      } else {
        setSearchedTicketResult(null)
        setStatusError(`টিকিট আইডি "${cleanId}" সিস্টেমের রেকর্ডে পাওয়া যায়নি। অনুগ্ৰহ করে সঠিক আইডি প্রদান করুন।`)
      }
    }
  }

  // Handle Callback Form Submit
  const handleCallbackSubmit = async (e) => {
    e.preventDefault()
    if (!callbackPhone) return
    setCallbackSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    setCallbackSubmitting(false)
    setShowCallbackModal(false)
    setCallbackPhone('')
  }

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 100 }}>
      {/* ── CSS FOR RESPONSIVE COMPACT MOBILE VIEW ── */}
      <style>{`
        @media (max-width: 768px) {
          .support-hero-section {
            padding: 0 0 42px !important;
          }
          .support-hero-title {
            font-size: 21px !important;
            margin-bottom: 8px !important;
          }
          .support-hero-desc {
            font-size: 13px !important;
            line-height: 1.5 !important;
          }
          .support-quick-cards-container {
            margin-top: -24px !important;
          }
          .support-quick-card {
            padding: 12px 14px !important;
            border-radius: 14px !important;
            gap: 12px !important;
          }
          .support-quick-card-icon {
            width: 38px !important;
            height: 38px !important;
            border-radius: 10px !important;
          }
          .support-quick-card-icon svg {
            width: 18px !important;
            height: 18px !important;
          }
          .support-quick-card-label {
            font-size: 10px !important;
          }
          .support-quick-card-value {
            font-size: 13.5px !important;
          }
          .support-tabs-container {
            margin-top: 20px !important;
          }
          .support-tabs-nav {
            padding: 4px !important;
            border-radius: 14px !important;
            margin-bottom: 16px !important;
            gap: 4px !important;
          }
          .support-tab-btn {
            padding: 8px 10px !important;
            font-size: 12px !important;
            border-radius: 10px !important;
          }
          .support-tab-btn svg {
            width: 14px !important;
            height: 14px !important;
          }
          .support-content-card {
            padding: 20px 16px !important;
            border-radius: 16px !important;
          }
          .support-cat-chip {
            padding: 5px 12px !important;
            font-size: 12px !important;
          }
          .support-faq-q-btn {
            padding: 14px 14px !important;
          }
          .support-faq-q-text {
            font-size: 13.5px !important;
          }
          .support-faq-answer {
            padding: 0 14px 14px 44px !important;
            font-size: 13px !important;
          }
        }
      `}</style>

      {/* ── HERO SECTION (ELEGANT & NO SEARCHBAR) ── */}
      <section className="support-hero-section" style={{ 
        background: 'linear-gradient(135deg, #013A28 0%, #006644 50%, #00B875 100%)', 
        padding: '0 0 85px', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Ambient Glows */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -120, left: -120, width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,184,117,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <BreadcrumbHUD links={[{ label: 'সাপোর্ট ও সাহায্য কেন্দ্র' }]} variant="light" />

        <Container style={{ position: 'relative', zIndex: 2, marginTop: 16 }}>
          <Row className="justify-content-center text-center">
            <Col lg={8} md={10}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.15)', 
                backdropFilter: 'blur(12px)',
                padding: '6px 20px', 
                borderRadius: 99, 
                fontSize: 12.5, 
                fontWeight: 800,
                marginBottom: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#DCFCE7'
              }}>
                <Sparkles size={15} color="#34D399" />
                <span>২৪/৭ অফিসিয়াল কাস্টমার কেয়ার ও হেল্প ডেসক</span>
              </div>

              <h1 className="support-hero-title" style={{ 
                fontSize: 'clamp(28px, 4.5vw, 48px)', 
                fontWeight: 900, 
                marginBottom: 14, 
                lineHeight: 1.25,
                letterSpacing: '-0.5px' 
              }}>
                {support.title || 'আপনার স্বাস্থ্যসেবায় আমাদের সার্বক্ষণিক সহায়তা'}
              </h1>

              <p className="support-hero-desc" style={{ 
                fontSize: 'clamp(14.5px, 1.8vw, 17px)', 
                opacity: 0.92, 
                lineHeight: 1.65, 
                maxWidth: 640, 
                margin: '0 auto',
                fontWeight: 400 
              }}>
                {faqData.subtitle || 'Doctor Booklet অ্যাপয়েন্টমেন্ট, পেমেন্ট, ও ডিজিটাল সেবা সংক্রান্ত যেকোনো তথ্যের জন্য সচরাচর প্রশ্নাবলী দেখুন অথবা সাপোর্ট টিকিট জমা দিন।'}
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── 3 QUICK CONTACT CHANNELS (FLOATING OVER HERO) ── */}
      <Container className="support-quick-cards-container" style={{ marginTop: -45, position: 'relative', zIndex: 10 }}>
        <Row className="g-2 g-md-3 justify-content-center">
          {/* Card 1: Helpline */}
          <Col md={4} xs={12}>
            <div className="support-quick-card" style={{
              background: 'white',
              borderRadius: 20,
              padding: '22px 20px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              height: '100%',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#00B875' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)' }}
            >
              <div className="support-quick-card-icon" style={{ width: 48, height: 48, borderRadius: 14, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #DCFCE7' }}>
                <PhoneCall size={22} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div className="support-quick-card-label" style={{ fontSize: 11.5, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>২৪/৭ ফোন হেল্পলাইন</div>
                <a href={`tel:${site.phone || '017XXXXXXXX'}`} className="support-quick-card-value" style={{ color: '#0F172A', fontWeight: 900, fontSize: 16, textDecoration: 'none', display: 'block', lineHeight: 1.2 }}>
                  {site.phone || '017 XXXX XXXX'}
                </a>
              </div>
            </div>
          </Col>

          {/* Card 2: Create Ticket */}
          <Col md={4} xs={6}>
            <div 
              onClick={() => setActiveMainTab('ticket')}
              className="support-quick-card"
              style={{
                background: 'white',
                borderRadius: 20,
                padding: '22px 20px',
                border: activeMainTab === 'ticket' ? '2px solid #00B875' : '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#00B875' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; if (activeMainTab !== 'ticket') e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)' }}
            >
              <div className="support-quick-card-icon" style={{ width: 48, height: 48, borderRadius: 14, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #DBEAFE' }}>
                <Ticket size={22} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div className="support-quick-card-label" style={{ fontSize: 11.5, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>অনলাইন সাপোর্ট টিকিট</div>
                <div className="support-quick-card-value" style={{ color: '#0F172A', fontWeight: 900, fontSize: 15, lineHeight: 1.2 }}>
                  টিকিট তৈরি করুন ➔
                </div>
              </div>
            </div>
          </Col>

          {/* Card 3: Call Back Request */}
          <Col md={4} xs={6}>
            <div 
              onClick={() => setShowCallbackModal(true)}
              className="support-quick-card"
              style={{
                background: 'white',
                borderRadius: 20,
                padding: '22px 20px',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#00B875' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)' }}
            >
              <div className="support-quick-card-icon" style={{ width: 48, height: 48, borderRadius: 14, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #FDE68A' }}>
                <Headphones size={22} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div className="support-quick-card-label" style={{ fontSize: 11.5, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>কল ব্যাক সুবিধা</div>
                <div className="support-quick-card-value" style={{ color: '#0F172A', fontWeight: 900, fontSize: 15, lineHeight: 1.2 }}>
                  কল ব্যাক রিকোয়েস্ট 📞
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* ── MAIN CONTENT AREA (CLEAN TABS & GRID LAYOUT) ── */}
      <Container className="support-tabs-container" id="support-tabs-container" style={{ marginTop: 36 }}>
        
        {/* TAB NAVIGATION HEADER BAR */}
        <div className="support-tabs-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'white',
          padding: '8px',
          borderRadius: 18,
          border: '1px solid #E2E8F0',
          marginBottom: 28,
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveMainTab('faq')}
            className="support-tab-btn"
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 14,
              border: 'none',
              background: activeMainTab === 'faq' ? '#00B875' : 'transparent',
              color: activeMainTab === 'faq' ? 'white' : '#64748B',
              fontWeight: 800,
              fontSize: 14.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.25s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <HelpCircle size={18} /> সচরাচর জিজ্ঞাসা (FAQ)
          </button>

          <button
            onClick={() => setActiveMainTab('ticket')}
            className="support-tab-btn"
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 14,
              border: 'none',
              background: activeMainTab === 'ticket' ? '#00B875' : 'transparent',
              color: activeMainTab === 'ticket' ? 'white' : '#64748B',
              fontWeight: 800,
              fontSize: 14.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.25s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Ticket size={18} /> নতুন সাপোর্ট টিকিট জমা
          </button>

          <button
            onClick={() => setActiveMainTab('status')}
            className="support-tab-btn"
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 14,
              border: 'none',
              background: activeMainTab === 'status' ? '#00B875' : 'transparent',
              color: activeMainTab === 'status' ? 'white' : '#64748B',
              fontWeight: 800,
              fontSize: 14.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.25s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Search size={18} /> টিকিট স্ট্যাটাস ট্র্যাক
          </button>
        </div>

        <Row className="g-4">
          {/* MAIN LEFT CONTENT */}
          <Col lg={8}>
            
            {/* ── TAB 1: FAQ ACCORDION HUB ── */}
            {activeMainTab === 'faq' && (
              <div className="support-content-card" style={{
                background: 'white',
                borderRadius: 24,
                padding: '32px 28px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 25px rgba(0,0,0,0.03)'
              }}>
                {/* Header & Filter Row */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ background: '#F0FDF4', color: '#064E3B', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 8, border: '1px solid #DCFCE7' }}>
                    {faqData.badge || 'সচরাচর জিজ্ঞাসা'}
                  </span>
                  <h3 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>{faqData.title || 'সাধারণ প্রশ্নাবলী ও সমাধান'}</span>
                  </h3>
                </div>

                {/* CATEGORY FILTER CHIPS */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                  {categories.map(cat => {
                    const isActive = activeCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className="support-cat-chip"
                        style={{
                          background: isActive ? '#00B875' : '#F8FAFC',
                          color: isActive ? 'white' : '#475569',
                          border: isActive ? '1px solid #00B875' : '1px solid #E2E8F0',
                          padding: '7px 16px',
                          borderRadius: 99,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* FAQ List Render */}
                {filteredFaqs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredFaqs.map((item, index) => {
                      const id = item.id || index + 1
                      const isOpen = openFaqId === id
                      const vote = votedFaqs[id]

                      return (
                        <div
                          key={id}
                          style={{
                            borderRadius: 16,
                            border: isOpen ? '1.5px solid #00B875' : '1px solid #E8EDF2',
                            background: 'white',
                            overflow: 'hidden',
                            transition: 'all 0.25s ease',
                            boxShadow: isOpen ? '0 4px 20px rgba(0,184,117,0.12)' : '0 1px 4px rgba(0,0,0,0.03)'
                          }}
                        >
                          {/* Question Row */}
                          <button
                            onClick={() => toggleFaq(id)}
                            style={{
                              width: '100%',
                              padding: '16px 20px',
                              background: isOpen ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' : 'white',
                              border: 'none',
                              textAlign: 'left',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 14,
                              cursor: 'pointer',
                              fontFamily: "'Hind Siliguri', sans-serif",
                              transition: 'background 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                              <div style={{
                                width: 30,
                                height: 30,
                                borderRadius: 10,
                                background: isOpen ? '#00B875' : '#F1F5F9',
                                color: isOpen ? 'white' : '#64748B',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: 13,
                                flexShrink: 0
                              }}>
                                Q
                              </div>
                              <span style={{ fontWeight: 700, fontSize: 15, color: isOpen ? '#02382B' : '#1E293B', lineHeight: 1.45 }}>
                                {item.q}
                              </span>
                            </div>
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: isOpen ? '#00B875' : '#F1F5F9',
                              color: isOpen ? 'white' : '#94A3B8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.2s ease'
                            }}>
                              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          {/* Answer Row */}
                          {isOpen && (
                            <div style={{
                              padding: '0 20px 18px 62px',
                              borderTop: '1px solid #DCFCE7'
                            }}>
                              <div style={{
                                paddingTop: 12,
                                fontSize: 14,
                                color: '#475569',
                                lineHeight: 1.8,
                                fontWeight: 450
                              }}>
                                {item.a}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FAFAFA', borderRadius: 20, border: '1.5px dashed #CBD5E1' }}>
                    <HelpCircle size={40} color="#94A3B8" style={{ marginBottom: 10 }} />
                    <h5 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>কোনো তথ্য পাওয়া যায়নি</h5>
                    <button
                      onClick={() => setActiveCategory('all')}
                      style={{
                        background: '#00B875', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer', marginTop: 12
                      }}
                    >
                      ফিল্টার রিসেট করুন
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: SUPPORT TICKET SUBMISSION FORM ── */}
            {activeMainTab === 'ticket' && (
              <div style={{
                background: 'white',
                borderRadius: 24,
                padding: '36px 30px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 25px rgba(0,0,0,0.03)'
              }}>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ background: '#F0FDF4', color: '#064E3B', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 8, border: '1px solid #DCFCE7' }}>
                    অনলাইন সাপোর্ট টিকিট
                  </span>
                  <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 22, margin: '0 0 6px' }}>
                    নতুন সাপোর্ট টিকিট জমা দিন
                  </h3>
                  <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
                    আপনার সমস্যার তথ্য নিচে পূরণ করুন। আমাদের কাস্টমার সাপোর্ট টিম ২ ঘণ্টার মধ্যে আপনার টিকিটের উত্তর দেবে।
                  </p>
                </div>

                <form onSubmit={handleTicketSubmit}>
                  <Row className="g-3">
                    <Col md={6}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        আপনার নাম <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        required
                        value={ticketForm.name}
                        onChange={e => setTicketForm({ ...ticketForm, name: e.target.value })}
                        placeholder="উদাঃ সাকিব হাসান"
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14 }}
                      />
                    </Col>

                    <Col md={6}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        মোবাইল নম্বর / ইমেইল <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        required
                        value={ticketForm.contact}
                        onChange={e => setTicketForm({ ...ticketForm, contact: e.target.value })}
                        placeholder="017XXXXXXXX / email@example.com"
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14 }}
                      />
                    </Col>

                    <Col md={6}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        সমস্যার ক্যাটাগরি <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        value={ticketForm.category}
                        onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14, cursor: 'pointer', background: 'white' }}
                      >
                        <option value="অ্যাপয়েন্টমেন্ট সমস্যা">অ্যাপয়েন্টমেন্ট সমস্যা</option>
                        <option value="পেমেন্ট ও রিফান্ড">পেমেন্ট ও রিফান্ড</option>
                        <option value="ভিডিও কল সমস্যা">ভিডিও কল সমস্যা</option>
                        <option value="ডাক্তার সম্পর্কিত তথ্য">ডাক্তার সম্পর্কিত তথ্য</option>
                        <option value="অন্যান্য জিজ্ঞাসা">অন্যান্য জিজ্ঞাসা</option>
                      </select>
                    </Col>

                    <Col md={6}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        জরুরি মাত্রা (Priority) <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        value={ticketForm.priority}
                        onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14, cursor: 'pointer', background: 'white' }}
                      >
                        <option value="সাধারণ">সাধারণ (Normal)</option>
                        <option value="জরুরী">জরুরী (High Priority)</option>
                        <option value="অত্যন্ত জরুরী">অত্যন্ত জরুরী (Critical)</option>
                      </select>
                    </Col>

                    <Col md={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        বিষয়ের শিরোনাম <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        required
                        value={ticketForm.subject}
                        onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
                        placeholder="উদাঃ বিকাশ পেমেন্ট সম্পন্ন কিন্তু স্লট কনফার্ম হয়নি"
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14 }}
                      />
                    </Col>

                    <Col md={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        সমস্যার বিস্তারিত বিবরণ <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={ticketForm.message}
                        onChange={e => setTicketForm({ ...ticketForm, message: e.target.value })}
                        placeholder="আপনার সমস্যাটি বিস্তারিত লিখুন..."
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14, resize: 'vertical' }}
                      />
                    </Col>

                    <Col md={12} className="mt-3">
                      <button
                        type="submit"
                        disabled={ticketSubmitting}
                        style={{
                          background: 'linear-gradient(135deg, #064E3B, #00B875)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 14,
                          padding: '14px 28px',
                          fontWeight: 800,
                          fontSize: 15,
                          cursor: 'pointer',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                          boxShadow: '0 6px 20px rgba(0,184,117,0.25)'
                        }}
                      >
                        {ticketSubmitting ? 'টিকিট জমা হচ্ছে...' : <><Ticket size={18} /> টিকিট সাবমিট করুন</>}
                      </button>
                    </Col>
                  </Row>
                </form>

                {submittedTicket && (
                  <div style={{ marginTop: 24, padding: 20, background: '#F0FDF4', borderRadius: 16, border: '1.5px solid #22C55E' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 900, color: '#15803D', fontSize: 15 }}>
                        ✅ সফলভাবে টিকিট তৈরি হয়েছে!
                      </span>
                      <span style={{ background: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '3px 10px', borderRadius: 99, fontSize: 12 }}>
                        আইডি: {submittedTicket.id}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 13.5, color: '#166534' }}>
                      আপনার টিকিট নম্বর <strong>{submittedTicket.id}</strong> সংরক্ষণ করুন। "টিকিট স্ট্যাটাস ট্র্যাক" ট্যাবে আইডি দিয়ে আপডেট পাবেন।
                    </p>
                    <button
                      onClick={() => handleCopy(submittedTicket.id, 'ticketId')}
                      style={{ border: 'none', background: '#15803D', color: 'white', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {copiedText === 'ticketId' ? 'কপি সম্পন্ন!' : 'টিকিট আইডি কপি করুন'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: TICKET STATUS TRACKER ── */}
            {activeMainTab === 'status' && (
              <div style={{
                background: 'white',
                borderRadius: 24,
                padding: '36px 30px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 25px rgba(0,0,0,0.03)'
              }}>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ background: '#F0FDF4', color: '#064E3B', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 8, border: '1px solid #DCFCE7' }}>
                    লাইব টিকিট ট্র্যাকার
                  </span>
                  <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 22, margin: '0 0 6px' }}>
                    টিকিটের অগ্রগতি যাচাই করুন
                  </h3>
                  <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
                    আপনার টিকিট আইডি (উদাঃ TK-849201) প্রবেশ করিয়ে বর্তমান স্ট্যাটাস দেখুন।
                  </p>
                </div>

                <form onSubmit={handleSearchTicket} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      required
                      value={statusSearchId}
                      onChange={e => setStatusSearchId(e.target.value)}
                      placeholder="টিকিট আইডি দিন (উদাঃ TK-123456)..."
                      style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14 }}
                    />
                    <button
                      type="submit"
                      style={{
                        background: '#00B875', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      ট্র্যাক করুন
                    </button>
                  </div>
                  {/* Digital Platform Assistance Hotline Box */}
              <div style={{ 
                background: 'white', 
                borderRadius: 24, 
                padding: '24px 20px', 
                border: '1.5px solid #FFE4E6',
                boxShadow: '0 8px 25px rgba(239,68,68,0.06)',
                textAlign: 'center',
                marginTop: '20px'
              }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 16, 
                  background: '#FFE4E6', color: '#EF4444', 
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <AlertTriangle size={22} />
                </div>
                <h5 style={{ fontWeight: 900, marginBottom: 6, fontSize: 16, color: '#0F172A' }}>জরুরি বুকিং ও তথ্য হেল্পলাইন</h5>
                <p style={{ color: '#64748B', fontSize: 12.5, marginBottom: 16, lineHeight: 1.5 }}>
                  Doctor Booklet ডিজিটাল প্ল্যাটফর্ম সম্পর্কিত যেকোনো তথ্য ও বুকিং সহায়তার জন্য কল করুন
                </p>
                <a 
                  href={`tel:${site.phone || '09638649314'}`} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    background: '#EF4444', 
                    color: 'white', 
                    padding: '12px 20px', 
                    borderRadius: 99, 
                    fontWeight: 900, 
                    fontSize: 16,
                    textDecoration: 'none',
                    boxShadow: '0 6px 20px rgba(239,68,68,0.28)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Phone size={18} />
                  <span>{site.phone || '09638649314'}</span>
                </a>
              </div>
                </form>

                {statusError && (
                  <div style={{ padding: 14, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, color: '#991B1B', fontSize: 13.5, fontWeight: 600 }}>
                    ⚠️ {statusError}
                  </div>
                )}

                {searchedTicketResult && (
                  <div style={{ padding: 20, background: '#F8FAFC', borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>টিকিট আইডি: {searchedTicketResult.id}</span>
                      <span style={{ background: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '4px 12px', borderRadius: 99, fontSize: 12 }}>
                        {searchedTicketResult.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      বিষয়: {searchedTicketResult.subject}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>
                      তারিখ: {searchedTicketResult.date} | অগ্রাধিকার: {searchedTicketResult.priority}
                    </div>
                    {searchedTicketResult.note && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #CBD5E1', fontSize: 13, color: '#0F172A', fontWeight: 600 }}>
                        গড় আপডেট: {searchedTicketResult.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Col>

          {/* RIGHT SIDEBAR (PROFESSIONAL STATS & HOTLINES) */}
          <Col lg={4}>
            <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Direct Channels Box */}
              <div style={{
                background: 'white',
                borderRadius: 20,
                padding: '24px 22px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 6px 20px rgba(0,0,0,0.03)'
              }}>
                <h5 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 16, fontSize: 16 }}>
                  সাপোর্ট চ্যানেলসমূহ
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Phone */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Phone size={18} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>২৪/৭ হেল্পলাইন হটলাইন</div>
                      <a href={`tel:${site.phone || '017XXXXXXXX'}`} style={{ color: '#0F172A', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
                        {site.phone || '017 XXXX XXXX'}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail size={18} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>ইমেইল সাপোর্ট</div>
                      <a href={`mailto:${site.email_support || 'support@doctorbooklet.com.bd'}`} style={{ color: '#0F172A', fontWeight: 800, fontSize: 13, textDecoration: 'none', wordBreak: 'break-all' }}>
                        {site.email_support || 'support@doctorbooklet.com.bd'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Hours Box */}
              <div style={{ 
                background: '#0F172A', 
                borderRadius: 20, 
                padding: '24px 22px', 
                color: 'white',
                backgroundImage: 'radial-gradient(circle at top right, rgba(0,184,117,0.25), transparent 70%)',
                boxShadow: '0 8px 24px rgba(15,23,42,0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00B875' }}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 800, margin: 0, fontSize: 15 }}>অফিস সময়সূচী</h5>
                    <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>● লাইভ সাপোর্ট সক্রিয়</span>
                  </div>
                </div>
                <p style={{ opacity: 0.85, fontSize: 12.5, lineHeight: 1.6, marginBottom: 12 }}>
                  {site.office_hours || 'শনিবার - বৃহস্পতিবার: সকাল ৯টা - রাত ৮টা | শুক্রবার: বন্ধ'}
                </p>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 12 }} />
                <p style={{ fontSize: 11.5, fontWeight: 700, color: '#34D399', margin: 0 }}>
                  গড় টিকিট রেসপন্স সময়: ২ ঘণ্টা
                </p>
              </div>

              {/* Emergency Box matching user screenshot */}
              <div style={{ 
                background: 'white', 
                borderRadius: 24, 
                padding: '24px 20px', 
                border: '1.5px solid #FFE4E6',
                boxShadow: '0 8px 25px rgba(239,68,68,0.06)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 16, 
                  background: '#FFE4E6', color: '#EF4444', 
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <AlertTriangle size={24} />
                </div>
                <h5 style={{ fontWeight: 900, marginBottom: 6, fontSize: 16, color: '#0F172A' }}>জরুরি চিকিৎসা হেল্পলাইন</h5>
                <p style={{ color: '#64748B', fontSize: 12.5, marginBottom: 16, lineHeight: 1.5 }}>
                  জরুরি অ্যাম্বুলেন্স বা সরাসরি পরামর্শের জন্য ডায়াল করুন
                </p>
                <a 
                  href={`tel:${site.phone || '09638649314'}`} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    background: '#EF4444', 
                    color: 'white', 
                    padding: '12px 20px', 
                    borderRadius: 99, 
                    fontWeight: 900, 
                    fontSize: 16,
                    textDecoration: 'none',
                    boxShadow: '0 6px 20px rgba(239,68,68,0.28)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Phone size={18} />
                  <span>{site.phone || '09638649314'}</span>
                </a>
              </div>

            </div>
          </Col>
        </Row>
      </Container>

      {/* ── CALLBACK REQUEST MODAL ── */}
      <Modal show={showCallbackModal} onHide={() => setShowCallbackModal(false)} centered rounded size="md">
        <Modal.Header closeButton style={{ border: 'none', padding: '24px 28px 0' }}>
          <Modal.Title style={{ fontWeight: 800, fontSize: 18, color: '#0F172A' }}>
            📞 কল ব্যাক রিকোয়েস্ট করুন
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '16px 28px 28px' }}>
          <p style={{ color: '#64748B', fontSize: 13.5, marginBottom: 16 }}>
            আপনার ফোন নম্বর প্রদান করুন, আমাদের প্রতিনিধি নির্ধারিত সময়ের মধ্যে আপনাকে কল করবেন।
          </p>
          <form onSubmit={handleCallbackSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                আপনার মোবাইল নম্বর <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                required
                type="tel"
                value={callbackPhone}
                onChange={e => setCallbackPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                পছন্দের কল সময়
              </label>
              <select
                value={callbackTime}
                onChange={e => setCallbackTime(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14, background: 'white' }}
              >
                <option value="এখনই (Next 15 min)">এখনই (১৫ মিনিটের মধ্যে)</option>
                <option value="সকাল ১০টা - দুপুর ১২টা">সকাল ১০টা - দুপুর ১২টা</option>
                <option value="দুপুর ২টা - বিকাল ৫টা">দুপুর ২টা - বিকাল ৫টা</option>
                <option value="সন্ধ্যা ৬টা - রাত ৮টা">সন্ধ্যা ৬টা - রাত ৮টা</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={callbackSubmitting}
              style={{
                width: '100%',
                background: '#00B875',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              {callbackSubmitting ? 'প্রসেসিং হচ্ছে...' : 'রিকোয়েস্ট সাবমিট করুন'}
            </button>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  )
}

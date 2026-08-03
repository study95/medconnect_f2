import React, { useState, useMemo } from 'react'
import { Container, Row, Col, Modal } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'
import { getContent } from '../../utils/contentService'
import { 
  Phone, Mail, HelpCircle, MessageSquare, Clock, ShieldCheck, 
  Search, ChevronDown, ChevronUp, ArrowRight, LifeBuoy, Sparkles,
  CheckCircle2, AlertTriangle, Send, RefreshCw, ThumbsUp, ThumbsDown,
  Ticket, FileText, CheckCircle, Headphones, User, PhoneCall, Filter,
  ExternalLink, Copy
} from 'lucide-react'
import BreadcrumbHUD from '../../components/common/BreadcrumbHUD'
import { toast } from 'react-toastify'

export default function SupportPage() {
  const navigate = useNavigate()
  const cms = getContent()
  const site = cms.site || {}
  const support = cms.support || {}
  const faqData = cms.faq || {}

  // Active state tabs: 'faq' | 'ticket' | 'status'
  const [activeMainTab, setActiveMainTab] = useState('faq')
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
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

  // Default master FAQ items (with robust fallbacks)
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

    // Normalize & attach fallback categories & IDs
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

  // Filter FAQs by Search Query & Category
  const filteredFaqs = useMemo(() => {
    return rawItems.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory
      const query = searchQuery.trim().toLowerCase()
      const matchSearch = !query || item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
      return matchCategory && matchSearch
    })
  }, [rawItems, activeCategory, searchQuery])

  const toggleFaq = (id) => {
    setOpenFaqId(prev => (prev === id ? null : id))
  }

  const handleVote = (id, type) => {
    setVotedFaqs(prev => ({ ...prev, [id]: type }))
    toast.success(type === 'up' ? 'ধন্যবাদ! আপনার প্রতিক্রিয়া রেকর্ড করা হয়েছে।' : 'মতামতের জন্য ধন্যবাদ। আমরা তথ্যটি আরও উন্নত করছি।')
  }

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedText(field)
    toast.info(`${text} কপি করা হয়েছে!`)
    setTimeout(() => setCopiedText(null), 2000)
  }

  // Handle Ticket Submission
  const handleTicketSubmit = async (e) => {
    e.preventDefault()
    if (!ticketForm.name || !ticketForm.contact || !ticketForm.subject || !ticketForm.message) {
      toast.error('অনুগ্ৰহ করে সমস্ত প্রয়োজনীয় ঘর পূরণ করুন।')
      return
    }
    setTicketSubmitting(true)
    await new Promise(r => setTimeout(r, 1000))
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
    toast.success(`সাপোর্ট টিকিট #${ticketId} তৈরি হয়েছে!`)
    setTicketForm({ name: '', contact: '', category: 'অ্যাপয়েন্টমেন্ট সমস্যা', priority: 'সাধারণ', subject: '', message: '' })
  }

  // Handle Ticket Search
  const handleSearchTicket = (e) => {
    e.preventDefault()
    setStatusError('')
    if (!statusSearchId.trim()) {
      toast.error('অনুগ্ৰহ করে একটি সঠিক টিকিট আইডি প্রদান করুন।')
      return
    }
    const cleanId = statusSearchId.trim().toUpperCase()
    if (submittedTicket && submittedTicket.id.toUpperCase() === cleanId) {
      setSearchedTicketResult(submittedTicket)
    } else {
      // Mock result for demo check
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
    if (!callbackPhone) {
      toast.error('আপনার মোবাইল নম্বরটি লিখুন।')
      return
    }
    setCallbackSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    setCallbackSubmitting(false)
    setShowCallbackModal(false)
    toast.success(`ধন্যবাদ! আমাদের সাপোর্ট টিম শীঘ্রই ${callbackPhone} নম্বরে কল করবে।`)
    setCallbackPhone('')
  }

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 100 }}>
      {/* ── HERO SECTION ── */}
      <section style={{ 
        background: 'linear-gradient(135deg, #004D40 0%, #00796B 50%, #00A88C 100%)', 
        padding: '0 0 110px', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Ambient Spheres */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -140, left: -140, width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,201,167,0.22) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />

        <BreadcrumbHUD links={[{ label: 'সাপোর্ট ও সাহায্য কেন্দ্র' }]} variant="light" />

        <Container style={{ position: 'relative', zIndex: 2, marginTop: 20 }}>
          <Row className="justify-content-center text-center">
            <Col lg={9} md={11}>
              <div style={{ 
                background: 'rgba(255,255,255,0.16)', 
                backdropFilter: 'blur(12px)',
                padding: '6px 22px', 
                borderRadius: 99, 
                fontSize: 13, 
                fontWeight: 800,
                marginBottom: 20,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid rgba(255,255,255,0.28)',
                color: '#E6FFFA'
              }}>
                <LifeBuoy size={16} />
                <span>২৪/৭ অফিসিয়াল কাস্টমার সাপোর্ট কেয়ার</span>
              </div>

              <h1 style={{ 
                fontSize: 'clamp(32px, 5.2vw, 54px)', 
                fontWeight: 900, 
                marginBottom: 16, 
                lineHeight: 1.25,
                letterSpacing: '-0.5px' 
              }}>
                {support.title || 'আমরা আপনাকে কীভাবে সাহায্য করতে পারি?'}
              </h1>

              <p style={{ 
                fontSize: 'clamp(15px, 2vw, 18px)', 
                opacity: 0.92, 
                lineHeight: 1.7, 
                maxWidth: 680, 
                margin: '0 auto 36px',
                fontWeight: 400 
              }}>
                {faqData.subtitle || 'Doctor Booklet সম্পর্কিত সাধারণ জিজ্ঞাসা খুঁজুন, নতুন সাপোর্ট টিকিট তৈরি করুন অথবা সরাসরি আমাদের প্রতিনিধির সাথে যোগাযোগ করুন।'}
              </p>

              {/* LIVE FAQ SEARCH INPUT */}
              <div style={{ maxWidth: 660, margin: '0 auto 24px', position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'white',
                  borderRadius: 22,
                  padding: '8px 12px 8px 24px',
                  boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
                  border: '2px solid rgba(255,255,255,0.85)'
                }}>
                  <Search size={22} color="#00A88C" style={{ marginRight: 12, flexShrink: 0 }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (activeMainTab !== 'faq') setActiveMainTab('faq')
                    }}
                    placeholder="প্রশ্ন লিখুন (উদাঃ অ্যাপয়েন্টমেন্ট বাতিল, পেমেন্ট, ওটিপি, ভিডিও কল)..."
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontSize: 15,
                      fontFamily: "'Hind Siliguri', sans-serif",
                      color: '#0F172A',
                      background: 'transparent',
                      fontWeight: 600
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        border: 'none',
                        background: '#F1F5F9',
                        color: '#64748B',
                        borderRadius: '50%',
                        width: 30,
                        height: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        fontSize: 13,
                        cursor: 'pointer',
                        marginRight: 8
                      }}
                    >
                      ✕
                    </button>
                  )}
                  <div style={{
                    background: 'linear-gradient(135deg, #00796B, #00A88C)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: 16,
                    fontSize: 15,
                    fontWeight: 800,
                    whiteSpace: 'nowrap'
                  }}>
                    খুঁজুন
                  </div>
                </div>
              </div>

            </Col>
          </Row>
        </Container>
      </section>

      {/* ── MAIN CONTENT AREA (SUPPORT TABS & PANELS) ── */}
      <Container id="support-tabs-container" style={{ marginTop: 60 }}>


        <Row className="g-5">
          {/* MAIN LEFT PANEL */}
          <Col lg={8}>
            {/* ── TAB 1: FAQ ACCORDION HUB ── */}
            {activeMainTab === 'faq' && (
              <div style={{
                background: 'white',
                borderRadius: 32,
                padding: '40px 36px',
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 12px 35px rgba(0,0,0,0.04)'
              }}>
                {/* Header & Filter Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
                  <div>
                    <span style={{ background: '#E6FFFA', color: '#00796B', fontSize: 13, fontWeight: 800, padding: '5px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 8 }}>
                      {faqData.badge || 'সচরাচর জিজ্ঞাসা'}
                    </span>
                    <h3 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <HelpCircle color="#00A88C" size={28} />
                      <span>{faqData.title || 'সচরাচর জিজ্ঞাসা (FAQ)'}</span>
                    </h3>
                  </div>
                  <span style={{ fontSize: 13, color: '#64748B', fontWeight: 700, background: '#F1F5F9', padding: '6px 14px', borderRadius: 99 }}>
                    মোট {filteredFaqs.length} টি উত্তর পাওয়া গেছে
                  </span>
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
                            border: isOpen ? '1.5px solid #00A88C' : '1.5px solid #E8EDF2',
                            background: 'white',
                            overflow: 'hidden',
                            transition: 'all 0.25s ease',
                            boxShadow: isOpen ? '0 4px 20px rgba(0,168,140,0.10)' : '0 1px 4px rgba(0,0,0,0.04)'
                          }}
                        >
                          {/* Question Row */}
                          <button
                            onClick={() => toggleFaq(id)}
                            style={{
                              width: '100%',
                              padding: '18px 22px',
                              background: isOpen ? 'linear-gradient(135deg, #F0FDF9 0%, #E6FFFA 100%)' : 'white',
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                              <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: isOpen ? '#00A88C' : '#F1F5F9',
                                color: isOpen ? 'white' : '#64748B',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: 13,
                                flexShrink: 0,
                                letterSpacing: '0.5px'
                              }}>
                                Q
                              </div>
                              <span style={{ fontWeight: 700, fontSize: 15, color: isOpen ? '#004D40' : '#1E293B', lineHeight: 1.5 }}>
                                {item.q}
                              </span>
                            </div>
                            <div style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: isOpen ? '#00A88C' : '#F1F5F9',
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
                              padding: '0 22px 20px 68px',
                              borderTop: '1px solid #E6FFFA'
                            }}>
                              <div style={{
                                paddingTop: 14,
                                fontSize: 14,
                                color: '#475569',
                                lineHeight: 1.85,
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
                  <div style={{ textAlign: 'center', padding: '50px 20px', background: '#FAFAFA', borderRadius: 24, border: '1.5px dashed #CBD5E1' }}>
                    <HelpCircle size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
                    <h5 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>কোনো প্রশ্ন পাওয়া যায়নি</h5>
                    <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
                      "{searchQuery}" ফিল্টারের সমতুল্য কোনো তথ্য নেই।
                    </p>
                    <button
                      onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                      style={{
                        background: '#00A88C',
                        color: 'white',
                        border: 'none',
                        borderRadius: 14,
                        padding: '12px 24px',
                        fontWeight: 800,
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <RefreshCw size={15} /> ফিল্টার রিসেট করুন
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: SUPPORT TICKET SUBMISSION FORM ── */}
            {activeMainTab === 'ticket' && (
              <div style={{
                background: 'white',
                borderRadius: 32,
                padding: '40px 36px',
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 12px 35px rgba(0,0,0,0.04)'
              }}>
                <div style={{ marginBottom: 28 }}>
                  <span style={{ background: '#E6FFFA', color: '#00796B', fontSize: 13, fontWeight: 800, padding: '5px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 8 }}>
                    অনলাইন টিকিট সাপোর্ট
                  </span>
                  <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 26, margin: '0 0 8px' }}>
                    নতুন সাপোর্ট টিকিট তৈরি করুন
                  </h3>
                  <p style={{ color: '#64748B', fontSize: 15, margin: 0 }}>
                    আপনার অ্যাপয়েন্টমেন্ট, পেমেন্ট বা প্রযুক্তিগত সমস্যার কথা জানান। আমাদের বিশেষজ্ঞ সাপোর্ট টিম দ্রুত টিকিট সমাধান করবে।
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
                        style={{ width: '100%', padding: '13px 18px', borderRadius: 14, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14 }}
                      />
                    </Col>
                    <Col md={6}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        ইমেইল বা মোবাইল নম্বর <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        required
                        value={ticketForm.contact}
                        onChange={e => setTicketForm({ ...ticketForm, contact: e.target.value })}
                        placeholder="017XXXXXXXX / email@example.com"
                        style={{ width: '100%', padding: '13px 18px', borderRadius: 14, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14 }}
                      />
                    </Col>

                    <Col md={6}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        টিকিট ক্যাটাগরি <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        value={ticketForm.category}
                        onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}
                        style={{ width: '100%', padding: '13px 18px', borderRadius: 14, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14, cursor: 'pointer', background: 'white' }}
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
                        style={{ width: '100%', padding: '13px 18px', borderRadius: 14, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14, cursor: 'pointer', background: 'white' }}
                      >
                        <option value="সাধারণ">সাধারণ (Normal)</option>
                        <option value="জরুরী">জরুরী (High Priority)</option>
                        <option value="অত্যন্ত জরুরী">অত্যন্ত জরুরী (Critical Emergency)</option>
                      </select>
                    </Col>

                    <Col md={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        বিষয়ের সংক্ষিপ্ত বিবরণ <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        required
                        value={ticketForm.subject}
                        onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
                        placeholder="উদাঃ বিকাশে পেমেন্ট কেটে নিয়েছে কিন্তু অ্যাপয়েন্টমেন্ট কনফার্ম হয়নি"
                        style={{ width: '100%', padding: '13px 18px', borderRadius: 14, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14 }}
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
                        style={{ width: '100%', padding: '13px 18px', borderRadius: 14, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14, resize: 'vertical' }}
                      />
                    </Col>

                    <Col md={12} className="mt-4">
                      <button
                        type="submit"
                        disabled={ticketSubmitting}
                        style={{
                          background: 'linear-gradient(135deg, #00796B, #00A88C)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 16,
                          padding: '16px 36px',
                          fontWeight: 800,
                          fontSize: 16,
                          cursor: 'pointer',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                          boxShadow: '0 8px 24px rgba(0,168,140,0.35)'
                        }}
                      >
                        {ticketSubmitting ? 'টিকিট জমা হচ্ছে...' : <><Ticket size={20} /> সাপোর্ট টিকিট সাবমিট করুন</>}
                      </button>
                    </Col>
                  </Row>
                </form>
                {submittedTicket && (
                  <div style={{ marginTop: 32, padding: 24, background: '#F0FDF4', borderRadius: 20, border: '2px solid #22C55E' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontWeight: 900, color: '#15803D', fontSize: 16 }}>
                        ✅ সফলভাবে নতুন টিকিট তৈরি হয়েছে!
                      </span>
                      <span style={{ background: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '4px 12px', borderRadius: 99, fontSize: 13 }}>
                        আইডি: {submittedTicket.id}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 14, color: '#166534' }}>
                      আপনার টিকিট নম্বর <strong>{submittedTicket.id}</strong> ভবিষ্যতের রেফারেন্সের জন্য সংরক্ষণ করুন।
                    </p>
                    <button
                      onClick={() => handleCopy(submittedTicket.id, 'ticketId')}
                      style={{ border: 'none', background: '#15803D', color: 'white', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {copiedText === 'ticketId' ? 'কপি সম্পন্ন!' : 'টিকিট আইডি কপি করুন'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Direct Contact Banner */}
            <div style={{
              marginTop: 32,
              padding: 28,
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              borderRadius: 28,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20
            }}>
              <div>
                <h5 style={{ fontWeight: 800, margin: '0 0 6px', fontSize: 18 }}>আপনার প্রশ্নের উত্তর খুঁজে পাননি?</h5>
                <p style={{ color: '#94A3B8', margin: 0, fontSize: 14 }}>আমাদের সরাসরি মেসেজ পাঠান অথবা সরাসরি সাপোর্ট সেন্টারে যোগাযোগ করুন।</p>
              </div>
              <button
                onClick={() => navigate('/contact')}
                style={{
                  background: '#00A88C',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                }}
              >
                <Send size={16} /> যোগাযোগ পেজ
              </button>
            </div>
          </Col>

          {/* RIGHT SIDEBAR PANEL */}
          <Col lg={4}>
            <div style={{ position: 'sticky', top: 100, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Direct Support Channels */}
              <div style={{
                background: 'white',
                borderRadius: 28,
                padding: 28,
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
              }}>
                <h5 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 20, fontSize: 17 }}>
                  সাপোর্ট যোগাযোগ মাধ্যম
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Phone */}
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A88C', flexShrink: 0 }}>
                      <Phone size={20} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>২৪/৭ হেল্পলাইন</div>
                      <a href={`tel:${site.phone || '017XXXXXXXX'}`} style={{ color: '#0F172A', fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
                        {site.phone || '017 XXXX XXXX'}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
                      <Mail size={20} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>অফিসিয়াল সাপোর্ট ইমেইল</div>
                      <a href={`mailto:${site.email_support || 'support@doctorbooklet.com.bd'}`} style={{ color: '#0F172A', fontWeight: 800, fontSize: 14, textDecoration: 'none', wordBreak: 'break-all' }}>
                        {site.email_support || 'support@doctorbooklet.com.bd'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Working Hours */}
              <div style={{ 
                background: '#0F172A', 
                borderRadius: 28, 
                padding: 28, 
                color: 'white',
                backgroundImage: 'radial-gradient(circle at top right, rgba(0,168,140,0.25), transparent 70%)',
                boxShadow: '0 12px 30px rgba(15,23,42,0.15)'
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C9A7', marginBottom: 16 }}>
                  <Clock size={22} />
                </div>
                <h5 style={{ fontWeight: 800, marginBottom: 10, fontSize: 18 }}>অফিস সময়সূচী</h5>
                <p style={{ opacity: 0.85, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                  {site.office_hours || 'শনিবার - বৃহস্পতিবার: সকাল ৯টা - রাত ৮টা | শুক্রবার: বন্ধ'}
                </p>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', marginBottom: 16 }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: '#00C9A7', margin: 0 }}>
                  ● সাধারণ টিকিট নিষ্পত্তির গড় সময় ২ ঘণ্টা
                </p>
              </div>

              {/* Emergency Hotline Box */}
              <div style={{ 
                background: 'white', 
                borderRadius: 28, 
                padding: 28, 
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 16, 
                  background: '#FFE4E6', color: '#EF4444', 
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14
                }}>
                  <AlertTriangle size={24} />
                </div>
                <h5 style={{ fontWeight: 800, marginBottom: 6, fontSize: 17, color: '#0F172A' }}>জরুরি চিকিৎসা সার্ভিস</h5>
                <p style={{ color: '#64748B', fontSize: 13, marginBottom: 18 }}>
                  জরুরি অ্যাম্বুলেন্স বা তাৎক্ষণিক ডাক্তারের পরামর্শে সরাসরি ডায়াল করুন
                </p>
                <a 
                  href={`tel:${site.phone || '999'}`} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: 8,
                    background: '#EF4444', 
                    color: 'white', 
                    padding: '12px 20px', 
                    borderRadius: 14, 
                    fontWeight: 800, 
                    fontSize: 14,
                    textDecoration: 'none',
                    boxShadow: '0 6px 18px rgba(239,68,68,0.35)'
                  }}
                >
                  <Phone size={16} />
                  <span>{site.phone || '017 XXXX XXXX'}</span>
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* ── CALLBACK REQUEST MODAL ── */}
      <Modal show={showCallbackModal} onHide={() => setShowCallbackModal(false)} centered rounded size="md">
        <Modal.Header closeButton style={{ border: 'none', padding: '24px 28px 0' }}>
          <Modal.Title style={{ fontWeight: 800, fontSize: 20, color: '#0F172A' }}>
            📞 কল ব্যাক রিকোয়েস্ট করুন
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px 28px 28px' }}>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
            আপনার ফোন নম্বর প্রদান করুন, আমাদের প্রতিনিধি নির্ধারিত সময়ের মধ্যে আপনাকে কল করবেন।
          </p>
          <form onSubmit={handleCallbackSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                আপনার মোবাইল নম্বর <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                required
                type="tel"
                value={callbackPhone}
                onChange={e => setCallbackPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                পছন্দের কল সময়
              </label>
              <select
                value={callbackTime}
                onChange={e => setCallbackTime(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14, background: 'white' }}
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
                background: '#00A88C',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 15,
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

import { useState } from 'react'
import { Row, Col, Form } from 'react-bootstrap'
import { getContent, saveContent } from '../../../utils/contentService'
import {
  IconStar, IconTrash, IconPlus, IconUpload, IconDeviceFloppy,
  IconCheck, IconMessage, IconBuildingHospital, IconHelp,
  IconHome, IconPhoto, IconLink, IconExternalLink,
  IconInfoCircle, IconHeadphones, IconPhone, IconFileText,
  IconShieldCheck, IconReceiptRefund, IconListNumbers, IconAlertCircle,
  IconTicket
} from '@tabler/icons-react'

const TABS = [
  { key: 'hero', label: 'হোম পেজ হিরো সেকশন', icon: <IconHome size={18} /> },
  { key: 'banners', label: 'স্লাইডার ব্যানার', icon: <IconPhoto size={18} /> },
  { key: 'testimonials', label: 'রোগীর রিভিউ (Testimonials)', icon: <IconMessage size={18} /> },
  { key: 'partners', label: 'সহযোগী হাসপাতাল (Partners)', icon: <IconBuildingHospital size={18} /> },
  { key: 'faq', label: 'সচরাচর জিজ্ঞাসা (FAQ)', icon: <IconHelp size={18} /> },
  { key: 'about_us', label: 'আমাদের সম্পর্কে (/about পেজ)', icon: <IconInfoCircle size={18} /> },
  { key: 'support', label: 'সাপোর্ট সেন্টার (/support পেজ)', icon: <IconHeadphones size={18} /> },
  { key: 'support_ticket', label: 'সাপোর্ট টিকিট ও অভিযোগ (/support ফর্ম)', icon: <IconTicket size={18} /> },
  { key: 'contact', label: 'যোগাযোগ ও অফিস (/contact পেজ)', icon: <IconPhone size={18} /> },
  { key: 'legal_terms', label: 'শর্তাবলী - Terms of Service (/legal)', icon: <IconFileText size={18} /> },
  { key: 'legal_privacy', label: 'গোপনীয়তা নীতি - Privacy Policy (/legal)', icon: <IconShieldCheck size={18} /> },
  { key: 'legal_refund', label: 'রিফান্ড ও বাতিলকরণ নীতি (/legal)', icon: <IconReceiptRefund size={18} /> },
]

function FieldInput({ label, value, onChange, multiline = false, rows = 3, placeholder = '' }) {
  const style = {
    background: '#FFFFFF',
    color: '#0F172A',
    border: '1.5px solid #E2E8F0',
    borderRadius: 8,
    padding: '10px 14px',
    fontFamily: "'Hind Siliguri', sans-serif",
    fontSize: 14,
    width: '100%',
    transition: 'all 0.2s ease',
    outline: 'none'
  }
  return (
    <Form.Group className="mb-3">
      {label && (
        <Form.Label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
          {label}
        </Form.Label>
      )}
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          style={{ ...style, resize: 'vertical' }}
          onFocus={e => { e.target.style.borderColor = '#00B875'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 184, 117, 0.12)' }}
          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={style}
          onFocus={e => { e.target.style.borderColor = '#00B875'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 184, 117, 0.12)' }}
          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }}
        />
      )}
    </Form.Group>
  )
}

/* ── 1. PATIENT TESTIMONIALS TAB ── */
function TestimonialsTab({ data, onChange }) {
  const items = data.items || []

  const updateItem = (i, key, val) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [key]: val }
    onChange('items', updated)
  }

  const addItem = () => {
    onChange('items', [
      {
        id: Date.now(),
        name: '',
        role: 'রোগী (ঢাকা)',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        comment: ''
      },
      ...items
    ])
  }

  const removeItem = (i) => {
    onChange('items', items.filter((_, idx) => idx !== i))
  }

  const handleImageUpload = (i, e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateItem(i, 'image', reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      <Row className="g-3 mb-4">
        <Col md={6}>
          <FieldInput
            label="সেকশন শিরোনাম"
            value={data.title || 'হাজারো রোগীর ভরসা ও সন্তুষ্টি'}
            onChange={v => onChange('title', v)}
          />
        </Col>
        <Col md={6}>
          <FieldInput
            label="সেকশন সাব-টাইটেল"
            value={data.subtitle || 'আমাদের সেবা ব্যবহার করে যারা তাদের পছন্দের বিশেষজ্ঞ ডাক্তার ও সঠিক চিকিৎসা সেবা নিশ্চিত করেছেন, তাদের কথা শুনুন।'}
            onChange={v => onChange('subtitle', v)}
          />
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 style={{ fontWeight: 800, margin: 0, color: '#0F172A', fontSize: 16 }}>
            রোগীদের রিভিউ কার্ডসমূহ ({items.length}টি)
          </h6>
          <span style={{ fontSize: 12.5, color: '#64748B' }}>হোমপেজে স্লাইডার আকারে প্রদর্শিত হবে</span>
        </div>
        <button
          type="button"
          onClick={addItem}
          style={{
            background: '#00B875',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)'
          }}
        >
          <IconPlus size={18} /> নতুন রিভিউ যোগ করুন
        </button>
      </div>

      <div className="d-flex flex-column gap-3">
        {items.map((item, i) => (
          <div
            key={item.id || i}
            style={{
              background: '#FFFFFF',
              borderRadius: 10,
              padding: '20px',
              border: '1.5px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span style={{ fontWeight: 800, color: '#00B875', fontSize: 13 }}>রিভিউ #{i + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                style={{
                  background: '#FEE2E2',
                  color: '#DC2626',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <IconTrash size={14} /> মুছে ফেলুন
              </button>
            </div>

            <Row className="g-3">
              <Col md={3}>
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={item.image || 'https://via.placeholder.com/150'}
                    alt={item.name}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #E2E8F0',
                      marginBottom: 10
                    }}
                  />
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#F1F5F9',
                    color: '#334155',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}>
                    <IconUpload size={14} /> ছবি আপলোড
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(i, e)} style={{ display: 'none' }} />
                  </label>
                </div>
              </Col>
              <Col md={9}>
                <Row className="g-2">
                  <Col md={6}>
                    <FieldInput label="রোগীর নাম" value={item.name} onChange={v => updateItem(i, 'name', v)} placeholder="উদা: ডা: আরমান হোসেন" />
                  </Col>
                  <Col md={6}>
                    <FieldInput label="পদবী / এলাকা" value={item.role} onChange={v => updateItem(i, 'role', v)} placeholder="উদা: রোগী (ঢাকা)" />
                  </Col>
                  <Col md={12}>
                    <FieldInput label="রোগীর মতামত / কমেন্ট" value={item.comment} onChange={v => updateItem(i, 'comment', v)} multiline rows={2} placeholder="সেবা সম্পর্কিত বিবরণ..." />
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 2. PARTNERS TAB ── */
function PartnersTab({ data, onChange }) {
  const items = data.items || []

  const updateItem = (i, key, val) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [key]: val }
    onChange('items', updated)
  }

  const addItem = () => {
    onChange('items', [
      { id: Date.now(), name: '', logo_url: 'https://via.placeholder.com/150' },
      ...items
    ])
  }

  const removeItem = (i) => {
    onChange('items', items.filter((_, idx) => idx !== i))
  }

  const handleLogoUpload = (i, e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => updateItem(i, 'logo_url', reader.result)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      <Row className="g-3 mb-4">
        <Col md={6}>
          <FieldInput label="সেকশন শিরোনাম" value={data.title || 'আমাদের সহযোগী হাসপাতালসমূহ'} onChange={v => onChange('title', v)} />
        </Col>
        <Col md={6}>
          <FieldInput label="সেকশন সাব-টাইটেল" value={data.subtitle || 'দেশজুড়ে নির্ভরযোগ্য হাসপাতাল ও ক্লিনিক্যাল সেন্টারসমূহ'} onChange={v => onChange('subtitle', v)} />
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 style={{ fontWeight: 800, margin: 0, color: '#0F172A', fontSize: 16 }}>
          পার্টনার হাসপাতাল তালিকা ({items.length}টি)
        </h6>
        <button
          type="button"
          onClick={addItem}
          style={{
            background: '#00B875',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <IconPlus size={18} /> নতুন পার্টনার যোগ করুন
        </button>
      </div>

      <Row className="g-3">
        {items.map((item, i) => (
          <Col md={6} key={item.id || i}>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <img src={item.logo_url} alt={item.name} style={{ width: 54, height: 54, objectFit: 'contain', border: '1px solid #E2E8F0', borderRadius: 8, padding: 4 }} />
                <div style={{ flex: 1 }}>
                  <FieldInput label="হাসপাতালের নাম" value={item.name} onChange={v => updateItem(i, 'name', v)} placeholder="উদা: স্কয়ার হাসপাতাল" />
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <label style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#00B875', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconUpload size={14} /> লোগো পরিবর্তন
                  <input type="file" accept="image/*" onChange={e => handleLogoUpload(i, e)} style={{ display: 'none' }} />
                </label>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  <IconTrash size={14} /> মুছুন
                </button>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  )
}

/* ── 3. HERO TAB ── */
function HeroTab({ data, onChange }) {
  return (
    <div>
      <Row className="g-3">
        <Col md={12}>
          <FieldInput label="টপ ব্যাজ টেক্সট" value={data.badge || ''} onChange={v => onChange('badge', v)} placeholder="বাংলাদেশের এক নম্বর স্বাস্থ্যসেবা প্ল্যাটফর্ম" />
        </Col>
        <Col md={12}>
          <FieldInput label="মূল শিরোনাম (Hero Title)" value={data.title || ''} onChange={v => onChange('title', v)} placeholder="স্বাগত ডক্টর বুকলেটে..." />
        </Col>
        <Col md={12}>
          <FieldInput label="সাব-টাইটেল (Description)" value={data.subtitle || ''} onChange={v => onChange('subtitle', v)} multiline rows={3} placeholder="বিস্তারিত বিবরণ..." />
        </Col>
        <Col md={6}>
          <FieldInput label="প্রাথমিক বাটন লেবেল" value={data.btn_primary || ''} onChange={v => onChange('btn_primary', v)} placeholder="ডাক্তার খুঁজুন" />
        </Col>
        <Col md={6}>
          <FieldInput label="সেকেন্ডারি বাটন লেবেল" value={data.btn_secondary || ''} onChange={v => onChange('btn_secondary', v)} placeholder="হাসপাতাল দেখুন" />
        </Col>
      </Row>
    </div>
  )
}

/* ── 4. BANNER SLIDER TAB ── */
function BannerSliderTab({ data, onChange }) {
  const items = data.items || []

  const updateItem = (i, key, val) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [key]: val }
    onChange('items', updated)
  }

  const addItem = () => {
    onChange('items', [
      { id: Date.now(), image: '', alt: 'নতুন অফার বা প্রমোশন', link: '/doctors' },
      ...items
    ])
  }

  const removeItem = (i) => {
    onChange('items', items.filter((_, idx) => idx !== i))
  }

  const handleImageUpload = (i, e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => updateItem(i, 'image', reader.result)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 style={{ fontWeight: 800, margin: 0, color: '#0F172A', fontSize: 16 }}>
          স্লাইডার ব্যানারসমূহ ({items.length}টি)
        </h6>
        <button
          type="button"
          onClick={addItem}
          style={{ background: '#00B875', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <IconPlus size={18} /> নতুন ব্যানার যোগ করুন
        </button>
      </div>

      <div className="d-flex flex-column gap-3">
        {items.map((item, i) => (
          <div key={item.id || i} style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
            <Row className="g-3 align-items-center">
              <Col md={3}>
                <div style={{ position: 'relative', width: '100%', height: 90, background: '#F8FAFC', borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 12 }}>ব্যানার ইমেজ নেই</div>
                  )}
                </div>
                <label style={{ display: 'block', textAlign: 'center', marginTop: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#00B875' }}>
                  <IconUpload size={14} /> ছবি আপলোড
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(i, e)} style={{ display: 'none' }} />
                </label>
              </Col>
              <Col md={8}>
                <Row className="g-2">
                  <Col md={6}>
                    <FieldInput label="ব্যানার টাইটেল / Alt" value={item.alt} onChange={v => updateItem(i, 'alt', v)} placeholder="উদা: টেলিমেডিসিন বুকিং" />
                  </Col>
                  <Col md={6}>
                    <FieldInput label="ক্লিক লিংক (Link URL)" value={item.link} onChange={v => updateItem(i, 'link', v)} placeholder="উদা: /doctors" />
                  </Col>
                </Row>
              </Col>
              <Col md={1} className="text-end">
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, padding: '8px', cursor: 'pointer' }}
                >
                  <IconTrash size={16} />
                </button>
              </Col>
            </Row>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 5. FAQ TAB (Section-wise Management) ── */
const FAQ_CATEGORIES = [
  { id: 'all', label: 'সব প্রশ্ন', icon: '🌐', color: '#00B875', bg: '#F0FDF4' },
  { id: 'appointment', label: 'অ্যাপয়েন্টমেন্ট', icon: '📅', color: '#2563EB', bg: '#EFF6FF' },
  { id: 'payment', label: 'পেমেন্ট ও রিফান্ড', icon: '💳', color: '#059669', bg: '#ECFDF5' },
  { id: 'account', label: 'একাউন্ট ও নিরাপত্তা', icon: '🔒', color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'services', label: 'ডিজিটাল সেবা', icon: '🩺', color: '#D97706', bg: '#FEF3C7' },
]

function FaqTab({ data, onChange }) {
  const items = data.items || []
  const [selectedCat, setSelectedCat] = useState('all')

  const updateItem = (actualIndex, key, val) => {
    const updated = [...items]
    updated[actualIndex] = { ...updated[actualIndex], [key]: val }
    onChange('items', updated)
  }

  const addItem = (defaultCat = 'appointment') => {
    const newCat = selectedCat === 'all' ? defaultCat : selectedCat
    onChange('items', [
      { id: Date.now(), category: newCat, q: '', a: '' },
      ...items
    ])
  }

  const removeItem = (actualIndex) => {
    onChange('items', items.filter((_, idx) => idx !== actualIndex))
  }

  // Filtered display items while maintaining their original array index
  const indexedItems = items.map((item, originalIndex) => ({ ...item, originalIndex }))
  const displayedItems = selectedCat === 'all' 
    ? indexedItems 
    : indexedItems.filter(item => (item.category || 'appointment') === selectedCat)

  const getCatCount = (catId) => {
    if (catId === 'all') return items.length
    return items.filter(item => (item.category || 'appointment') === catId).length
  }

  return (
    <div>
      {/* Top Header Settings */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <FieldInput label="সেকশন শিরোনাম" value={data.title || 'আপনার প্রশ্নের সহজ ও দ্রুত সমাধান'} onChange={v => onChange('title', v)} />
        </Col>
        <Col md={6}>
          <FieldInput label="সেকশন সাব-টাইটেল" value={data.subtitle || 'Doctor Booklet সম্পর্কিত সাধারণ প্রশ্নগুলোর উত্তর'} onChange={v => onChange('subtitle', v)} />
        </Col>
      </Row>

      {/* Section / Category Selector Filter Pills */}
      <div className="mb-4" style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📂 সেকশন / ক্যাটাগরি ফিল্টার:</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B' }}>(নির্দিষ্ট সেকশনের প্রশ্ন ফিল্টার ও যুক্ত করুন)</span>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {FAQ_CATEGORIES.map(cat => {
            const isActive = selectedCat === cat.id
            const count = getCatCount(cat.id)
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                style={{
                  background: isActive ? '#00B875' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#334155',
                  border: isActive ? '1.5px solid #00B875' : '1.5px solid #CBD5E1',
                  borderRadius: 99,
                  padding: '7px 16px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(0, 184, 117, 0.25)' : 'none'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                  color: isActive ? '#FFFFFF' : '#64748B',
                  borderRadius: 99,
                  padding: '1px 8px',
                  fontSize: 11.5,
                  fontWeight: 800
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Action Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 style={{ fontWeight: 800, margin: 0, color: '#0F172A', fontSize: 16 }}>
            {selectedCat === 'all' ? 'সকল সেকশনের প্রশ্নোত্তর' : `${FAQ_CATEGORIES.find(c => c.id === selectedCat)?.label} সেকশনের প্রশ্নসমূহ`} ({displayedItems.length}টি)
          </h6>
          <span style={{ fontSize: 12.5, color: '#64748B' }}>সংশ্লিষ্ট সেকশনের অধীনে ফ্রন্টএন্ডে প্রদর্শিত হবে</span>
        </div>
        <button
          type="button"
          onClick={() => addItem(selectedCat === 'all' ? 'appointment' : selectedCat)}
          style={{ background: '#00B875', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)' }}
        >
          <IconPlus size={18} /> {selectedCat === 'all' ? 'নতুন প্রশ্ন যোগ করুন' : `+ ${FAQ_CATEGORIES.find(c => c.id === selectedCat)?.label}-এ প্রশ্ন যোগ করুন`}
        </button>
      </div>

      {/* List of Questions */}
      {displayedItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: 12, border: '2px dashed #CBD5E1' }}>
          <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 12px', fontWeight: 600 }}>
            এই সেকশনে এখনো কোনো প্রশ্ন যুক্ত করা হয়নি।
          </p>
          <button
            type="button"
            onClick={() => addItem(selectedCat === 'all' ? 'appointment' : selectedCat)}
            style={{ background: '#00B875', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <IconPlus size={16} /> নতুন প্রশ্ন যোগ করুন
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {displayedItems.map((item) => {
            const catMeta = FAQ_CATEGORIES.find(c => c.id === (item.category || 'appointment')) || FAQ_CATEGORIES[1]
            return (
              <div key={item.id || item.originalIndex} style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontWeight: 800, color: '#00B875', fontSize: 13 }}>প্রশ্ন #{item.originalIndex + 1}</span>
                    <span style={{
                      background: catMeta.bg,
                      color: catMeta.color,
                      padding: '3px 10px',
                      borderRadius: 99,
                      fontSize: 11.5,
                      fontWeight: 800,
                      border: `1px solid ${catMeta.color}30`
                    }}>
                      {catMeta.icon} {catMeta.label}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.originalIndex)}
                    style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <IconTrash size={14} /> মুছুন
                  </button>
                </div>

                {/* Section / Category Dropdown Selection */}
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    সেকশন / ক্যাটাগরি নির্বাচন করুন
                  </Form.Label>
                  <Form.Select
                    value={item.category || 'appointment'}
                    onChange={e => updateItem(item.originalIndex, 'category', e.target.value)}
                    style={{
                      background: '#FFFFFF',
                      color: '#0F172A',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontFamily: "'Hind Siliguri', sans-serif",
                      fontSize: 13.5,
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="appointment">📅 অ্যাপয়েন্টমেন্ট (Appointment)</option>
                    <option value="payment">💳 পেমেন্ট ও রিফান্ড (Payment & Refund)</option>
                    <option value="account">🔒 একাউন্ট ও নিরাপত্তা (Account & Security)</option>
                    <option value="services">🩺 ডিজিটাল সেবা (Digital Services)</option>
                  </Form.Select>
                </Form.Group>

                <FieldInput
                  label="প্রশ্ন (Question)"
                  value={item.q}
                  onChange={v => updateItem(item.originalIndex, 'q', v)}
                  placeholder="উদা: কীভাবে ডাক্তারের অ্যাপয়েন্টমেন্ট বুক করব?"
                />

                <FieldInput
                  label="উত্তর (Answer)"
                  value={item.a}
                  onChange={v => updateItem(item.originalIndex, 'a', v)}
                  multiline
                  rows={3}
                  placeholder="উত্তরের বিস্তারিত বিবরণ..."
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── 6. ABOUT US TAB (/about) ── */
function AboutTab({ data, onChange }) {
  const timeline = data.timeline || []

  const updateTimeline = (i, key, val) => {
    const updated = [...timeline]
    updated[i] = { ...updated[i], [key]: val }
    onChange('timeline', updated)
  }

  const addTimeline = () => {
    onChange('timeline', [
      ...timeline,
      { year: '২০২৬', title: 'নতুন মাইলফলক', desc: 'মাইলফলকের বিস্তারিত...' }
    ])
  }

  const removeTimeline = (i) => {
    onChange('timeline', timeline.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <h6 style={{ fontWeight: 800, color: '#0F172A', fontSize: 16, marginBottom: 14 }}>
        ১. হিরো ও পরিচিতি সেকশন
      </h6>
      <Row className="g-3 mb-4">
        <Col md={4}>
          <FieldInput label="টপ ব্যাজ" value={data.badge || ''} onChange={v => onChange('badge', v)} placeholder="আমাদের গল্প ও লক্ষ্য" />
        </Col>
        <Col md={8}>
          <FieldInput label="মূল শিরোনাম" value={data.title || ''} onChange={v => onChange('title', v)} placeholder="রোগী ও বিশেষজ্ঞের মধ্যে সেতুবন্ধন" />
        </Col>
        <Col md={12}>
          <FieldInput label="পরিচিতি ও সাব-টাইটেল" value={data.subtitle || ''} onChange={v => onChange('subtitle', v)} multiline rows={2} placeholder="প্ল্যাটফর্মের ভূমিকা ও মূল উদ্দেশ্য..." />
        </Col>
      </Row>

      <h6 style={{ fontWeight: 800, color: '#0F172A', fontSize: 16, marginBottom: 14 }}>
        ২. মিশন, ভিশন ও প্রতিষ্ঠা
      </h6>
      <Row className="g-3 mb-4">
        <Col md={6}>
          <FieldInput label="মিশন শিরোনাম" value={data.mission_title || ''} onChange={v => onChange('mission_title', v)} placeholder="আমাদের মিশন (Our Mission)" />
          <FieldInput label="মিশন বিবরণ" value={data.mission_desc || ''} onChange={v => onChange('mission_desc', v)} multiline rows={3} placeholder="আমাদের স্বাস্থ্যসেবার লক্ষ্য..." />
        </Col>
        <Col md={6}>
          <FieldInput label="ভিশন শিরোনাম" value={data.vision_title || ''} onChange={v => onChange('vision_title', v)} placeholder="আমাদের ভিশন (Our Vision)" />
          <FieldInput label="ভিশন বিবরণ" value={data.vision_desc || ''} onChange={v => onChange('vision_desc', v)} multiline rows={3} placeholder="আমাদের ভবিষ্যৎ স্বপ্ন..." />
        </Col>
        <Col md={12}>
          <FieldInput label="আমাদের প্রতিষ্ঠা ও গল্প শিরোনাম" value={data.story_title || ''} onChange={v => onChange('story_title', v)} placeholder="আমাদের প্রতিষ্ঠা ও যাত্রা" />
          <FieldInput label="আমাদের গল্প ও ইতিহাস বিবরণ" value={data.story_desc || ''} onChange={v => onChange('story_desc', v)} multiline rows={3} placeholder="Doctor Booklet প্রতিষ্ঠার পেছনের গল্প..." />
        </Col>
      </Row>

      <h6 style={{ fontWeight: 800, color: '#0F172A', fontSize: 16, marginBottom: 14 }}>
        ৩. মূল পরিসংখ্যান (Stats)
      </h6>
      <Row className="g-3 mb-4">
        <Col md={3}>
          <FieldInput label="যাচাইকৃত ডাক্তার" value={data.stat_doctors || ''} onChange={v => onChange('stat_doctors', v)} placeholder="১,০০০+" />
        </Col>
        <Col md={3}>
          <FieldInput label="স্বীকৃত হাসপাতাল" value={data.stat_hospitals || ''} onChange={v => onChange('stat_hospitals', v)} placeholder="৫০০+" />
        </Col>
        <Col md={3}>
          <FieldInput label="সন্তুষ্ট রোগী" value={data.stat_patients || ''} onChange={v => onChange('stat_patients', v)} placeholder="১০ লাখ+" />
        </Col>
        <Col md={3}>
          <FieldInput label="সারাদেশে কভারেজ" value={data.stat_coverage || ''} onChange={v => onChange('stat_coverage', v)} placeholder="৮টি বিভাগ" />
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 style={{ fontWeight: 800, color: '#0F172A', fontSize: 16, margin: 0 }}>
          ৪. টাইমলাইন ও মাইলফলক ({timeline.length}টি)
        </h6>
        <button
          type="button"
          onClick={addTimeline}
          style={{ background: '#00B875', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <IconPlus size={16} /> মাইলফলক যোগ করুন
        </button>
      </div>

      <div className="d-flex flex-column gap-3">
        {timeline.map((item, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span style={{ fontWeight: 800, color: '#00B875', fontSize: 13 }}>মাইলফলক #{i + 1}</span>
              <button
                type="button"
                onClick={() => removeTimeline(i)}
                style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                <IconTrash size={14} /> মুছুন
              </button>
            </div>
            <Row className="g-2">
              <Col md={3}>
                <FieldInput label="সাল / বছর" value={item.year} onChange={v => updateTimeline(i, 'year', v)} placeholder="উদা: ২০২৪" />
              </Col>
              <Col md={9}>
                <FieldInput label="মাইলফলকের শিরোনাম" value={item.title} onChange={v => updateTimeline(i, 'title', v)} placeholder="উদা: হাসপাতাল সম্প্রসারণ" />
              </Col>
              <Col md={12}>
                <FieldInput label="সংক্ষিপ্ত বিবরণ" value={item.desc} onChange={v => updateTimeline(i, 'desc', v)} multiline rows={2} placeholder="বিস্তারিত বিবরণ..." />
              </Col>
            </Row>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 7. SUPPORT TAB (/support) ── */
function SupportTab({ data, onChange }) {
  return (
    <div>
      <h6 style={{ fontWeight: 800, color: '#0F172A', fontSize: 16, marginBottom: 14 }}>
        ১. সাপোর্ট পেজ হিরো সেকশন
      </h6>
      <Row className="g-3 mb-4">
        <Col md={4}>
          <FieldInput label="টপ ব্যাজ" value={data.badge || ''} onChange={v => onChange('badge', v)} placeholder="২৪/৭ এলিট সহায়তা কেন্দ্র" />
        </Col>
        <Col md={8}>
          <FieldInput label="সাপোর্ট শিরোনাম" value={data.title || ''} onChange={v => onChange('title', v)} placeholder="২৪/৭ এলিট সহায়তা ও হেল্পডেস্ক" />
        </Col>
        <Col md={12}>
          <FieldInput label="সাপোর্ট সাব-টাইটেল" value={data.subtitle || ''} onChange={v => onChange('subtitle', v)} multiline rows={2} placeholder="অ্যাপয়েন্টমেন্ট, পেমেন্ট ও যেকোনো স্বাস্থ্য জিজ্ঞাসায়..." />
        </Col>
      </Row>

      <h6 style={{ fontWeight: 800, color: '#0F172A', fontSize: 16, marginBottom: 14 }}>
        ২. হেল্পলাইন ও যোগাযোগের মাধ্যম
      </h6>
      <Row className="g-3 mb-4">
        <Col md={6}>
          <FieldInput label="সরাসরি সাপোর্ট হটলাইন" value={data.hotline || ''} onChange={v => onChange('hotline', v)} placeholder="16263" />
        </Col>
        <Col md={6}>
          <FieldInput label="প্রাইমারি মোবাইল নম্বর" value={data.phone || ''} onChange={v => onChange('phone', v)} placeholder="017 XXXX XXXX" />
        </Col>
        <Col md={6}>
          <FieldInput label="সাপোর্ট ইমেইল" value={data.email || ''} onChange={v => onChange('email', v)} placeholder="support@doctorbooklet.com.bd" />
        </Col>
        <Col md={6}>
          <FieldInput label="সাপোর্ট সময়সূচি" value={data.office_hours || ''} onChange={v => onChange('office_hours', v)} placeholder="সকাল ৯টা - রাত ১০টা" />
        </Col>
        <Col md={6}>
          <FieldInput label="রেসপন্স টাইম নোটিশ" value={data.response_time || ''} onChange={v => onChange('response_time', v)} placeholder="স্ট্যান্ডার্ড রেসপন্স টাইম ১৫ মিনিট - ২ ঘণ্টা" />
        </Col>
        <Col md={6}>
          <FieldInput label="জরুরি চিকিৎসা সতর্কতা নোটিশ" value={data.emergency_notice || ''} onChange={v => onChange('emergency_notice', v)} placeholder="জরুরি চিকিৎসার জন্য নিকটস্থ হাসপাতালে যোগাযোগ করুন" />
        </Col>
      </Row>
    </div>
  )
}

/* ── 8. CONTACT TAB (/contact) ── */
function ContactTab({ data, onChange }) {
  return (
    <div>
      <h6 style={{ fontWeight: 800, color: '#0F172A', fontSize: 16, marginBottom: 14 }}>
        ১. যোগাযোগ পেজ হিরো সেকশন
      </h6>
      <Row className="g-3 mb-4">
        <Col md={4}>
          <FieldInput label="টপ ব্যাজ" value={data.hero_badge || ''} onChange={v => onChange('hero_badge', v)} placeholder="সার্বক্ষণিক যোগাযোগ" />
        </Col>
        <Col md={8}>
          <FieldInput label="মূল শিরোনাম" value={data.hero_title || ''} onChange={v => onChange('hero_title', v)} placeholder="আমরা আছি আপনার সেবায় সর্বদা" />
        </Col>
        <Col md={12}>
          <FieldInput label="সাব-টাইটেল বিবরণ" value={data.hero_subtitle || ''} onChange={v => onChange('hero_subtitle', v)} multiline rows={2} placeholder="যেকোনো প্রশ্ন বা সহায়তার জন্য যোগাযোগ করুন..." />
        </Col>
      </Row>

      <h6 style={{ fontWeight: 800, color: '#0F172A', fontSize: 16, marginBottom: 14 }}>
        ২. অফিস ও যোগাযোগের তথ্যাদি
      </h6>
      <Row className="g-3 mb-4">
        <Col md={6}>
          <FieldInput label="অফিস শিরোনাম" value={data.office_title || ''} onChange={v => onChange('office_title', v)} placeholder="প্রধান কার্যালয়" />
        </Col>
        <Col md={6}>
          <FieldInput label="ফোন নম্বর" value={data.phone || ''} onChange={v => onChange('phone', v)} placeholder="017 XXXX XXXX" />
        </Col>
        <Col md={6}>
          <FieldInput label="অফিসিয়াল ইমেইল" value={data.email || ''} onChange={v => onChange('email', v)} placeholder="info@doctorbooklet.com.bd" />
        </Col>
        <Col md={6}>
          <FieldInput label="অফিস সময়সূচি" value={data.office_hours || ''} onChange={v => onChange('office_hours', v)} placeholder="শনিবার - বৃহস্পতিবার: সকাল ৯টা - রাত ৮টা" />
        </Col>
        <Col md={12}>
          <FieldInput label="অফিসের পূর্ণ ঠিকানা" value={data.address || ''} onChange={v => onChange('address', v)} placeholder="মেডকানেক্ট কমপ্লেক্স, ধানমন্ডি, ঢাকা-১২০৫" />
        </Col>
      </Row>

      <h6 style={{ fontWeight: 800, color: '#0F172A', fontSize: 16, marginBottom: 14 }}>
        ৩. গুগল ম্যাপস ও ইমার্জেন্সি বক্স
      </h6>
      <Row className="g-3 mb-4">
        <Col md={6}>
          <FieldInput label="ইমার্জেন্সি কার্ড শিরোনাম" value={data.emergency_title || ''} onChange={v => onChange('emergency_title', v)} placeholder="জরুরী সহায়তা প্রয়োজন?" />
        </Col>
        <Col md={6}>
          <FieldInput label="ইমার্জেন্সি কার্ড সাব-টাইটেল" value={data.emergency_subtitle || ''} onChange={v => onChange('emergency_subtitle', v)} placeholder="আমাদের হেল্পলাইনে কল করুন" />
        </Col>
        <Col md={12}>
          <FieldInput label="গুগল ম্যাপ Embed URL" value={data.map_embed || ''} onChange={v => onChange('map_embed', v)} placeholder="https://www.google.com/maps/embed?pb=..." />
        </Col>
      </Row>
    </div>
  )
}

/* ── 9. SEPARATE LEGAL POLICY TAB (Reused for Terms, Privacy, Refund) ── */
function LegalPolicyTab({ sectionName, defaultTitle, data, onChange }) {
  const sections = data.sections || []

  const updateSectionItem = (i, key, val) => {
    const updated = [...sections]
    updated[i] = { ...updated[i], [key]: val }
    onChange('sections', updated)
  }

  const addSectionItem = () => {
    onChange('sections', [
      ...sections,
      { num: `${sections.length + 1}.১`, heading: 'নতুন ধারা বা শর্ত', content: 'বিস্তারিত নিয়ম ও বিবরণ...' }
    ])
  }

  const removeSectionItem = (i) => {
    onChange('sections', sections.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <Row className="g-3 mb-4">
        <Col md={8}>
          <FieldInput label="পলিসির মূল শিরোনাম" value={data.title || defaultTitle} onChange={v => onChange('title', v)} />
        </Col>
        <Col md={4}>
          <FieldInput label="সর্বশেষ সংশোধনের তারিখ" value={data.updated_date || ''} onChange={v => onChange('updated_date', v)} placeholder="২৪ জুলাই, ২০২৬" />
        </Col>
        <Col md={12}>
          <FieldInput label="পলিসির সাব-টাইটেল / ভূমিকা" value={data.subtitle || ''} onChange={v => onChange('subtitle', v)} multiline rows={2} placeholder="সংক্ষিপ্ত সারসংক্ষেপ..." />
        </Col>
        <Col md={12}>
          <FieldInput label="গুরুত্বপূর্ণ নোটিশ / সতর্কবার্তা ব্যানার" value={data.notice || ''} onChange={v => onChange('notice', v)} multiline rows={2} placeholder="ব্যবহারকারীদের জন্য বিশেষ বিজ্ঞপ্তি..." />
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 style={{ fontWeight: 800, margin: 0, color: '#0F172A', fontSize: 16 }}>
            {sectionName} এর ধারাসমূহ ({sections.length}টি)
          </h6>
          <span style={{ fontSize: 12.5, color: '#64748B' }}>/legal পেজে ক্রমানুসারে প্রদর্শিত হবে</span>
        </div>
        <button
          type="button"
          onClick={addSectionItem}
          style={{ background: '#00B875', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <IconPlus size={18} /> নতুন ধারা যোগ করুন
        </button>
      </div>

      <div className="d-flex flex-column gap-3">
        {sections.map((item, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span style={{ fontWeight: 800, color: '#00B875', fontSize: 13 }}>ধারা #{i + 1}</span>
              <button
                type="button"
                onClick={() => removeSectionItem(i)}
                style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                <IconTrash size={14} /> ধারা মুছুন
              </button>
            </div>
            <Row className="g-2">
              <Col md={3}>
                <FieldInput label="ধারা নম্বর / কোড" value={item.num} onChange={v => updateSectionItem(i, 'num', v)} placeholder="উদা: ১.১" />
              </Col>
              <Col md={9}>
                <FieldInput label="ধারার মূল শিরোনাম" value={item.heading} onChange={v => updateSectionItem(i, 'heading', v)} placeholder="উদা: ভূমিকা ও সেবা পরিচিতি" />
              </Col>
              <Col md={12}>
                <FieldInput label="ধারার বিস্তারিত বিবরণ" value={item.content} onChange={v => updateSectionItem(i, 'content', v)} multiline rows={3} placeholder="আইনি নীতিমালা ও বিস্তারিত শর্তাবলী..." />
              </Col>
            </Row>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 9. SUPPORT TICKET / OBIJUG TAB ── */
function SupportTicketTab({ data, onChange }) {
  const categories = data.categories || [
    'অ্যাপয়েন্টমেন্ট সমস্যা',
    'পেমেন্ট ও রিফান্ড',
    'ভিডিও কল সমস্যা',
    'ডাক্তার সম্পর্কিত তথ্য',
    'অন্যান্য জিজ্ঞাসা'
  ]

  const updateCategory = (i, val) => {
    const updated = [...categories]
    updated[i] = val
    onChange('categories', updated)
  }

  const addCategory = () => {
    onChange('categories', [...categories, 'নতুন ক্যাটাগরি'])
  }

  const removeCategory = (i) => {
    onChange('categories', categories.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 18, border: '1px solid #E2E8F0', marginBottom: 20 }}>
        <h6 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>সাপোর্ট টিকিট ও অভিযোগ ফর্ম পরিচিতি</h6>
        <Row className="g-3">
          <Col md={6}>
            <FieldInput label="ফর্ম ব্যাজ টেক্সট (Badge)" value={data.badge} onChange={v => onChange('badge', v)} placeholder="অনলাইন সাপোর্ট টিকিট ও অভিযোগ" />
          </Col>
          <Col md={6}>
            <FieldInput label="আনুমানিক সমাধান সময়" value={data.response_estimate} onChange={v => onChange('response_estimate', v)} placeholder="২ ঘণ্টা" />
          </Col>
          <Col md={12}>
            <FieldInput label="ফর্ম শিরোনাম (Main Title)" value={data.title} onChange={v => onChange('title', v)} placeholder="নতুন সাপোর্ট টিকিট / অভিযোগ জমা দিন" />
          </Col>
          <Col md={12}>
            <FieldInput label="ফর্ম সাবটাইটেল ও নির্দেশনা" value={data.subtitle} onChange={v => onChange('subtitle', v)} multiline rows={2} placeholder="আপনার যেকোনো জিজ্ঞাসা বা সমস্যা নিচে জমা দিন..." />
          </Col>
        </Row>
      </div>

      <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 18, border: '1px solid #E2E8F0', marginBottom: 20 }}>
        <h6 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>সাবমিট পরবর্তী বার্তা সেটিংস</h6>
        <Row className="g-3">
          <Col md={6}>
            <FieldInput label="সফল বার্তা শিরোনাম" value={data.success_title} onChange={v => onChange('success_title', v)} placeholder="সফলভাবে টিকিট জমা হয়েছে!" />
          </Col>
          <Col md={6}>
            <FieldInput label="সফল বার্তা সাব-টেক্সট" value={data.success_subtitle} onChange={v => onChange('success_subtitle', v)} placeholder="আমাদের টিম দ্রুত যোগাযোগ করবে" />
          </Col>
        </Row>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h6 style={{ fontWeight: 800, color: '#0F172A', margin: 0 }}>অভিযোগ ও সমস্যার ক্যাটাগরি তালিকা ({categories.length}টি)</h6>
          <button
            type="button"
            onClick={addCategory}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#00B875', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
          >
            <IconPlus size={16} /> নতুন ক্যাটাগরি যোগ করুন
          </button>
        </div>

        <Row className="g-2">
          {categories.map((cat, i) => (
            <Col md={6} key={i}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#FFFFFF', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#64748B', width: 24 }}>#{i+1}</span>
                <input
                  type="text"
                  value={cat}
                  onChange={e => updateCategory(i, e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13.5, fontWeight: 700, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => removeCategory(i)}
                  style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: 2 }}
                >
                  <IconTrash size={15} />
                </button>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}

/* ── MAIN CONTENT MANAGER PAGE ── */
export default function ContentManagerPage() {
  const [content, setContent] = useState(getContent())
  const [activeTab, setActiveTab] = useState('about_us')
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [tabFilter, setTabFilter] = useState('')

  const handleSave = async () => {
    setIsSaving(true)
    await saveContent(content)
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const updateSection = (section, key, value) => {
    setContent(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }))
  }

  const filteredTabs = TABS.filter(t => t.label.toLowerCase().includes(tabFilter.toLowerCase()))

  const renderTabContent = () => {
    const sec = content[activeTab] || {}
    const upd = (k, v) => updateSection(activeTab, k, v)

    switch (activeTab) {
      case 'hero': return <HeroTab data={sec} onChange={upd} />
      case 'banners': return <BannerSliderTab data={sec} onChange={upd} />
      case 'testimonials': return <TestimonialsTab data={sec} onChange={upd} />
      case 'partners': return <PartnersTab data={sec} onChange={upd} />
      case 'faq': return <FaqTab data={sec} onChange={upd} />
      case 'about_us': return <AboutTab data={sec} onChange={upd} />
      case 'support': return <SupportTab data={sec} onChange={upd} />
      case 'support_ticket': return <SupportTicketTab data={sec} onChange={upd} />
      case 'contact': return <ContactTab data={sec} onChange={upd} />
      case 'legal_terms': return <LegalPolicyTab sectionName="ব্যবহারের শর্তাবলী (Terms)" defaultTitle="ব্যবহারের শর্তাবলী (Terms of Service)" data={sec} onChange={upd} />
      case 'legal_privacy': return <LegalPolicyTab sectionName="গোপনীয়তা নীতি (Privacy)" defaultTitle="গোপনীয়তা নীতি (Privacy Policy)" data={sec} onChange={upd} />
      case 'legal_refund': return <LegalPolicyTab sectionName="রিফান্ড ও বাতিলকরণ নীতি (Refund)" defaultTitle="রিফান্ড ও বাতিলকরণ নীতি (Refund Policy)" data={sec} onChange={upd} />
      default: return <div style={{ color: '#64748B', padding: 40, textAlign: 'center' }}>কন্টেন্ট লোড হচ্ছে...</div>
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', padding: '8px 0 32px', fontFamily: "'Hind Siliguri', sans-serif" }}>
      {/* Top Header Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: '24px 28px',
        border: '1.5px solid #E2E8F0',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '0 0 4px 0' }}>
            কন্টেন্ট ম্যানেজার (CMS)
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, fontWeight: 500 }}>
            ওয়েবসাইটের সকল পেজ (/about, /support, /contact, /legal) ও সেকশন সরাসরি পরিচালনা করুন
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          style={{
            background: saved ? '#059669' : '#00B875',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '12px 28px',
            fontWeight: 800,
            fontSize: 14.5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0, 184, 117, 0.3)',
            transition: 'all 0.25s ease'
          }}
        >
          {saved ? (
            <>
              <IconCheck size={18} stroke={3} />
              <span>পরিবর্তন সফলভাবে প্রকাশিত!</span>
            </>
          ) : (
            <>
              <IconDeviceFloppy size={18} stroke={2.2} />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন প্রকাশ করুন'}</span>
            </>
          )}
        </button>
      </div>

      <Row className="g-4">
        {/* Left Category Sidebar */}
        <Col lg={3} md={4}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1.5px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ padding: '14px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <input
                type="text"
                value={tabFilter}
                onChange={e => setTabFilter(e.target.value)}
                placeholder="পেজ বা ক্যাটাগরি খুঁজুন..."
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12.5,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {filteredTabs.map(tab => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 18px',
                      background: isActive ? '#00B875' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#334155',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: 13.5,
                      border: 'none',
                      borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.2s ease',
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}
                  >
                    <span style={{ color: isActive ? '#FFFFFF' : '#00B875', display: 'flex' }}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </Col>

        {/* Right Editor Panel */}
        <Col lg={9} md={8}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1.5px solid #E2E8F0',
            padding: '28px 30px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            {/* Active Tab Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '1.5px solid #F1F5F9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#F0FDF4',
                  color: '#00B875',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {TABS.find(t => t.key === activeTab)?.icon}
                </span>
                <h5 style={{ fontWeight: 800, color: '#0F172A', margin: 0, fontSize: 18 }}>
                  {TABS.find(t => t.key === activeTab)?.label}
                </h5>
              </div>

              <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>
                পরিবর্তন শেষে উপরে "প্রকাশ করুন" বাটনে ক্লিক করুন
              </span>
            </div>

            {/* Active Tab Form Content */}
            {renderTabContent()}
          </div>

          {/* Quick Notice Tip */}
          <div style={{
            marginTop: 18,
            padding: '14px 20px',
            background: '#F0FDF4',
            borderRadius: 8,
            border: '1px solid #DCFCE7',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <IconCheck size={18} color="#00B875" />
            <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
              এখানে সংরক্ষিত যেকোনো পরিবর্তন সংশ্লিষ্ট পেজে (/about, /support, /contact, /legal) তাৎক্ষণিকভাবে লাইভ আপডেট হবে।
            </span>
          </div>
        </Col>
      </Row>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

import { useState } from 'react'
import { Row, Col, Form } from 'react-bootstrap'
import { getContent, saveContent } from '../../../utils/contentService'
import {
  IconStar, IconTrash, IconPlus, IconUpload, IconDeviceFloppy,
  IconCheck, IconMessage, IconBuildingHospital, IconHelp,
  IconHome, IconPhoto, IconLink, IconExternalLink
} from '@tabler/icons-react'

const TABS = [
  { key: 'hero', label: 'হোম পেজ হিরো সেকশন', icon: <IconHome size={18} /> },
  { key: 'banners', label: 'স্লাইডার ব্যানার', icon: <IconPhoto size={18} /> },
  { key: 'testimonials', label: 'রোগীর রিভিউ (Testimonials)', icon: <IconMessage size={18} /> },
  { key: 'partners', label: 'সহযোগী হাসপাতাল (Partners)', icon: <IconBuildingHospital size={18} /> },
  { key: 'faq', label: 'সচরাচর জিজ্ঞাসা (FAQ)', icon: <IconHelp size={18} /> },
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
      {/* Header Settings */}
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

      {/* Header Actions */}
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

      {/* Review Cards List */}
      <div className="d-flex flex-column gap-3">
        {items.map((item, i) => (
          <div
            key={item.id || i}
            style={{
              background: '#FFFFFF',
              borderRadius: 10,
              padding: '20px',
              border: '1.5px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              position: 'relative'
            }}
          >
            {/* Delete Button */}
            <button
              type="button"
              onClick={() => removeItem(i)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: '#FEE2E2',
                color: '#EF4444',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <IconTrash size={14} /> মুছুন
            </button>

            <div style={{ fontSize: 13, fontWeight: 800, color: '#00B875', marginBottom: 12 }}>
              রিভিউ #{i + 1}
            </div>

            <Row className="g-3">
              <Col md={4}>
                <FieldInput
                  label="রোগীর নাম"
                  value={item.name}
                  onChange={v => updateItem(i, 'name', v)}
                />
              </Col>
              <Col md={4}>
                <FieldInput
                  label="পদবী / এলাকা (যেমন: রোগী (ঢাকা))"
                  value={item.role}
                  onChange={v => updateItem(i, 'role', v)}
                />
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
                    স্টার রেটিং (১-৫)
                  </Form.Label>
                  <div className="d-flex gap-2 align-items-center" style={{ height: 42 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateItem(i, 'rating', star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 2,
                          color: (item.rating || 5) >= star ? '#F59E0B' : '#CBD5E1'
                        }}
                      >
                        <IconStar size={22} fill={(item.rating || 5) >= star ? '#F59E0B' : 'none'} />
                      </button>
                    ))}
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#F59E0B', marginLeft: 6 }}>
                      {item.rating || 5} স্টার
                    </span>
                  </div>
                </Form.Group>
              </Col>

              <Col md={12}>
                <div className="mb-3">
                  <Form.Label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
                    প্রোফাইল ছবি / অবতার (Image URL অথবা ফাইল আপলোড)
                  </Form.Label>
                  <div className="d-flex gap-2 align-items-center">
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={item.image || ''}
                        onChange={e => updateItem(i, 'image', e.target.value)}
                        placeholder="https://..."
                        style={{
                          background: '#FFFFFF', color: '#0F172A',
                          border: '1.5px solid #E2E8F0', borderRadius: 8,
                          padding: '10px 14px', fontSize: 13.5, width: '100%', outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload(i, e)}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 5 }}
                      />
                      <button type="button" style={{ background: '#F0FDF4', border: '1.5px dashed #00B875', color: '#00B875', padding: '9px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconUpload size={16} /> আপলোড
                      </button>
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={12}>
                <FieldInput
                  label="রোগীর মন্তব্য / উক্তি (Comment Quote)"
                  value={item.comment}
                  onChange={v => updateItem(i, 'comment', v)}
                  multiline
                  rows={2}
                />
              </Col>
            </Row>

            {/* Mini Live Preview */}
            <div style={{ marginTop: 10, padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src={item.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={item.name}
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #00B875' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{item.name || 'রোগীর নাম'}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{item.role || 'রোগী'}</span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: 12.5, color: '#475569', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  "{item.comment || 'মন্তব্য...'}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 2. PARTNER HOSPITALS TAB ── */
function PartnersTab({ data, onChange }) {
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
        logo_url: 'https://img.freepik.com/free-vector/hospital-logo-design-vector-medical-cross_53876-136743.jpg'
      },
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
      reader.onloadend = () => {
        updateItem(i, 'logo_url', reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      {/* Header Settings */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <FieldInput
            label="সেকশন শিরোনাম"
            value={data.title || 'আমাদের সহযোগী হাসপাতালসমূহ'}
            onChange={v => onChange('title', v)}
          />
        </Col>
        <Col md={6}>
          <FieldInput
            label="সেকশন সাব-টাইটেল"
            value={data.subtitle || 'দেশজুড়ে নির্ভরযোগ্য হাসপাতাল ও ক্লিনিক্যাল সেন্টারসমূহ'}
            onChange={v => onChange('subtitle', v)}
          />
        </Col>
      </Row>

      {/* Header Actions */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 style={{ fontWeight: 800, margin: 0, color: '#0F172A', fontSize: 16 }}>
            সহযোগী হাসপাতালের লোগো তালিকা ({items.length}টি)
          </h6>
          <span style={{ fontSize: 12.5, color: '#64748B' }}>হোমপেজে ইনফিনিট মারকুই স্লাইডার আকারে প্রদর্শিত হবে</span>
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
          <IconPlus size={18} /> নতুন হাসপাতাল লোগো যোগ করুন
        </button>
      </div>

      {/* Hospital Logos List */}
      <div className="d-flex flex-column gap-3">
        {items.map((item, i) => (
          <div
            key={item.id || i}
            style={{
              background: '#FFFFFF',
              borderRadius: 10,
              padding: '18px 20px',
              border: '1.5px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              position: 'relative'
            }}
          >
            {/* Delete Button */}
            <button
              type="button"
              onClick={() => removeItem(i)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: '#FEE2E2',
                color: '#EF4444',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <IconTrash size={14} /> মুছুন
            </button>

            <Row className="g-3 align-items-center">
              <Col md={5}>
                <FieldInput
                  label="হাসপাতালের নাম"
                  value={item.name}
                  onChange={v => updateItem(i, 'name', v)}
                />
              </Col>
              <Col md={5}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
                    লোগো (URL অথবা আপলোড)
                  </Form.Label>
                  <div className="d-flex gap-2 align-items-center">
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={item.logo_url || ''}
                        onChange={e => updateItem(i, 'logo_url', e.target.value)}
                        placeholder="https://..."
                        style={{
                          background: '#FFFFFF', color: '#0F172A',
                          border: '1.5px solid #E2E8F0', borderRadius: 8,
                          padding: '10px 14px', fontSize: 13.5, width: '100%', outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleLogoUpload(i, e)}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 5 }}
                      />
                      <button type="button" style={{ background: '#F0FDF4', border: '1.5px dashed #00B875', color: '#00B875', padding: '9px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconUpload size={16} /> আপলোড
                      </button>
                    </div>
                  </div>
                </Form.Group>
              </Col>
              <Col md={2} className="text-center">
                <div style={{ width: 90, height: 60, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', padding: 4 }}>
                  <img
                    src={item.logo_url || '/favicon.png'}
                    alt={item.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={e => { e.target.src = '/favicon.png' }}
                  />
                </div>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, display: 'block', marginTop: 4 }}>লোগো প্রিভিউ</span>
              </Col>
            </Row>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 3. FAQ TAB ── */
function FaqTab({ data, onChange }) {
  const items = data.items || []
  const update = (i, key, val) => {
    const u = [...items]; u[i] = { ...u[i], [key]: val }; onChange('items', u)
  }
  const add = () => onChange('items', [{ q: 'নতুন প্রশ্ন?', a: 'উত্তর লিখুন।' }, ...items])
  const remove = (i) => onChange('items', items.filter((_, idx) => idx !== i))

  return (
    <div>
      <Row className="g-3 mb-4">
        <Col md={6}><FieldInput label="ব্যাজ" value={data.badge} onChange={v => onChange('badge', v)} /></Col>
        <Col md={6}><FieldInput label="শিরোনাম" value={data.title} onChange={v => onChange('title', v)} /></Col>
      </Row>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 style={{ fontWeight: 800, margin: 0, color: '#0F172A' }}>প্রশ্নোত্তর তালিকা ({items.length}টি)</h6>
        <button type="button" onClick={add} style={{ background: '#00B875', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconPlus size={16} /> নতুন প্রশ্ন যোগ করুন
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ background: '#F8FAFC', borderRadius: 10, padding: 18, marginBottom: 14, border: '1px solid #E2E8F0', position: 'relative' }}>
          <button type="button" onClick={() => remove(i)} style={{ position: 'absolute', top: 12, right: 12, background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>মুছুন</button>
          <FieldInput label={`প্রশ্ন ${i + 1}`} value={item.q} onChange={v => update(i, 'q', v)} />
          <FieldInput label="উত্তর" value={item.a} onChange={v => update(i, 'a', v)} multiline rows={2} />
        </div>
      ))}
    </div>
  )
}

/* ── 4. HELPLINES TAB ── */
function HelplinesTab({ data, onChange }) {
  const items = data.items || []
  const update = (i, key, val) => { const u = [...items]; u[i] = { ...u[i], [key]: val }; onChange('items', u) }
  const add = () => onChange('items', [{ label: 'নতুন জরুরি সেবা', number: '16263' }, ...items])
  const remove = (i) => onChange('items', items.filter((_, idx) => idx !== i))

  return (
    <div>
      <FieldInput label="সেকশন শিরোনাম" value={data.title} onChange={v => onChange('title', v)} />
      <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
        <h6 style={{ fontWeight: 800, margin: 0, color: '#0F172A' }}>জরুরি হেল্পলাইন নম্বরসমূহ ({items.length}টি)</h6>
        <button type="button" onClick={add} style={{ background: '#00B875', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconPlus size={16} /> নতুন যোগ করুন
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ background: '#F8FAFC', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid #E2E8F0', display: 'flex', gap: 16, alignItems: 'flex-end', position: 'relative' }}>
          <div style={{ flex: 1 }}><FieldInput label="লেবেল / সংস্থার নাম" value={item.label} onChange={v => update(i, 'label', v)} /></div>
          <div style={{ flex: 1 }}><FieldInput label="হটলাইন নম্বর" value={item.number} onChange={v => update(i, 'number', v)} /></div>
          <button type="button" onClick={() => remove(i)} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 8, padding: '10px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer', marginBottom: 16, flexShrink: 0 }}>✕</button>
        </div>
      ))}
    </div>
  )
}

/* ── 5. GENERIC TEXT FIELDS TAB ── */
function SimpleTextTab({ data, onChange, fields }) {
  return (
    <Row className="g-3">
      {fields.map(f => (
        <Col md={f.full ? 12 : 6} key={f.key}>
          <FieldInput label={f.label} value={data[f.key]} onChange={v => onChange(f.key, v)} multiline={f.multiline} rows={f.rows || 3} />
        </Col>
      ))}
    </Row>
  )
}

/* ── 6. HERO SECTION TAB ── */
function HeroTab({ data, onChange }) {
  const inputStyle = {
    background: '#FFFFFF', color: '#0F172A', border: '1.5px solid #E2E8F0',
    borderRadius: 8, padding: '10px 14px', fontSize: 14, width: '100%', outline: 'none'
  }

  const handleBgUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => onChange('bg_image_url', reader.result)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <IconHome size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.6 }}>
          <strong>হোম পেজ হিরো সেকশন:</strong> এখানে যা পরিবর্তন করবেন তা হোমপেজের মূল ব্যানার অংশে সরাসরি প্রতিফলিত হবে। সাবটাইটেল পরিবর্তন করা যাবে। ব্যাকগ্রাউন্ড ছবি URL বা আপলোডের মাধ্যমে পরিবর্তন করুন।
        </div>
      </div>

      <Row className="g-3">
        <Col md={12}>
          <FieldInput
            label="সাব-টাইটেল (বিবরণ)"
            value={data.subtitle || ''}
            onChange={v => onChange('subtitle', v)}
            multiline rows={3}
            placeholder="বাংলাদেশের অভিজ্ঞ ও যাচাইকৃত বিশেষজ্ঞ ডাক্তার খুঁজুন..."
          />
        </Col>
        <Col md={6}>
          <FieldInput label="প্রাথমিক বাটন টেক্সট" value={data.btn_primary || ''} onChange={v => onChange('btn_primary', v)} placeholder="ডাক্তার খুঁজুন" />
        </Col>
        <Col md={6}>
          <FieldInput label="দ্বিতীয় বাটন টেক্সট" value={data.btn_secondary || ''} onChange={v => onChange('btn_secondary', v)} placeholder="হাসপাতাল দেখুন" />
        </Col>
      </Row>

      {/* Background Image Control */}
      <div style={{ marginTop: 24, padding: '20px', background: '#F8FAFC', borderRadius: 12, border: '1.5px solid #E2E8F0' }}>
        <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: 14, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconPhoto size={18} color="#00B875" /> ব্যাকগ্রাউন্ড ছবি নিয়ন্ত্রণ
        </div>
        <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 12 }}>ডিফল্ট ব্যাকগ্রাউন্ড: <code>/images/city_hero_bg.jpg</code> — URL বা ফাইল আপলোড করে পরিবর্তন করুন।</div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="text"
              value={data.bg_image_url || ''}
              onChange={e => onChange('bg_image_url', e.target.value)}
              placeholder="https://example.com/hero-bg.jpg অথবা /images/city_hero_bg.jpg"
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <input type="file" accept="image/*" onChange={handleBgUpload}
              style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 5 }} />
            <button type="button" style={{ background: '#F0FDF4', border: '1.5px dashed #00B875', color: '#00B875', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <IconUpload size={16} /> ফাইল আপলোড
            </button>
          </div>
          {data.bg_image_url && (
            <button type="button" onClick={() => onChange('bg_image_url', '')}
              style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 8, padding: '10px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              ডিফল্টে ফিরুন
            </button>
          )}
        </div>

        {data.bg_image_url && (
          <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #E2E8F0', height: 140, position: 'relative' }}>
            <img src={data.bg_image_url} alt="Hero BG Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => e.target.style.display = 'none'} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>ব্যাকগ্রাউন্ড প্রিভিউ</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── 7. BANNER SLIDER TAB ── */
function BannerSliderTab({ data, onChange }) {
  const items = data.items || []

  const updateItem = (i, key, val) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [key]: val }
    onChange('items', updated)
  }

  const addItem = () => {
    onChange('items', [...items, { id: Date.now(), image: '', alt: 'নতুন ব্যানার', link: '/' }])
  }

  const removeItem = (i) => {
    onChange('items', items.filter((_, idx) => idx !== i))
  }

  const moveItem = (i, dir) => {
    const arr = [...items]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onChange('items', arr)
  }

  const handleImageUpload = (i, e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => updateItem(i, 'image', reader.result)
      reader.readAsDataURL(file)
    }
  }

  const LINK_OPTIONS = [
    { value: '/', label: 'হোমপেজ' },
    { value: '/doctors', label: 'ডাক্তার পাতা' },
    { value: '/hospitals', label: 'হাসপাতাল পাতা' },
    { value: '/services', label: 'সেবা পাতা' },
    { value: '/contact', label: 'যোগাযোগ পাতা' },
  ]

  const inputStyle = { background: '#FFFFFF', color: '#0F172A', border: '1.5px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: 13, width: '100%', outline: 'none' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h6 style={{ fontWeight: 800, margin: 0, color: '#0F172A', fontSize: 16 }}>স্লাইডার ব্যানার ({items.length}টি)</h6>
          <span style={{ fontSize: 12.5, color: '#64748B' }}>হোমপেজে ইমেজ স্লাইডার আকারে প্রদর্শিত হবে — ↑↓ দিয়ে সর্ট করতে পারবেন</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map((item, i) => (
          <div key={item.id || i} style={{ background: '#FFFFFF', borderRadius: 12, padding: '18px 20px', border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#F0FDF4', color: '#00B875', borderRadius: 6, padding: '4px 10px', fontWeight: 800, fontSize: 12 }}>ব্যানার #{i + 1}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0}
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.4 : 1, fontSize: 12 }}>↑</button>
                  <button type="button" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px', cursor: i === items.length - 1 ? 'not-allowed' : 'pointer', opacity: i === items.length - 1 ? 0.4 : 1, fontSize: 12 }}>↓</button>
                </div>
              </div>
              <button type="button" onClick={() => removeItem(i)}
                style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconTrash size={14} /> মুছুন
              </button>
            </div>

            <Row className="g-3">
              <Col md={12}>
                <Form.Label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>ব্যানার ছবি (URL অথবা ফাইল আপলোড)</Form.Label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input type="text" value={item.image || ''} onChange={e => updateItem(i, 'image', e.target.value)}
                      placeholder="https://... অথবা /images/banner.jpg"
                      style={inputStyle} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(i, e)}
                      style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 5 }} />
                    <button type="button" style={{ background: '#F0FDF4', border: '1.5px dashed #00B875', color: '#00B875', padding: '9px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      <IconUpload size={16} /> আপলোড
                    </button>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <Form.Label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>বিদ্যমান লিঙ্ক (ক্লিক করলে যাবে)</Form.Label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select value={item.link || '/'} onChange={e => updateItem(i, 'link', e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}>
                    {LINK_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    {!LINK_OPTIONS.find(o => o.value === item.link) && (
                      <option value={item.link}>{item.link} (কাস্টম)</option>
                    )}
                  </select>
                  <input type="text" value={item.link || ''} onChange={e => updateItem(i, 'link', e.target.value)}
                    placeholder="/custom-path"
                    style={{ ...inputStyle, width: 130 }} />
                </div>
              </Col>

              <Col md={6}>
                <Form.Label style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>বিদ্যমান Alt টেক্সট (SEO)</Form.Label>
                <input type="text" value={item.alt || ''} onChange={e => updateItem(i, 'alt', e.target.value)}
                  placeholder="ছবির বিবরণ লিখুন"
                  style={inputStyle} />
              </Col>

              {item.image && (
                <Col md={12}>
                  <div style={{ height: 100, borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#1E293B' }}>
                    <img src={item.image} alt={item.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none' }} />
                  </div>
                </Col>
              )}
            </Row>
          </div>
        ))}

        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8', border: '2px dashed #E2E8F0', borderRadius: 12 }}>
            <IconPhoto size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontWeight: 700 }}>নিচের বাটন থেকে প্রথম ব্যানার যোগ করুন</div>
          </div>
        )}

        {/* Add button at bottom — new banners appear after previous ones */}
        <button type="button" onClick={addItem}
          style={{ background: '#F0FDF4', color: '#00B875', border: '2px dashed #00B875', borderRadius: 10, padding: '14px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#00B875'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#00B875' }}>
          <IconPlus size={20} /> নতুন ব্যানার যোগ করুন (শেষে যোগ হবে)
        </button>
      </div>
    </div>
  )
}


/* ── MAIN CONTENT MANAGER PAGE COMPONENT ── */
export default function ContentManagerPage() {
  const [content, setContent] = useState(getContent())
  const [activeTab, setActiveTab] = useState('testimonials')
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
            ওয়েবসাইটের সকল সেকশন, রোগীর রিভিউ, সহযোগী হাসপাতাল এবং টেক্সট সরাসরি পরিচালনা করুন
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
                placeholder="ক্যাটাগরি খুঁজুন..."
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
              এখানে সংরক্ষিত যেকোনো পরিবর্তন অবিলম্বে আপনার হোমপেজ এবং সাইটের মূল সেকশনে লাইভ আপডেট হবে।
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

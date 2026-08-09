import { useState, useEffect } from 'react'
import { Row, Col, Form, Button } from 'react-bootstrap'
import { getContent, saveContent } from '../../../utils/contentService'

const TABS = [
  { key: 'site', label: '⚙️ সাইট সেটিং' },
  { key: 'hero', label: '🏠 হোম হিরো' },
  { key: 'stats', label: '📊 পরিসংখ্যান' },
  { key: 'why_us', label: '⭐ কেন আমরা?' },
  { key: 'newsletter', label: '📧 নিউজলেটার' },
  { key: 'faq', label: '❓ FAQ' },
  { key: 'helplines', label: '📞 হেল্পলাইন' },
  { key: 'contact', label: '📍 যোগাযোগ পেজ' },
  { key: 'about_us', label: '🏢 আমাদের সম্পর্কে' },
  { key: 'terms', label: '📜 শর্তাবলী' },
  { key: 'privacy', label: '🔒 গোপনীয়তা নীতি' },
]

function FieldInput({ label, value, onChange, multiline = false, rows = 3 }) {
  const style = {
    background: 'var(--admin-card-bg)', color: 'var(--admin-text)',
    border: '1px solid var(--admin-border)', borderRadius: 12,
    padding: '12px 16px', fontFamily: "'Hind Siliguri', sans-serif",
    fontSize: 14, width: '100%', transition: '0.2s',
  }
  return (
    <Form.Group className="mb-3">
      <Form.Label style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.08em' }}>
        {label}
      </Form.Label>
      {multiline
        ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={rows} style={{ ...style, resize: 'vertical' }} />
        : <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} style={style} />
      }
    </Form.Group>
  )
}

function SiteTab({ data, onChange }) {
  const f = (key) => <FieldInput key={key} label={key} value={data[key]} onChange={v => onChange(key, v)} />
  return (
    <Row className="g-4">
      <Col md={6}><FieldInput label="সাইটের নাম" value={data.name} onChange={v => onChange('name', v)} /></Col>
      <Col md={6}><FieldInput label="স্লোগান" value={data.tagline} onChange={v => onChange('tagline', v)} /></Col>
      <Col md={6}><FieldInput label="প্রধান ফোন" value={data.phone} onChange={v => onChange('phone', v)} /></Col>
      <Col md={6}><FieldInput label="সেকেন্ডারি ফোন টেক্সট" value={data.phone_secondary} onChange={v => onChange('phone_secondary', v)} /></Col>
      <Col md={6}><FieldInput label="ইমেইল" value={data.email} onChange={v => onChange('email', v)} /></Col>
      <Col md={6}><FieldInput label="সাপোর্ট ইমেইল" value={data.email_support} onChange={v => onChange('email_support', v)} /></Col>
      <Col md={6}><FieldInput label="ওয়েবসাইট" value={data.website} onChange={v => onChange('website', v)} /></Col>
      <Col md={12}><FieldInput label="ঠিকানা" value={data.address} onChange={v => onChange('address', v)} /></Col>
      <Col md={12}><FieldInput label="অফিস সময়" value={data.office_hours} onChange={v => onChange('office_hours', v)} /></Col>
      <Col md={6}><FieldInput label="Facebook URL" value={data.facebook} onChange={v => onChange('facebook', v)} /></Col>
      <Col md={6}><FieldInput label="YouTube URL" value={data.youtube} onChange={v => onChange('youtube', v)} /></Col>
      <Col md={6}><FieldInput label="Instagram URL" value={data.instagram} onChange={v => onChange('instagram', v)} /></Col>
      <Col md={6}><FieldInput label="LinkedIn URL" value={data.linkedin} onChange={v => onChange('linkedin', v)} /></Col>
      <Col md={12}><FieldInput label="Copyright টেক্সট" value={data.copyright} onChange={v => onChange('copyright', v)} /></Col>
    </Row>
  )
}

function HeroTab({ data, onChange }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange('image_url', reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Row className="g-4">
      <Col md={12}><FieldInput label="ব্যাজ টেক্সট" value={data.badge} onChange={v => onChange('badge', v)} /></Col>
      <Col md={6}><FieldInput label="শিরোনাম লাইন ১" value={data.title_line1} onChange={v => onChange('title_line1', v)} /></Col>
      <Col md={6}><FieldInput label="শিরোনাম লাইন ২ (সবুজ)" value={data.title_line2} onChange={v => onChange('title_line2', v)} /></Col>
      <Col md={12}><FieldInput label="সাব-টাইটেল" value={data.subtitle} onChange={v => onChange('subtitle', v)} multiline rows={3} /></Col>
      <Col md={6}><FieldInput label="প্রাথমিক বাটন" value={data.btn_primary} onChange={v => onChange('btn_primary', v)} /></Col>
      <Col md={6}><FieldInput label="সেকেন্ডারি বাটন" value={data.btn_secondary} onChange={v => onChange('btn_secondary', v)} /></Col>
      <Col md={12}>
        <div className="mb-3">
          <Form.Label style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.08em' }}>
            হিরো ছবি (Upload or URL)
          </Form.Label>
          <div className="d-flex gap-3 align-items-center">
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                value={data.image_url || ''} 
                onChange={e => onChange('image_url', e.target.value)} 
                placeholder="ছবির URL লিখুন..."
                style={{
                  background: 'var(--admin-card-bg)', color: 'var(--admin-text)',
                  border: '1px solid var(--admin-border)', borderRadius: 12,
                  padding: '12px 16px', fontSize: 14, width: '100%'
                }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} 
              />
              <button className="admin-btn" style={{ background: 'var(--admin-bg)', border: '1.5px dashed var(--admin-primary)', color: 'var(--admin-primary)', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 13, pointerEvents: 'none' }}>
                📁 আপলোড করুন
              </button>
            </div>
          </div>
          {data.image_url && (
            <div className="mt-3" style={{ position: 'relative', width: 120, height: 120, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
              <img src={data.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button 
                onClick={() => onChange('image_url', '')} 
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </Col>
    </Row>
  )
}

function StatsTab({ data, onChange }) {
  return (
    <Row className="g-4">
      <Col md={6}><FieldInput label="ডাক্তার সংখ্যা" value={data.doctors_count} onChange={v => onChange('doctors_count', v)} /></Col>
      <Col md={6}><FieldInput label="ডাক্তার লেবেল" value={data.doctors_label} onChange={v => onChange('doctors_label', v)} /></Col>
      <Col md={6}><FieldInput label="হাসপাতাল সংখ্যা" value={data.hospitals_count} onChange={v => onChange('hospitals_count', v)} /></Col>
      <Col md={6}><FieldInput label="হাসপাতাল লেবেল" value={data.hospitals_label} onChange={v => onChange('hospitals_label', v)} /></Col>
      <Col md={6}><FieldInput label="সেবা সংখ্যা" value={data.services_count} onChange={v => onChange('services_count', v)} /></Col>
      <Col md={6}><FieldInput label="সেবা লেবেল" value={data.services_label} onChange={v => onChange('services_label', v)} /></Col>
      <Col md={6}><FieldInput label="রোগী সংখ্যা" value={data.patients_count} onChange={v => onChange('patients_count', v)} /></Col>
      <Col md={6}><FieldInput label="রোগী লেবেল" value={data.patients_label} onChange={v => onChange('patients_label', v)} /></Col>
    </Row>
  )
}

function WhyUsTab({ data, onChange }) {
  const features = data.features || []
  const updateFeature = (i, key, val) => {
    const updated = [...features]
    updated[i] = { ...updated[i], [key]: val }
    onChange('features', updated)
  }
  const addFeature = () => onChange('features', [...features, { icon: '✅', title: 'নতুন ফিচার', desc: 'বিবরণ লিখুন' }])
  const removeFeature = (i) => onChange('features', features.filter((_, idx) => idx !== i))

  return (
    <div>
      <Row className="g-4 mb-4">
        <Col md={6}><FieldInput label="ব্যাজ" value={data.badge} onChange={v => onChange('badge', v)} /></Col>
        <Col md={6}><FieldInput label="শিরোনাম" value={data.title} onChange={v => onChange('title', v)} /></Col>
      </Row>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 style={{ fontWeight: 800, margin: 0, color: 'var(--admin-text)' }}>ফিচার কার্ডসমূহ ({features.length})</h6>
        <button onClick={addFeature} style={{ background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          + নতুন যোগ করুন
        </button>
      </div>
      {features.map((f, i) => (
        <div key={i} style={{ background: 'var(--admin-bg)', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid var(--admin-border)', position: 'relative' }}>
          <button onClick={() => removeFeature(i)} style={{ position: 'absolute', top: 12, right: 12, background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 8, padding: '4px 10px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>মুছুন</button>
          <Row className="g-3">
            <Col md={2}><FieldInput label="আইকন (emoji)" value={f.icon} onChange={v => updateFeature(i, 'icon', v)} /></Col>
            <Col md={4}><FieldInput label="শিরোনাম" value={f.title} onChange={v => updateFeature(i, 'title', v)} /></Col>
            <Col md={6}><FieldInput label="বিবরণ" value={f.desc} onChange={v => updateFeature(i, 'desc', v)} /></Col>
          </Row>
        </div>
      ))}
    </div>
  )
}

function FaqTab({ data, onChange }) {
  const items = data.items || []
  const update = (i, key, val) => {
    const u = [...items]; u[i] = { ...u[i], [key]: val }; onChange('items', u)
  }
  const add = () => onChange('items', [...items, { q: 'নতুন প্রশ্ন?', a: 'উত্তর লিখুন।' }])
  const remove = (i) => onChange('items', items.filter((_, idx) => idx !== i))

  return (
    <div>
      <Row className="g-4 mb-4">
        <Col md={6}><FieldInput label="ব্যাজ" value={data.badge} onChange={v => onChange('badge', v)} /></Col>
        <Col md={6}><FieldInput label="শিরোনাম" value={data.title} onChange={v => onChange('title', v)} /></Col>
      </Row>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 style={{ fontWeight: 800, margin: 0, color: 'var(--admin-text)' }}>প্রশ্নোত্তর ({items.length}টি)</h6>
        <button onClick={add} style={{ background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ নতুন প্রশ্ন</button>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ background: 'var(--admin-bg)', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid var(--admin-border)', position: 'relative' }}>
          <button onClick={() => remove(i)} style={{ position: 'absolute', top: 12, right: 12, background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 8, padding: '4px 10px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>মুছুন</button>
          <FieldInput label={`প্রশ্ন ${i + 1}`} value={item.q} onChange={v => update(i, 'q', v)} />
          <FieldInput label="উত্তর" value={item.a} onChange={v => update(i, 'a', v)} multiline rows={2} />
        </div>
      ))}
    </div>
  )
}

function HelplinesTab({ data, onChange }) {
  const items = data.items || []
  const update = (i, key, val) => { const u = [...items]; u[i] = { ...u[i], [key]: val }; onChange('items', u) }
  const add = () => onChange('items', [...items, { label: 'নতুন হেল্পলাইন', number: '000' }])
  const remove = (i) => onChange('items', items.filter((_, idx) => idx !== i))

  return (
    <div>
      <FieldInput label="সেকশন শিরোনাম" value={data.title} onChange={v => onChange('title', v)} />
      <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
        <h6 style={{ fontWeight: 800, margin: 0, color: 'var(--admin-text)' }}>হেল্পলাইন ({items.length}টি)</h6>
        <button onClick={add} style={{ background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ যোগ করুন</button>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ background: 'var(--admin-bg)', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid var(--admin-border)', display: 'flex', gap: 16, alignItems: 'flex-end', position: 'relative' }}>
          <div style={{ flex: 1 }}><FieldInput label="লেবেল" value={item.label} onChange={v => update(i, 'label', v)} /></div>
          <div style={{ flex: 1 }}><FieldInput label="নম্বর" value={item.number} onChange={v => update(i, 'number', v)} /></div>
          <button onClick={() => remove(i)} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 8, padding: '10px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer', marginBottom: 12, flexShrink: 0 }}>✕</button>
        </div>
      ))}
    </div>
  )
}

function SimpleTextTab({ data, onChange, fields }) {
  return (
    <Row className="g-4">
      {fields.map(f => (
        <Col md={f.full ? 12 : 6} key={f.key}>
          <FieldInput label={f.label} value={data[f.key]} onChange={v => onChange(f.key, v)} multiline={f.multiline} rows={f.rows || 3} />
        </Col>
      ))}
    </Row>
  )
}

export default function ContentManagerPage() {
  const [content, setContent] = useState(getContent())
  const [activeTab, setActiveTab] = useState('site')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await saveContent(content)
    
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const updateSection = (section, key, value) => {
    setContent(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }))
  }

  const renderTabContent = () => {
    const sec = content[activeTab] || {}
    const upd = (k, v) => updateSection(activeTab, k, v)

    switch (activeTab) {
      case 'site': return <SiteTab data={sec} onChange={upd} />
      case 'hero': return <HeroTab data={sec} onChange={upd} />
      case 'stats': return <StatsTab data={sec} onChange={upd} />
      case 'why_us': return <WhyUsTab data={sec} onChange={upd} />
      case 'newsletter': return (
        <SimpleTextTab data={sec} onChange={upd} fields={[
          { key: 'title', label: 'শিরোনাম', full: true, multiline: true, rows: 2 },
          { key: 'subtitle', label: 'সাব-টাইটেল', full: true },
          { key: 'placeholder', label: 'ইমেইল প্লেসহোল্ডার' },
          { key: 'btn_label', label: 'বাটন লেবেল' },
        ]} />
      )
      case 'faq': return <FaqTab data={sec} onChange={upd} />
      case 'helplines': return <HelplinesTab data={sec} onChange={upd} />
      case 'contact': return (
        <SimpleTextTab data={sec} onChange={upd} fields={[
          { key: 'hero_title', label: 'হিরো শিরোনাম', full: true },
          { key: 'hero_subtitle', label: 'হিরো সাব-টাইটেল', full: true, multiline: true },
          { key: 'emergency_title', label: 'জরুরি সহায়তা শিরোনাম' },
          { key: 'emergency_subtitle', label: 'জরুরি সহায়তা সাব-টাইটেল' },
          { key: 'map_embed', label: 'Google Map Embed URL', full: true },
        ]} />
      )
      case 'about_us': return (
        <SimpleTextTab data={sec} onChange={upd} fields={[
          { key: 'title', label: 'শিরোনাম', full: true },
          { key: 'subtitle', label: 'সাব-টাইটেল', full: true, multiline: true, rows: 2 },
          { key: 'description', label: 'বিবরণ', full: true, multiline: true, rows: 5 },
          { key: 'mission', label: 'আমাদের লক্ষ্য', full: true, multiline: true, rows: 2 },
          { key: 'vision', label: 'আমাদের দৃষ্টিভঙ্গি', full: true, multiline: true, rows: 2 },
        ]} />
      )
      case 'terms': return (
        <SimpleTextTab data={sec} onChange={upd} fields={[
          { key: 'title', label: 'শিরোনাম', full: true },
          { key: 'content', label: 'মূল কন্টেন্ট', full: true, multiline: true, rows: 8 },
          { key: 'cancellation', label: 'বাতিলকরণ নীতি', full: true, multiline: true, rows: 3 },
        ]} />
      )
      case 'privacy': return (
        <SimpleTextTab data={sec} onChange={upd} fields={[
          { key: 'title', label: 'শিরোনাম', full: true },
          { key: 'content', label: 'মূল কন্টেন্ট', full: true, multiline: true, rows: 8 },
          { key: 'cookies', label: 'কুকি নীতি', full: true, multiline: true, rows: 3 },
        ]} />
      )
      default: return <div style={{ color: 'var(--admin-text-muted)', padding: 40, textAlign: 'center' }}>কন্টেন্ট লোড হচ্ছে...</div>
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', padding: '4px 0' }}>
      <div className="admin-page-header" style={{ marginBottom: 32 }}>
        <div>
          <h2 className="admin-page-title">কন্টেন্ট ম্যানেজার</h2>
          <p className="admin-page-subtitle">সাইটের সকল কন্টেন্ট এখান থেকে পরিচালনা করুন</p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={handleSave}
          style={{ padding: '12px 32px', borderRadius: 14, fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, transition: '0.3s', background: saved ? '#10B981' : undefined }}
        >
          {saved ? '✅ সংরক্ষিত!' : '💾 পরিবর্তন প্রকাশ করুন'}
        </button>
      </div>

      <Row className="g-4">
        {/* Sidebar */}
        <Col md={3}>
          <div style={{ background: 'var(--admin-card-bg)', borderRadius: 20, border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  width: '100%', textAlign: 'left', padding: '14px 20px',
                  background: activeTab === tab.key ? 'var(--admin-primary)' : 'transparent',
                  color: activeTab === tab.key ? 'white' : 'var(--admin-text-muted)',
                  fontWeight: 700, fontSize: 13, border: 'none',
                  borderBottom: '1px solid var(--admin-border)', cursor: 'pointer',
                  transition: '0.2s', fontFamily: "'Hind Siliguri', sans-serif",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Col>

        {/* Content */}
        <Col md={9}>
          <div className="admin-card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--admin-border)' }}>
              <h5 style={{ fontWeight: 900, color: 'var(--admin-text)', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                {TABS.find(t => t.key === activeTab)?.label}
              </h5>
              <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                পরিবর্তন করুন এবং "প্রকাশ করুন" চাপুন
              </span>
            </div>
            {renderTabContent()}
          </div>

          <div style={{ marginTop: 16, padding: '16px 24px', background: 'rgba(0,168,140,0.06)', borderRadius: 14, border: '1px solid rgba(0,168,140,0.15)' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--admin-text-muted)' }}>
              💡 <strong>টিপ:</strong> এখানে করা পরিবর্তনগুলি "প্রকাশ করুন" বাটনে চাপলে সাইটে প্রতিফলিত হবে।
            </p>
          </div>
        </Col>
      </Row>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        textarea, input[type="text"] { outline: none; }
        textarea:focus, input[type="text"]:focus {
          border-color: var(--admin-primary) !important;
          box-shadow: 0 0 0 3px rgba(0,168,140,0.1);
        }
      `}</style>
    </div>
  )
}

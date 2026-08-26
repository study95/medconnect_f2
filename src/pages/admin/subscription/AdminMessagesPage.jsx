import { useState, useEffect, useRef } from 'react'
import { getAdminNotifications, sendAdminNotification, deleteAdminNotification } from '../../../api/subscriptionApi'
import { getDoctors } from '../../../api/adminApi'
import { useDialog } from '../../../hooks/useDialog'
import { DIALOG_MESSAGES, DIALOG_BUTTONS } from '../../../utils/dialogMessages'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

// Premium Searchable Select Component for Recipients
function SearchableSelect({ label, options, value, onChange, placeholder, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'inactive'
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.id.toString() === value.toString())
  
  // Ensure "Broadcast to All" is an option in the list or handled specially
  const broadcastOption = { id: '', name: '📢 Broadcast to All Doctors' }
  const allOptions = [broadcastOption, ...options]
  
  const filteredOptions = allOptions
    .filter(opt => {
      // 1. Search text filter
      const matchesSearch = opt.name?.toLowerCase().includes(search.toLowerCase())
      
      // 2. Status filter (Special case for "Broadcast to All" which doesn't have a status)
      if (opt.id === '') return matchesSearch 
      
      const isActive = opt.is_active === true || opt.is_active === 1
      if (statusFilter === 'active') return matchesSearch && isActive
      if (statusFilter === 'inactive') return matchesSearch && !isActive
      return matchesSearch
    })

  return (
    <div className="admin-form-group" ref={dropdownRef} style={{ position: 'relative' }}>
      <label className="admin-form-label">{label}</label>
      <div 
        className="admin-form-input"
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: 'var(--admin-card-bg)', 
          height: 48, padding: '0 16px', borderRadius: 12, border: '1px solid var(--admin-border)',
          fontSize: 14, fontWeight: 500, transition: 'all 0.2s', color: 'var(--admin-text)'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption || value === '' ? 'var(--admin-text)' : 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value === '' ? '📢 Broadcast to All Doctors' : (selectedOption ? selectedOption.name : placeholder)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 12, marginTop: 8,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.02)' }}>
            <input 
              type="text" 
              autoFocus
              placeholder="Search doctor..." 
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', outline: 'none', fontSize: 13, background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {['all', 'active', 'inactive'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setStatusFilter(s); }}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: 'none',
                    background: statusFilter === s ? 'var(--admin-primary)' : 'var(--admin-bg)',
                    color: statusFilter === s ? 'white' : 'var(--admin-text-muted)',
                    textTransform: 'uppercase', cursor: 'pointer', transition: '0.2s'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No results</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 16px', fontSize: 14, cursor: 'pointer', 
                    background: value.toString() === opt.id.toString() ? 'var(--admin-sidebar-active)' : 'transparent',
                    color: opt.is_active === false || opt.is_active === 0 ? 'var(--admin-text-muted)' : 'var(--admin-text)',
                    borderBottom: '1px solid var(--admin-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.03)'}
                  onMouseLeave={(e) => e.target.style.background = value.toString() === opt.id.toString() ? 'var(--admin-sidebar-active)' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <span>{opt.name}</span>
                  {(opt.is_active === false || opt.is_active === 0) && (
                    <span style={{ fontSize: 10, background: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>INACTIVE</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminMessagesPage() {
  const { confirm, showSuccess, showError } = useDialog()
  const [notifications, setNotifications] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewReadersFor, setViewReadersFor] = useState(null)
  const [form, setForm] = useState({ doctor_id: '', title: '', message: '', type: 'info', is_popup: false })

  useEffect(() => { load(); loadDoctors() }, [])

  const load = async () => {
    try {
      const res = await getAdminNotifications()
      const data = res.data?.data
      setNotifications(data?.data || data || [])
    } catch {  }
    finally { setLoading(false) }
  }

  const loadDoctors = async () => {
    try {
      const res = await getDoctors({ per_page: 500 })
      const data = res.data?.data || res.data || []
      setDoctors(Array.isArray(data) ? data : data.data || [])
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...form }
      if (!data.doctor_id) data.doctor_id = null // broadcast
      await sendAdminNotification(data)
      showSuccess({
        title: 'মেসেজ পাঠানো হয়েছে',
        message: 'নোটিফিকেশন বার্তা সফলভাবে পাঠানো হয়েছে।',
      })
      setShowModal(false)
      load()
    } catch (err) {
      showError({
        title: DIALOG_MESSAGES.ERROR.title,
        message: 'নোটিফিকেশন পাঠাতে সমস্যা হয়েছে।',
      })
    }
  }

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: DIALOG_MESSAGES.NOTIFICATION_DELETE_CONFIRM.title,
      message: DIALOG_MESSAGES.NOTIFICATION_DELETE_CONFIRM.message,
      confirmText: DIALOG_BUTTONS.DELETE,
      cancelText: DIALOG_BUTTONS.CANCEL,
      variant: 'danger',
    })
    if (!isConfirmed) return
    try { 
      await deleteAdminNotification(id)
      showSuccess({
        title: DIALOG_MESSAGES.DELETE_SUCCESS.title,
        message: DIALOG_MESSAGES.DELETE_SUCCESS.message,
      })
      load() 
    }
    catch {
      showError({
        title: DIALOG_MESSAGES.ERROR.title,
        message: 'নোটিফিকেশন মুছে ফেলা সম্ভব হয়নি।',
      })
    }
  }

  const typeIcons = { warning: '⚠️', info: 'ℹ️', promo: '🎁', system: '🔧', expiry: '⏰' }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">📨 Messages & Notifications</h2>
          <p className="admin-page-subtitle">Send messages and alerts to doctors</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => { setForm({ doctor_id: '', title: '', message: '', type: 'info', is_popup: false }); setShowModal(true) }}>
          + Send Message
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📨</div>
            <h4>No messages sent</h4>
            <p>Send notifications and alerts to your doctors.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>To</th>
                  <th>Popup</th>
                  <th>Read</th>
                  <th>Sent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(n => (
                  <tr key={n.id}>
                    <td>{typeIcons[n.type] || 'ℹ️'} <span style={{ textTransform: 'capitalize', fontSize: 12, fontWeight: 600 }}>{n.type}</span></td>
                    <td style={{ fontWeight: 700 }}>{n.title}</td>
                    <td style={{ fontSize: 13, color: '#64748B' }}>{n.doctor ? n.doctor.name : '📢 All Doctors'}</td>
                    <td>{n.is_popup ? '✅ Yes' : '—'}</td>
                    <td>
                      {!n.doctor ? (
                        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setViewReadersFor(n)}>👀 View Readers</button>
                      ) : (
                        n.is_read ? '✅ Read' : '❌ Unread'
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: '#94A3B8' }}>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</td>
                    <td>
                      <button className="admin-btn admin-btn-sm" style={{ background: '#FEE2E2', color: '#DC2626', border: 'none' }} onClick={() => handleDelete(n.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Send Notification</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <SearchableSelect 
                  label="Recipient"
                  options={doctors}
                  value={form.doctor_id}
                  onChange={val => setForm(f => ({ ...f, doctor_id: val }))}
                  placeholder="Select a doctor..."
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Type</label>
                    <select className="admin-form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="info">ℹ️ Info</option>
                      <option value="warning">⚠️ Warning</option>
                      <option value="promo">🎁 Promo</option>
                      <option value="system">🔧 System</option>
                      <option value="expiry">⏰ Expiry</option>
                    </select>
                  </div>
                  <div className="admin-form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.is_popup} onChange={e => setForm(f => ({ ...f, is_popup: e.target.checked }))} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Show as Popup on Login</span>
                    </label>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Title</label>
                  <input className="admin-form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Important Update" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Message</label>
                  <div className="quill-editor-wrapper">
                    <ReactQuill 
                      theme="snow"
                      value={form.message} 
                      onChange={val => setForm(f => ({ ...f, message: val }))}
                      style={{ height: '200px', marginBottom: '50px' }}
                      placeholder="Write your message..."
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary">📤 Send</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewReadersFor && (
        <div className="admin-modal-overlay" onClick={() => setViewReadersFor(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">📖 Read Receipts</h3>
              <button className="admin-modal-close" onClick={() => setViewReadersFor(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ marginBottom: 16 }}><strong>Message:</strong> {viewReadersFor.title}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ border: '1px solid #E5EAF0', borderRadius: 8, padding: 12 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#00A88C' }}>✅ Read By ({viewReadersFor.reads?.length || 0})</h4>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, maxHeight: 300, overflowY: 'auto' }}>
                    {viewReadersFor.reads?.map(r => (
                      <li key={r.id}>{r.doctor?.name || 'Unknown Doctor'}</li>
                    ))}
                    {(!viewReadersFor.reads || viewReadersFor.reads.length === 0) && (
                      <li style={{ color: '#94A3B8', listStyle: 'none', marginLeft: -20 }}>No one has read this yet.</li>
                    )}
                  </ul>
                </div>

                <div style={{ border: '1px solid #E5EAF0', borderRadius: 8, padding: 12 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#EF4444' }}>❌ Unread By ({Math.max(0, doctors.length - (viewReadersFor.reads?.length || 0))})</h4>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, maxHeight: 300, overflowY: 'auto' }}>
                    {doctors.filter(d => !viewReadersFor.reads?.find(r => r.doctor_id === d.id)).map(d => (
                      <li key={d.id}>{d.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

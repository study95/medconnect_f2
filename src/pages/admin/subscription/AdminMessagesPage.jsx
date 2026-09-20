import { useState, useEffect, useRef } from 'react'
import { 
  getAdminNotifications, 
  sendAdminNotification, 
  updateAdminNotification, 
  deleteAdminNotification 
} from '../../../api/subscriptionApi'
import { getDoctors, getHospitals } from '../../../api/adminApi'
import { useDialog } from '../../../hooks/useDialog'
import { DIALOG_MESSAGES, DIALOG_BUTTONS } from '../../../utils/dialogMessages'
import DeleteModal from '../../../components/admin/DeleteModal'
import toast from 'react-hot-toast'
import { 
  Megaphone, 
  Stethoscope, 
  Building2, 
  Bell, 
  CheckCircle2, 
  Eye, 
  Trash2, 
  Plus, 
  Filter, 
  Users, 
  X, 
  Edit3, 
  Calendar, 
  Clock, 
  User,
  Sparkles,
  Layers
} from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const quillModules = {
  toolbar: [
    [{ header: [false, 1, 2, 3] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'clean']
  ]
}

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'link'
]

// Premium Searchable Select Component for Recipients (Doctors or Hospitals)
function SearchableSelect({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder, 
  broadcastLabel = '📢 Broadcast to All', 
  searchPlaceholder = 'Search...',
  disabled = false 
}) {
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

  const selectedOption = options.find(opt => 
    opt.id?.toString() === value?.toString() || 
    (opt.public_id && opt.public_id?.toString() === value?.toString())
  )
  
  const broadcastOption = { id: '', name: broadcastLabel }
  const allOptions = [broadcastOption, ...options]
  
  const filteredOptions = allOptions.filter(opt => {
    const matchesSearch = opt.name?.toLowerCase().includes(search.toLowerCase())
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
          cursor: disabled ? 'not-allowed' : 'pointer', background: 'var(--admin-card-bg, #ffffff)', 
          height: 48, padding: '0 16px', borderRadius: 12, border: '1px solid var(--admin-border, #E2E8F0)',
          fontSize: 14, fontWeight: 500, transition: 'all 0.2s', color: 'var(--admin-text, #0F172A)'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption || value === '' ? 'var(--admin-text, #0F172A)' : 'var(--admin-text-muted, #64748B)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value === '' ? broadcastLabel : (selectedOption ? selectedOption.name : placeholder)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--admin-text-muted, #64748B)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--admin-card-bg, #ffffff)', border: '1px solid var(--admin-border, #E2E8F0)', borderRadius: 12, marginTop: 8,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--admin-border, #E2E8F0)', background: 'rgba(0,0,0,0.02)' }}>
            <input 
              type="text" 
              autoFocus
              placeholder={searchPlaceholder} 
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--admin-border, #E2E8F0)', outline: 'none', fontSize: 13, background: 'var(--admin-card-bg, #ffffff)', color: 'var(--admin-text, #0F172A)' }}
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
                    background: statusFilter === s ? 'var(--admin-primary, #00A88C)' : 'var(--admin-bg, #F8FAFC)',
                    color: statusFilter === s ? 'white' : 'var(--admin-text-muted, #64748B)',
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
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted, #64748B)', fontSize: 13 }}>No results found</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = value?.toString() === opt.id?.toString() || 
                  (opt.public_id && value?.toString() === opt.public_id?.toString())

                return (
                  <div 
                    key={opt.public_id || opt.id || 'broadcast'} 
                    style={{ 
                      padding: '10px 16px', fontSize: 14, cursor: 'pointer', 
                      background: isSelected ? 'rgba(0, 168, 140, 0.08)' : 'transparent',
                      color: opt.is_active === false || opt.is_active === 0 ? 'var(--admin-text-muted, #64748B)' : 'var(--admin-text, #0F172A)',
                      borderBottom: '1px solid var(--admin-border, #E2E8F0)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? 'rgba(0, 168, 140, 0.08)' : 'transparent'}
                    onClick={() => {
                      const chosenVal = opt.public_id || opt.id || ''
                      onChange(chosenVal ? chosenVal.toString() : '')
                      setIsOpen(false)
                      setSearch('')
                    }}
                  >
                    <span style={{ fontWeight: opt.id === '' ? 600 : 400 }}>{opt.name}</span>
                    {(opt.is_active === false || opt.is_active === 0) && (
                      <span style={{ fontSize: 10, background: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>INACTIVE</span>
                    )}
                  </div>
                )
              })
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
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editNotice, setEditNotice] = useState(null)
  const [viewNotice, setViewNotice] = useState(null)
  const [viewReadersFor, setViewReadersFor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [activeTabFilter, setActiveTabFilter] = useState('all') // 'all', 'doctors', 'hospitals'

  // Modal form state
  const [targetCategory, setTargetCategory] = useState('doctor') // 'doctor' | 'hospital'
  const [form, setForm] = useState({ 
    target_id: '', 
    title: '', 
    message: '', 
    type: 'info', 
    is_popup: false 
  })

  useEffect(() => { 
    load()
    loadDoctors()
    loadHospitals()
  }, [])

  const load = async () => {
    try {
      const res = await getAdminNotifications()
      const data = res.data?.data
      setNotifications(data?.data || data || [])
    } catch { 
      // silent
    } finally { 
      setLoading(false) 
    }
  }

  const loadDoctors = async () => {
    try {
      const res = await getDoctors({ per_page: 500 })
      const data = res.data?.data || res.data || []
      setDoctors(Array.isArray(data) ? data : data.data || [])
    } catch {}
  }

  const loadHospitals = async () => {
    try {
      const res = await getHospitals({ per_page: 500 })
      const data = res.data?.data || res.data || []
      setHospitals(Array.isArray(data) ? data : data.data || [])
    } catch {}
  }

  const openCreateModal = () => {
    setEditNotice(null)
    setTargetCategory('doctor')
    setForm({ target_id: '', title: '', message: '', type: 'info', is_popup: false })
    setShowModal(true)
  }

  const openEditModal = (n) => {
    const isHosp = n.target_type === 'hospital' || n.target_type === 'all_hospitals' || Boolean(n.hospital)
    setTargetCategory(isHosp ? 'hospital' : 'doctor')
    
    let targetId = ''
    if (isHosp) {
      targetId = n.hospital?.public_id || n.hospital_id || ''
    } else {
      targetId = n.doctor?.public_id || n.doctor_id || ''
    }

    setForm({
      target_id: targetId ? targetId.toString() : '',
      title: n.title || '',
      message: n.message || '',
      type: n.type || 'info',
      is_popup: Boolean(n.is_popup),
    })
    setEditNotice(n)
    setViewNotice(null)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.title?.trim()) {
      showError({
        title: 'শিরোনাম আবশ্যক',
        message: 'অনুগ্রহ করে নোটিশের একটি শিরোনাম (Title) দিন।',
      })
      return
    }

    const cleanMessage = (form.message || '').replace(/<[^>]*>/g, '').trim()
    if (!cleanMessage) {
      showError({
        title: 'বার্তা আবশ্যক',
        message: 'অনুগ্রহ করে নোটিশের বিস্তারিত বার্তা বা মেসেজ লিখুন।',
      })
      return
    }

    try {
      const payload = {
        title: form.title.trim(),
        message: form.message,
        type: form.type || 'info',
        is_popup: Boolean(form.is_popup),
      }

      if (targetCategory === 'doctor') {
        if (form.target_id) {
          payload.target_type = 'doctor'
          payload.doctor_id = form.target_id
        } else {
          payload.target_type = 'all_doctors'
          payload.doctor_id = null
        }
      } else {
        if (form.target_id) {
          payload.target_type = 'hospital'
          payload.hospital_id = form.target_id
        } else {
          payload.target_type = 'all_hospitals'
          payload.hospital_id = null
        }
      }

      if (editNotice) {
        await updateAdminNotification(editNotice.id, payload)
        showSuccess({
          title: 'নোটিশ আপডেট হয়েছে',
          message: 'নোটিফিকেশন বার্তা সফলভাবে আপডেট করা হয়েছে।',
        })
      } else {
        await sendAdminNotification(payload)
        showSuccess({
          title: 'নোটিশ পাঠানো হয়েছে',
          message: 'নোটিফিকেশন বার্তা সফলভাবে ব্রডকাস্ট বা পাঠানো হয়েছে।',
        })
      }

      setShowModal(false)
      setEditNotice(null)
      load()
    } catch (err) {
      const valErrors = err.response?.data?.errors
      let errorMsg = err.response?.data?.message || 'নোটিফিকেশন পাঠাতে সমস্যা হয়েছে।'
      if (valErrors && typeof valErrors === 'object') {
        const firstKey = Object.keys(valErrors)[0]
        if (firstKey && Array.isArray(valErrors[firstKey]) && valErrors[firstKey][0]) {
          errorMsg = valErrors[firstKey][0]
        }
      }
      showError({
        title: DIALOG_MESSAGES.ERROR.title,
        message: errorMsg,
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAdminNotification(deleteTarget.id)
      toast.success('Notice deleted successfully')
      if (viewNotice?.id === deleteTarget.id) setViewNotice(null)
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete notice')
    } finally {
      setDeleting(false)
    }
  }

  const typeIcons = { warning: '⚠️', info: 'ℹ️', promo: '🎁', system: '🔧', expiry: '⏰' }

  const filteredNotifications = notifications.filter(n => {
    if (activeTabFilter === 'doctors') {
      return n.target_type === 'all_doctors' || n.target_type === 'doctor' || n.doctor || (!n.target_type && !n.hospital)
    }
    if (activeTabFilter === 'hospitals') {
      return n.target_type === 'all_hospitals' || n.target_type === 'hospital' || n.hospital
    }
    return true
  })

  // Render recipient badge
  const renderRecipientBadge = (n) => {
    if (n.target_type === 'all_hospitals') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E0F2FE', color: '#0369A1', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
          <Building2 size={13} /> 📢 All Hospitals
        </span>
      )
    }
    if (n.target_type === 'hospital' || n.hospital) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDFA', color: '#0F766E', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
          <Building2 size={13} /> 🏥 {n.hospital?.name || `Hospital #${n.hospital_id}`}
        </span>
      )
    }
    if (n.target_type === 'doctor' || n.doctor) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#4338CA', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
          <Stethoscope size={13} /> 🩺 Dr. {n.doctor?.name || `Doctor #${n.doctor_id}`}
        </span>
      )
    }
    // Default: all doctors
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
        <Megaphone size={13} /> 📢 All Doctors
      </span>
    )
  }

  const isBroadcast = (n) => {
    return n.target_type === 'all_doctors' || n.target_type === 'all_hospitals' || (!n.doctor_id && !n.hospital_id)
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      <style>{`
        /* Quill Rich Text Editor Modern Polished Styling */
        .quill-editor-wrapper {
          border-radius: 12px;
          overflow: hidden;
          border: 1.5px solid var(--admin-border, #E2E8F0);
          background: var(--admin-card-bg, #ffffff);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .quill-editor-wrapper:focus-within {
          border-color: var(--admin-primary, #00A88C);
          box-shadow: 0 0 0 3px rgba(0, 168, 140, 0.12);
        }
        .quill-editor-wrapper .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid var(--admin-border, #E2E8F0) !important;
          background: #F8FAFC !important;
          padding: 8px 12px !important;
          font-family: inherit !important;
        }
        .quill-editor-wrapper .ql-toolbar button {
          border-radius: 6px !important;
          width: 28px !important;
          height: 28px !important;
          padding: 3px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.15s ease !important;
        }
        .quill-editor-wrapper .ql-toolbar button:hover,
        .quill-editor-wrapper .ql-toolbar button.ql-active {
          background: rgba(0, 168, 140, 0.12) !important;
          color: #00A88C !important;
        }
        .quill-editor-wrapper .ql-toolbar button.ql-active .ql-stroke {
          stroke: #00A88C !important;
        }
        .quill-editor-wrapper .ql-toolbar button.ql-active .ql-fill {
          fill: #00A88C !important;
        }
        .quill-editor-wrapper .ql-container.ql-snow {
          border: none !important;
          font-family: inherit !important;
          font-size: 14px !important;
        }
        .quill-editor-wrapper .ql-editor {
          min-height: 140px !important;
          max-height: 260px !important;
          overflow-y: auto !important;
          padding: 14px 16px !important;
          font-size: 14px !important;
          font-family: inherit !important;
          line-height: 1.6 !important;
          text-align: left !important;
          color: #0F172A !important;
          direction: ltr !important;
        }
        .quill-editor-wrapper .ql-editor p,
        .quill-editor-wrapper .ql-editor h1,
        .quill-editor-wrapper .ql-editor h2,
        .quill-editor-wrapper .ql-editor h3,
        .quill-editor-wrapper .ql-editor li {
          text-align: left !important;
          color: #0F172A !important;
          margin: 0 0 8px 0 !important;
          line-height: 1.6 !important;
        }
        .quill-editor-wrapper .ql-editor p:last-child {
          margin-bottom: 0 !important;
        }
        .quill-editor-wrapper .ql-editor ul,
        .quill-editor-wrapper .ql-editor ol {
          padding-left: 20px !important;
          margin: 0 0 8px 0 !important;
        }
        .quill-editor-wrapper .ql-editor.ql-blank::before {
          font-style: normal !important;
          color: #94A3B8 !important;
          font-size: 14px !important;
          left: 16px !important;
          right: 16px !important;
          text-align: left !important;
        }
        /* Rendered Notice Content */
        .notice-rendered-box {
          text-align: left !important;
          color: #0F172A !important;
          line-height: 1.6 !important;
          font-size: 14px !important;
        }
        .notice-rendered-box p {
          text-align: left !important;
          color: #0F172A !important;
          margin: 0 0 10px 0 !important;
          line-height: 1.6 !important;
        }
        .notice-rendered-box p:last-child {
          margin-bottom: 0 !important;
        }
        .notice-rendered-box ul,
        .notice-rendered-box ol {
          padding-left: 20px !important;
          margin: 0 0 10px 0 !important;
        }
        .notice-rendered-box a {
          color: #00A88C !important;
          text-decoration: underline !important;
        }
      `}</style>

      {/* Header */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0, 168, 140, 0.12)', color: 'var(--admin-primary, #00A88C)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Megaphone size={22} />
            </div>
            <div>
              <h2 className="admin-page-title" style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Notices & Broadcasts</h2>
              <p className="admin-page-subtitle" style={{ margin: 0, color: 'var(--admin-text-muted, #64748B)', fontSize: 13 }}>
                Publish, view, edit announcements and alerts to Doctors and Hospitals
              </p>
            </div>
          </div>
        </div>
        
        <button 
          className="admin-btn admin-btn-primary" 
          onClick={openCreateModal}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontWeight: 600 }}
        >
          <Plus size={16} /> New Notice
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[
          { key: 'all', label: 'All Notices', count: notifications.length },
          { key: 'doctors', label: '🩺 Doctors', count: notifications.filter(n => n.target_type === 'all_doctors' || n.target_type === 'doctor' || n.doctor || (!n.target_type && !n.hospital)).length },
          { key: 'hospitals', label: '🏥 Hospitals', count: notifications.filter(n => n.target_type === 'all_hospitals' || n.target_type === 'hospital' || n.hospital).length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTabFilter(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: activeTabFilter === tab.key ? 'var(--admin-primary, #00A88C)' : 'var(--admin-border, #E2E8F0)',
              background: activeTabFilter === tab.key ? 'var(--admin-primary, #00A88C)' : 'var(--admin-card-bg, #ffffff)',
              color: activeTabFilter === tab.key ? '#ffffff' : 'var(--admin-text, #0F172A)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 12,
              background: activeTabFilter === tab.key ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="admin-card" style={{ background: 'var(--admin-card-bg, #ffffff)', borderRadius: 14, border: '1px solid var(--admin-border, #E2E8F0)', overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 48, textAlign: 'center' }}>
            <div className="admin-spinner" /> Loading notices...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="admin-empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="admin-empty-icon" style={{ fontSize: 44, marginBottom: 12 }}>📢</div>
            <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>No notices found</h4>
            <p style={{ margin: 0, color: 'var(--admin-text-muted, #64748B)', fontSize: 14 }}>
              {activeTabFilter === 'all' 
                ? 'Send broadcasts and alerts to your doctors and hospitals.' 
                : `No ${activeTabFilter} notices sent yet.`}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--admin-bg, #F8FAFC)', textAlign: 'left', borderBottom: '1px solid var(--admin-border, #E2E8F0)' }}>
                  <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted, #64748B)' }}>Type</th>
                  <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted, #64748B)' }}>Title</th>
                  <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted, #64748B)' }}>Target Audience</th>
                  <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted, #64748B)' }}>Popup</th>
                  <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted, #64748B)' }}>Read Status</th>
                  <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted, #64748B)' }}>Sent At</th>
                  <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted, #64748B)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map(n => (
                  <tr key={n.id} style={{ borderBottom: '1px solid var(--admin-border, #E2E8F0)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span>{typeIcons[n.type] || 'ℹ️'}</span>
                        <span style={{ textTransform: 'capitalize', fontSize: 12, fontWeight: 600 }}>{n.type}</span>
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--admin-text, #0F172A)' }}>
                      <span 
                        onClick={() => setViewNotice(n)} 
                        style={{ cursor: 'pointer', textDecoration: 'none' }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        title="Click to view details"
                      >
                        {n.title}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {renderRecipientBadge(n)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {n.is_popup ? (
                        <span style={{ background: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          POPUP
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: 13 }}>Standard</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {isBroadcast(n) ? (
                        <button 
                          className="admin-btn admin-btn-outline admin-btn-sm" 
                          onClick={() => setViewReadersFor(n)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 12 }}
                        >
                          <Eye size={12} /> View Readers
                        </button>
                      ) : (
                        n.is_read ? (
                          <span style={{ color: '#16A34A', fontSize: 13, fontWeight: 600 }}>✅ Read</span>
                        ) : (
                          <span style={{ color: '#DC2626', fontSize: 13, fontWeight: 600 }}>⏳ Unread</span>
                        )
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--admin-text-muted, #64748B)' }}>
                      {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div className="admin-actions" style={{ justifyContent: 'flex-end', gap: 8, display: 'inline-flex' }}>
                        {/* View Action */}
                        <button 
                          className="admin-action-btn admin-action-btn-view" 
                          title="View Notice Details"
                          onClick={() => setViewNotice(n)}
                        >
                          <img src="/icons/view.png" alt="View" />
                        </button>

                        {/* Edit Action */}
                        <button 
                          className="admin-action-btn admin-action-btn-edit" 
                          title="Edit Notice"
                          onClick={() => openEditModal(n)}
                        >
                          <img src="/icons/edit.png" alt="Edit" />
                        </button>

                        {/* Delete Action */}
                        <button 
                          className="admin-action-btn admin-action-btn-delete" 
                          title="Delete Notice"
                          onClick={() => setDeleteTarget(n)}
                        >
                          <img src="/icons/delete.png" alt="Delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Notice Modal */}
      {viewNotice && (
        <div className="admin-modal-overlay" onClick={() => setViewNotice(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16
        }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ 
            maxWidth: 620, width: '100%', background: 'var(--admin-card-bg, #ffffff)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
          }}>
            <div className="admin-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} color="var(--admin-primary, #00A88C)" />
                <h3 className="admin-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Notice Details</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setViewNotice(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748B' }}>✕</button>
            </div>

            <div className="admin-modal-body" style={{ padding: 20, maxHeight: 'calc(85vh - 120px)', overflowY: 'auto' }}>
              {/* Notice Title Header */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                    <span>{typeIcons[viewNotice.type] || 'ℹ️'}</span> {viewNotice.type}
                  </span>
                  {viewNotice.is_popup && (
                    <span style={{ background: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      POPUP ON LOGIN
                    </span>
                  )}
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--admin-text, #0F172A)' }}>
                  {viewNotice.title}
                </h3>
              </div>

              {/* Meta Info Box */}
              <div style={{ 
                background: 'var(--admin-bg, #F8FAFC)', 
                border: '1px solid var(--admin-border, #E2E8F0)', 
                borderRadius: 12, 
                padding: '12px 16px', 
                marginBottom: 16,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                fontSize: 13
              }}>
                <div>
                  <span style={{ color: 'var(--admin-text-muted, #64748B)', display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Target Audience</span>
                  <div>{renderRecipientBadge(viewNotice)}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--admin-text-muted, #64748B)', display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Sent Date</span>
                  <span style={{ fontWeight: 600 }}>{viewNotice.created_at ? new Date(viewNotice.created_at).toLocaleString() : 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--admin-text-muted, #64748B)', display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Sent By</span>
                  <span style={{ fontWeight: 600 }}>{viewNotice.sender?.name || 'Administrator'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--admin-text-muted, #64748B)', display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Status</span>
                  <span>
                    {isBroadcast(viewNotice) ? (
                      <span style={{ color: '#00A88C', fontWeight: 600 }}>
                        📢 Broadcast ({viewNotice.reads?.length || 0} reads)
                      </span>
                    ) : (
                      viewNotice.is_read ? (
                        <span style={{ color: '#16A34A', fontWeight: 600 }}>✅ Read</span>
                      ) : (
                        <span style={{ color: '#DC2626', fontWeight: 600 }}>⏳ Unread</span>
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Message Content Render */}
              <div style={{ marginBottom: 12 }}>
                <label className="admin-form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>
                  Notice Content
                </label>
                <div 
                  className="notice-rendered-box"
                  style={{ 
                    border: '1px solid var(--admin-border, #E2E8F0)', 
                    borderRadius: 12, 
                    padding: '16px 20px', 
                    background: 'var(--admin-card-bg, #ffffff)', 
                    minHeight: 120,
                    lineHeight: 1.6,
                    fontSize: 14,
                    color: 'var(--admin-text, #0F172A)'
                  }}
                  dangerouslySetInnerHTML={{ __html: viewNotice.message }}
                />
              </div>
            </div>

            <div className="admin-modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--admin-border, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {isBroadcast(viewNotice) && (
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    onClick={() => {
                      setViewReadersFor(viewNotice)
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <Users size={13} /> View Readers List
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setViewNotice(null)}>
                  Close
                </button>
                <button 
                  type="button" 
                  className="admin-btn admin-btn-primary" 
                  onClick={() => openEditModal(viewNotice)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Edit3 size={15} /> Edit Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Notice Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => { setShowModal(false); setEditNotice(null) }} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16
        }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ 
            maxWidth: 620, width: '100%', background: 'var(--admin-card-bg, #ffffff)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
          }}>
            <div className="admin-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {editNotice ? (
                  <Edit3 size={18} color="var(--admin-primary, #00A88C)" />
                ) : (
                  <Megaphone size={18} color="var(--admin-primary, #00A88C)" />
                )}
                <h3 className="admin-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  {editNotice ? 'Edit Notice' : 'Send Notice / Announcement'}
                </h3>
              </div>
              <button className="admin-modal-close" onClick={() => { setShowModal(false); setEditNotice(null) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748B' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body" style={{ padding: 20, maxHeight: 'calc(85vh - 120px)', overflowY: 'auto' }}>
                {/* Audience Switcher */}
                <div style={{ marginBottom: 16 }}>
                  <label className="admin-form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Target Audience Category
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetCategory('doctor')
                        setForm(f => ({ ...f, target_id: '' }))
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '2px solid',
                        borderColor: targetCategory === 'doctor' ? 'var(--admin-primary, #00A88C)' : 'var(--admin-border, #E2E8F0)',
                        background: targetCategory === 'doctor' ? 'rgba(0, 168, 140, 0.08)' : 'transparent',
                        color: targetCategory === 'doctor' ? 'var(--admin-primary, #00A88C)' : 'var(--admin-text, #0F172A)',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: '0.2s',
                      }}
                    >
                      <Stethoscope size={16} /> Doctors
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetCategory('hospital')
                        setForm(f => ({ ...f, target_id: '' }))
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '2px solid',
                        borderColor: targetCategory === 'hospital' ? 'var(--admin-primary, #00A88C)' : 'var(--admin-border, #E2E8F0)',
                        background: targetCategory === 'hospital' ? 'rgba(0, 168, 140, 0.08)' : 'transparent',
                        color: targetCategory === 'hospital' ? 'var(--admin-primary, #00A88C)' : 'var(--admin-text, #0F172A)',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: '0.2s',
                      }}
                    >
                      <Building2 size={16} /> Hospitals
                    </button>
                  </div>
                </div>

                {/* Recipient Dropdown (Specific or Broadcast) */}
                {targetCategory === 'doctor' ? (
                  <SearchableSelect 
                    label="Doctor Recipient"
                    options={doctors}
                    value={form.target_id}
                    onChange={val => setForm(f => ({ ...f, target_id: val }))}
                    placeholder="Search and select a doctor..."
                    broadcastLabel="📢 Broadcast to All Doctors"
                    searchPlaceholder="Search doctor by name..."
                  />
                ) : (
                  <SearchableSelect 
                    label="Hospital Recipient"
                    options={hospitals}
                    value={form.target_id}
                    onChange={val => setForm(f => ({ ...f, target_id: val }))}
                    placeholder="Search and select a hospital..."
                    broadcastLabel="📢 Broadcast to All Hospitals"
                    searchPlaceholder="Search hospital by name..."
                  />
                )}

                {/* Type and Popup row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Notice Type</label>
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
                      <input 
                        type="checkbox" 
                        checked={form.is_popup} 
                        onChange={e => setForm(f => ({ ...f, is_popup: e.target.checked }))} 
                        style={{ width: 16, height: 16, accentColor: 'var(--admin-primary, #00A88C)' }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Show as Popup on Login</span>
                    </label>
                  </div>
                </div>

                {/* Title */}
                <div className="admin-form-group" style={{ marginTop: 14 }}>
                  <label className="admin-form-label" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    Title <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input 
                    className="admin-form-input" 
                    value={form.title} 
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                    required 
                    placeholder="e.g. Important Platform Update" 
                    style={{ height: 44, borderRadius: 10, fontSize: 14, color: 'var(--admin-text, #0F172A)' }}
                  />
                </div>

                {/* Rich text message */}
                <div className="admin-form-group" style={{ marginTop: 14 }}>
                  <label className="admin-form-label" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    Message Content <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div className="quill-editor-wrapper">
                    <ReactQuill 
                      theme="snow"
                      value={form.message} 
                      onChange={val => setForm(f => ({ ...f, message: val }))}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Write your announcement or notice details..."
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--admin-border, #E2E8F0)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => { setShowModal(false); setEditNotice(null) }}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {editNotice ? (
                    <>
                      <Edit3 size={15} /> Save Changes
                    </>
                  ) : (
                    <>
                      <Megaphone size={15} /> Send Notice
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read Receipts Modal */}
      {viewReadersFor && (
        <div className="admin-modal-overlay" onClick={() => setViewReadersFor(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16
        }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, width: '100%', background: 'var(--admin-card-bg, #ffffff)', borderRadius: 16, overflow: 'hidden' }}>
            <div className="admin-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                📖 Read Receipts: {viewReadersFor.title}
              </h3>
              <button className="admin-modal-close" onClick={() => setViewReadersFor(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            
            <div className="admin-modal-body" style={{ padding: 20 }}>
              {viewReadersFor.target_type === 'all_hospitals' ? (
                // Hospital broadcast reads
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ border: '1px solid #E5EAF0', borderRadius: 10, padding: 14 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#00A88C', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} /> Read By ({viewReadersFor.reads?.filter(r => r.hospital_id).length || 0})
                    </h4>
                    <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, maxHeight: 280, overflowY: 'auto' }}>
                      {viewReadersFor.reads?.filter(r => r.hospital_id).map(r => (
                        <li key={r.id} style={{ marginBottom: 4 }}>{r.hospital?.name || `Hospital #${r.hospital_id}`}</li>
                      ))}
                      {(!viewReadersFor.reads || viewReadersFor.reads.filter(r => r.hospital_id).length === 0) && (
                        <li style={{ color: '#94A3B8', listStyle: 'none', marginLeft: -18 }}>No hospital has read this yet.</li>
                      )}
                    </ul>
                  </div>

                  <div style={{ border: '1px solid #E5EAF0', borderRadius: 10, padding: 14 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#EF4444' }}>
                      ⏳ Unread By ({Math.max(0, hospitals.length - (viewReadersFor.reads?.filter(r => r.hospital_id).length || 0))})
                    </h4>
                    <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, maxHeight: 280, overflowY: 'auto' }}>
                      {hospitals.filter(h => !viewReadersFor.reads?.find(r => r.hospital_id === h.id)).map(h => (
                        <li key={h.id} style={{ marginBottom: 4 }}>{h.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                // Doctor broadcast reads
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ border: '1px solid #E5EAF0', borderRadius: 10, padding: 14 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#00A88C', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} /> Read By ({viewReadersFor.reads?.filter(r => r.doctor_id).length || 0})
                    </h4>
                    <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, maxHeight: 280, overflowY: 'auto' }}>
                      {viewReadersFor.reads?.filter(r => r.doctor_id).map(r => (
                        <li key={r.id} style={{ marginBottom: 4 }}>{r.doctor?.name || `Doctor #${r.doctor_id}`}</li>
                      ))}
                      {(!viewReadersFor.reads || viewReadersFor.reads.filter(r => r.doctor_id).length === 0) && (
                        <li style={{ color: '#94A3B8', listStyle: 'none', marginLeft: -18 }}>No doctor has read this yet.</li>
                      )}
                    </ul>
                  </div>

                  <div style={{ border: '1px solid #E5EAF0', borderRadius: 10, padding: 14 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#EF4444' }}>
                      ⏳ Unread By ({Math.max(0, doctors.length - (viewReadersFor.reads?.filter(r => r.doctor_id).length || 0))})
                    </h4>
                    <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, maxHeight: 280, overflowY: 'auto' }}>
                      {doctors.filter(d => !viewReadersFor.reads?.find(r => r.doctor_id === d.id)).map(d => (
                        <li key={d.id} style={{ marginBottom: 4 }}>{d.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={Boolean(deleteTarget)}
        title="Delete Notice"
        message={`Are you sure you want to delete notice "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

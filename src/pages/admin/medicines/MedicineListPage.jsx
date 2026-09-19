// MedicineListPage.jsx — Admin medicine list with search, filter, pagination & bulk delete
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getMedicines, deleteMedicine, bulkDeleteMedicines } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import TableFooter from '../../../components/admin/TableFooter'
import { useAuth } from '../../../context/AuthContext'
import { getErrorMessage } from '../../../utils/errorHelper'

const DOSAGE_TYPES = ['ALL', 'TAB', 'SYP', 'DROP', 'CAP', 'INJ', 'SUSP', 'SUPP']

const dosageColors = {
  TAB: { bg: '#DBEAFE', color: '#2563EB' },
  TABLET: { bg: '#DBEAFE', color: '#2563EB' },
  'TABLET (TAB)': { bg: '#DBEAFE', color: '#2563EB' },
  SYP: { bg: '#FEF3C7', color: '#D97706' },
  SYRUP: { bg: '#FEF3C7', color: '#D97706' },
  'SYRUP (SYP)': { bg: '#FEF3C7', color: '#D97706' },
  DROP: { bg: '#D1FAE5', color: '#059669' },
  DROPS: { bg: '#D1FAE5', color: '#059669' },
  'DROP (DROP)': { bg: '#D1FAE5', color: '#047857' },
  CAP: { bg: '#EDE9FE', color: '#7C3AED' },
  CAPSULE: { bg: '#EDE9FE', color: '#7C3AED' },
  'CAPSULE (CAP)': { bg: '#EDE9FE', color: '#7C3AED' },
  INJ: { bg: '#FEE2E2', color: '#DC2626' },
  INJECTION: { bg: '#FEE2E2', color: '#DC2626' },
  'INJECTION (INJ)': { bg: '#FEE2E2', color: '#DC2626' },
  SUSP: { bg: '#E0F2FE', color: '#0284C7' },
  SUSPENSION: { bg: '#E0F2FE', color: '#0284C7' },
  'SUSPENSION (SUSP)': { bg: '#E0F2FE', color: '#0284C7' },
  SUPP: { bg: '#FCE7F3', color: '#DB2777' },
  SUPPOSITORY: { bg: '#FCE7F3', color: '#DB2777' },
  'SUPPOSITORY (SUPP)': { bg: '#FCE7F3', color: '#DB2777' },
  OINT: { bg: '#F3E8FF', color: '#7E22CE' },
  OINTMENT: { bg: '#F3E8FF', color: '#7E22CE' },
  'OINTMENT (OINT)': { bg: '#F3E8FF', color: '#7E22CE' },
  CREAM: { bg: '#ECFCCB', color: '#4D7C0F' },
  'CREAM (CREAM)': { bg: '#ECFCCB', color: '#4D7C0F' },
  GEL: { bg: '#E0E7FF', color: '#4338CA' },
  'GEL (GEL)': { bg: '#E0E7FF', color: '#4338CA' },
  SPRAY: { bg: '#CCFBF1', color: '#0F766E' },
  'SPRAY (SPRAY)': { bg: '#CCFBF1', color: '#0F766E' },
  INHALER: { bg: '#FEE2E2', color: '#991B1B' },
  'INHALER (INHALER)': { bg: '#FEE2E2', color: '#991B1B' },
}

function TableCheckbox({ checked, indeterminate, onChange, title }) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        margin: 0,
        position: 'relative',
        userSelect: 'none',
        verticalAlign: 'middle',
      }}
      title={title}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          margin: 0,
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: checked || indeterminate ? '1.5px solid #10B981' : '1.5px solid #D1D5DB',
          background: checked || indeterminate ? '#10B981' : '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease-in-out',
          boxShadow: checked || indeterminate ? '0 1px 3px rgba(16, 185, 129, 0.3)' : '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {!checked && indeterminate && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </span>
    </label>
  )
}

function MedicineDetailModal({ medicine, onClose, onEdit, canEdit, dosageColors, getFullName }) {
  if (!medicine) return null

  const typeColor = dosageColors[medicine.dosage_type] || { bg: '#F1F5F9', color: '#475569' }

  return (
    <div
      className="db-dialog-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--admin-card-bg, #ffffff)',
          borderRadius: 16,
          border: '1px solid var(--admin-border, #e2e8f0)',
          maxWidth: 520,
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'fadeInSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--admin-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--admin-bg, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              💊
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--admin-text, #0f172a)',
                }}
              >
                Medicine Details
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'var(--admin-text-muted, #64748b)',
                  marginTop: 2,
                }}
              >
                Medicine #{medicine.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 18,
              color: 'var(--admin-text-muted, #64748b)',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 6,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Medicine Title Card (Live Preview Style) */}
          <div
            style={{
              background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 100%)',
              border: '1.5px solid #BBF7D0',
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  color: '#FFFFFF',
                  boxShadow: '0 3px 8px rgba(16, 185, 129, 0.25)',
                }}
              >
                💊
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: 'var(--admin-text, #0F172A)',
                      lineHeight: 1.2,
                    }}
                  >
                    {getFullName(medicine)}
                  </span>
                  {medicine.strength && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#475569',
                        background: '#F1F5F9',
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {medicine.strength}
                    </span>
                  )}
                  {medicine.dosage_type && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: typeColor.bg,
                        color: typeColor.color,
                        border: `1px solid ${typeColor.border || 'transparent'}`,
                        padding: '2px 8px',
                        borderRadius: 6,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {medicine.dosage_type.replace(/\s*\(.*?\)/, '').trim()}
                    </span>
                  )}
                </div>
                {(medicine.generic_name || medicine.company_name) && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--admin-text-muted, #64748B)',
                      marginTop: 5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    {medicine.generic_name && (
                      <span>
                        Generic: <strong style={{ color: 'var(--admin-text, #334155)' }}>{medicine.generic_name}</strong>
                      </span>
                    )}
                    {medicine.generic_name && medicine.company_name && <span>•</span>}
                    {medicine.company_name && (
                      <span>
                        Company: <strong style={{ color: 'var(--admin-text, #334155)' }}>{medicine.company_name}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-card-bg, #ffffff)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--admin-text-muted, #64748b)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 4,
                }}
              >
                Strength
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--admin-text, #0f172a)',
                }}
              >
                {medicine.strength || '—'}
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-card-bg, #ffffff)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--admin-text-muted, #64748b)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 4,
                }}
              >
                Company / Manufacturer
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--admin-text, #0f172a)',
                }}
              >
                {medicine.company_name || '—'}
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-card-bg, #ffffff)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--admin-text-muted, #64748b)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 4,
                }}
              >
                Dosage Type
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--admin-text, #0f172a)',
                }}
              >
                {medicine.dosage_type || '—'}
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-card-bg, #ffffff)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--admin-text-muted, #64748b)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 4,
                }}
              >
                Database ID
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--admin-text, #0f172a)',
                }}
              >
                #{medicine.id}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--admin-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            background: 'var(--admin-bg, #f8fafc)',
          }}
        >
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={onClose}
          >
            Close
          </button>
          {canEdit && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => {
                onClose()
                onEdit(medicine.id)
              }}
            >
              Edit Medicine
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MedicineListPage() {
  const navigate = useNavigate()
  const { isAdmin, hasPermission } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dosageFilter, setDosageFilter] = useState('ALL')
  const [companyFilter, setCompanyFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [perPage, setPerPage] = useState(25)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const searchTimeout = useRef(null)

  const fetchData = async (page = 1, q = search, dosage = dosageFilter, company = companyFilter, limit = perPage) => {
    setLoading(true)
    try {
      const params = { page, per_page: limit }
      if (q) params.search = q
      if (dosage && dosage !== 'ALL') params.dosage_type = dosage
      if (company) params.company = company
      const res = await getMedicines(params)
      const data = res.data?.data || res.data
      setItems(Array.isArray(data) ? data : (data?.data || []))
      if (data?.current_page) {
        setPagination({
          current_page: data.current_page,
          last_page: data.last_page || 1,
          total: data.total || 0
        })
      } else if (res.data?.current_page) {
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page || 1,
          total: res.data.total || 0
        })
      } else {
        setPagination({
          current_page: page,
          last_page: 1,
          total: Array.isArray(data) ? data.length : 0
        })
      }
    } catch (err) {
      console.error('Error loading medicines:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1)
  }, [])

  const handleSearch = (val) => {
    setSearch(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      fetchData(1, val, dosageFilter, companyFilter, perPage)
    }, 400)
  }

  const handleDosageFilter = (val) => {
    setDosageFilter(val)
    fetchData(1, search, val, companyFilter, perPage)
  }

  const handleCompanyFilter = (val) => {
    setCompanyFilter(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      fetchData(1, search, dosageFilter, val, perPage)
    }, 400)
  }

  // Selection handlers
  const isAllSelected = items.length > 0 && items.every(m => selectedIds.includes(m.id))
  const isSomeSelected = items.length > 0 && items.some(m => selectedIds.includes(m.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageItemIds = new Set(items.map(m => m.id))
      setSelectedIds(prev => prev.filter(id => !pageItemIds.has(id)))
    } else {
      const pageItemIds = items.map(m => m.id)
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageItemIds])))
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMedicine(deleteTarget.id)
      toast.success('Medicine deleted successfully')
      setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id))
      setDeleteTarget(null)
      fetchData(pagination.current_page, search, dosageFilter, companyFilter, perPage)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete medicine'))
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setBulkDeleting(true)
    try {
      const res = await bulkDeleteMedicines(selectedIds)
      toast.success(res.data?.message || `Successfully deleted ${selectedIds.length} medicine(s)`)
      setSelectedIds([])
      setShowBulkDeleteModal(false)
      fetchData(pagination.current_page, search, dosageFilter, companyFilter, perPage)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete selected medicines'))
      console.error(err)
    } finally {
      setBulkDeleting(false)
    }
  }

  const getFullName = (med) => {
    if (!med) return '—'
    let name = med.medicine_name || ''
    const cleanType = (med.dosage_type || '').replace(/\s*\(.*?\)/, '').trim()
    const prefix = cleanType ? `${cleanType}|` : ''
    const regex = new RegExp(`^(${prefix}tab|cap|syp|inj|drop|susp|supp|tablet|capsule|syrup|injection)\\s+`, 'i')
    name = name.replace(regex, '')
    return name || med.medicine_name || '—'
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">💊 Medicines</h2>
          <p className="admin-page-subtitle">{pagination.total} medicine(s) in database</p>
        </div>
        {(isAdmin || hasPermission('medicine.create')) && (
          <Link to="/admin/medicines/create" className="admin-btn admin-btn-primary">+ Add Medicine</Link>
        )}
      </div>

      <ListToolbar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Search medicine or generic name..."
        onRefresh={() => fetchData(1, search, dosageFilter, companyFilter, perPage)}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(dosageFilter !== 'ALL' || companyFilter)}
        onClearFilters={() => { setDosageFilter('ALL'); setCompanyFilter(''); fetchData(1, search, 'ALL', '', perPage) }}
        activeFilters={[
          dosageFilter !== 'ALL' && { key: 'dosage', label: `Type: ${dosageFilter}`, onRemove: () => { setDosageFilter('ALL'); fetchData(1, search, 'ALL', companyFilter, perPage) } },
          companyFilter && { key: 'company', label: `Company: ${companyFilter}`, onRemove: () => { setCompanyFilter(''); fetchData(1, search, dosageFilter, '', perPage) } },
        ].filter(Boolean)}
        actions={
          (isAdmin || hasPermission('medicine.create')) && (
            <Link to="/admin/medicines/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
              + Add Medicine
            </Link>
          )
        }
      >
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Dosage Type</label>
          <select className="status-select" value={dosageFilter} onChange={e => handleDosageFilter(e.target.value)} style={{ width: '100%', height: 38, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8 }}>
            {DOSAGE_TYPES.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Company</label>
          <input type="text" placeholder="Filter company..." value={companyFilter} onChange={e => handleCompanyFilter(e.target.value)} className="admin-form-input" style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }} />
        </div>
      </ListToolbar>

      <div className="admin-card">
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '14px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 className="admin-card-title" style={{ margin: 0 }}>Medicine Database</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {selectedIds.length > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
                  border: '1px solid #FECDD3',
                  borderRadius: 20,
                  padding: '4px 6px 4px 14px',
                  boxShadow: '0 2px 6px rgba(225, 29, 72, 0.08)',
                  animation: 'fadeInSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#E11D48',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#9F1239', letterSpacing: '-0.01em' }}>
                    {selectedIds.length} <span style={{ fontWeight: 600, color: '#BE123C' }}>selected</span>
                  </span>
                </div>

                <div style={{ width: 1, height: 16, background: '#FDA4AF', opacity: 0.6 }} />

                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9F1239',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 12,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(225, 29, 72, 0.1)'
                    e.currentTarget.style.color = '#881337'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#9F1239'
                  }}
                >
                  Deselect
                </button>

                {(isAdmin || hasPermission('medicine.delete')) && (
                  <button
                    type="button"
                    onClick={() => setShowBulkDeleteModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 14px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(225, 29, 72, 0.25)',
                      transition: 'transform 0.1s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(225, 29, 72, 0.35)'
                      e.currentTarget.style.transform = 'translateY(-0.5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(225, 29, 72, 0.25)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    <span>Delete ({selectedIds.length})</span>
                  </button>
                )}
              </div>
            )}
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--admin-text-muted, #64748B)',
                background: 'var(--admin-bg, #F8FAFC)',
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid var(--admin-border, #E2E8F0)',
              }}
            >
              <strong style={{ color: 'var(--admin-text, #0F172A)' }}>{pagination.total}</strong> records
            </div>
          </div>
        </div>
        {loading ? (
          <TableSkeleton
            rowCount={8}
            columnWidths={['44px', '60px', '25%', '22%', '10%', '15%', '16%', '8%']}
            headers={['', 'SL', 'Medicine Name', 'Generic Name', 'Type', 'Strength', 'Company', 'Actions']}
          />
        ) : items.length === 0 ? (
          <EmptyState hasFilters={Boolean(dosageFilter !== 'ALL' || companyFilter || search)} searchQuery={search} onClearFilters={() => { setDosageFilter('ALL'); setCompanyFilter(''); fetchData(1, '', 'ALL', '', perPage) }} onClearSearch={() => handleSearch('')} icon="💊" title="No medicines found" description="Try searching with a generic name or clear dosage filters." primaryAction={(isAdmin || hasPermission('medicine.create')) ? { label: '+ Add Medicine', to: '/admin/medicines/create' } : undefined} />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }}>
                    <TableCheckbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected && !isAllSelected}
                      onChange={toggleSelectAll}
                      title={isAllSelected ? 'Deselect all' : 'Select all on this page'}
                    />
                  </th>
                  <th style={{ width: 60, textAlign: 'center' }}>SL</th>
                  <th>Medicine Name</th>
                  <th>Generic Name</th>
                  <th>Type</th>
                  <th>Strength</th>
                  <th>Company</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((med, index) => {
                  const isSelected = selectedIds.includes(med.id)
                  const typeColor = dosageColors[med.dosage_type] || { bg: '#F1F5F9', color: '#475569' }
                  const serialNumber = (pagination.current_page - 1) * perPage + index + 1
                  return (
                    <tr
                      key={med.id}
                      style={{
                        background: isSelected ? 'rgba(16, 185, 129, 0.06)' : undefined,
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ width: 44, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <TableCheckbox
                          checked={isSelected}
                          onChange={() => toggleSelect(med.id)}
                        />
                      </td>
                      <td style={{ width: 60, textAlign: 'center', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: 13 }}>
                        {serialNumber}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{getFullName(med)}</span>
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{med.generic_name || '—'}</td>
                      <td>
                        <span style={{
                          background: typeColor.bg,
                          color: typeColor.color,
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: 0.5
                        }}>
                          {med.dosage_type || '—'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{med.strength || '—'}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{med.company_name || '—'}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn admin-action-btn-view"
                            title="View Medicine Details"
                            onClick={() => setViewTarget(med)}
                          >
                            <img src="/icons/view.png" alt="View" />
                          </button>
                          {(isAdmin || hasPermission('medicine.update')) && (
                            <button
                              className="admin-action-btn admin-action-btn-edit"
                              title="Edit Medicine"
                              onClick={() => navigate(`/admin/medicines/edit/${med.id}`)}
                            >
                              <img src="/icons/edit.png" alt="Edit" />
                            </button>
                          )}
                          {(isAdmin || hasPermission('medicine.delete')) && (
                            <button
                              className="admin-action-btn admin-action-btn-delete"
                              title="Delete Medicine"
                              onClick={() => setDeleteTarget(med)}
                            >
                              <img src="/icons/delete.png" alt="Delete" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TableFooter
        total={pagination.total || 0}
        currentPage={pagination.current_page || 1}
        setCurrentPage={(p) => fetchData(p, search, dosageFilter, companyFilter, perPage)}
        perPage={perPage}
        setPerPage={(n) => { setPerPage(n); fetchData(1, search, dosageFilter, companyFilter, n) }}
        perPageOptions={[10, 25, 50, 100, 500]}
      />

      <MedicineDetailModal
        medicine={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(id) => navigate(`/admin/medicines/edit/${id}`)}
        canEdit={isAdmin || hasPermission('medicine.update')}
        dosageColors={dosageColors}
        getFullName={getFullName}
      />

      <DeleteModal
        show={!!deleteTarget}
        title="Delete Medicine"
        message={`Are you sure you want to delete "${deleteTarget?.medicine_name || ''}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <DeleteModal
        show={showBulkDeleteModal}
        title="Bulk Delete Medicines"
        message={`Are you sure you want to delete ${selectedIds.length} selected medicine(s)? This action cannot be undone.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
        loading={bulkDeleting}
      />
    </div>
  )
}

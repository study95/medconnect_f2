// MedicineListPage.jsx — Admin medicine list with search, filter, pagination
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMedicines, deleteMedicine } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import { useAuth } from '../../../context/AuthContext'
import { toast } from 'react-toastify'
import { getErrorMessage } from '../../../utils/errorHelper'

const DOSAGE_TYPES = ['ALL', 'TAB', 'SYP', 'DROP', 'CAP', 'INJ', 'SUSP', 'SUPP']

const dosageColors = {
  TAB: { bg: '#DBEAFE', color: '#2563EB' },
  SYP: { bg: '#FEF3C7', color: '#D97706' },
  DROP: { bg: '#D1FAE5', color: '#059669' },
  CAP: { bg: '#EDE9FE', color: '#7C3AED' },
  INJ: { bg: '#FEE2E2', color: '#DC2626' },
  SUSP: { bg: '#E0F2FE', color: '#0284C7' },
  SUPP: { bg: '#FCE7F3', color: '#DB2777' },
}

export default function MedicineListPage() {
  const navigate = useNavigate()
  const { isAdmin, hasPermission } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dosageFilter, setDosageFilter] = useState('ALL')
  const [companyFilter, setCompanyFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const searchTimeout = useRef(null)

  useEffect(() => { fetchData(1) }, [])

  const fetchData = async (page = 1, searchTerm = search, dosage = dosageFilter, company = companyFilter) => {
    try {
      setLoading(true)
      const params = { page, per_page: 15 }
      if (searchTerm.trim()) params.search = searchTerm.trim()
      if (dosage && dosage !== 'ALL') params.dosage_type = dosage
      if (company.trim()) params.company_name = company.trim()

      const res = await getMedicines(params)
      const data = res.data

      // Handle both paginated and non-paginated response
      if (data?.data && Array.isArray(data.data)) {
        setItems(data.data)
        setPagination({
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          total: data.total || data.data.length
        })
      } else if (Array.isArray(data)) {
        setItems(data)
        setPagination({ current_page: 1, last_page: 1, total: data.length })
      } else if (data?.data?.data && Array.isArray(data.data.data)) {
        setItems(data.data.data)
        setPagination({
          current_page: data.data.current_page || 1,
          last_page: data.data.last_page || 1,
          total: data.data.total || data.data.data.length
        })
      } else {
        setItems([])
        setPagination({ current_page: 1, last_page: 1, total: 0 })
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load medicines'))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (val) => {
    setSearch(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      fetchData(1, val, dosageFilter, companyFilter)
    }, 300)
  }

  const handleDosageFilter = (val) => {
    setDosageFilter(val)
    fetchData(1, search, val, companyFilter)
  }

  const handleCompanyFilter = (val) => {
    setCompanyFilter(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      fetchData(1, search, dosageFilter, val)
    }, 300)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMedicine(deleteTarget.id)
      setItems(items.filter(i => i.id !== deleteTarget.id))
      toast.success('Medicine deleted')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const goToPage = (page) => {
    if (page < 1 || page > pagination.last_page) return
    fetchData(page, search, dosageFilter, companyFilter)
  }

  const getFullName = (med) => {
    const parts = [med.dosage_type, med.medicine_name, med.strength].filter(Boolean)
    return parts.join(' ')
  }

  const renderPagination = () => {
    if (pagination.last_page <= 1) return null
    const pages = []
    for (let i = 1; i <= pagination.last_page; i++) {
      if (i === 1 || i === pagination.last_page || (i >= pagination.current_page - 2 && i <= pagination.current_page + 2)) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return (
      <div className="admin-pagination">
        <span className="admin-pagination-info">
          Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
        </span>
        <div className="admin-pagination-btns">
          <button onClick={() => goToPage(pagination.current_page - 1)} disabled={pagination.current_page === 1}>←</button>
          {pages.map((p, idx) =>
            p === '...' ? (
              <button key={`dots-${idx}`} disabled>...</button>
            ) : (
              <button key={p} className={p === pagination.current_page ? 'active' : ''} onClick={() => goToPage(p)}>{p}</button>
            )
          )}
          <button onClick={() => goToPage(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page}>→</button>
        </div>
      </div>
    )
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

      <div className="admin-card">
        <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h3 className="admin-card-title">Medicine Database</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div className="admin-table-search">
              <input
                type="text"
                placeholder="Search medicine or generic name..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                style={{ minWidth: 220 }}
              />
            </div>
            {/* Dosage Type Filter */}
            <select
              className="admin-form-select"
              value={dosageFilter}
              onChange={e => handleDosageFilter(e.target.value)}
              style={{ width: 'auto', minWidth: 100, padding: '8px 12px', fontSize: 13 }}
            >
              {DOSAGE_TYPES.map(t => (
                <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>
              ))}
            </select>
            {/* Company Filter */}
            <input
              type="text"
              placeholder="Company..."
              value={companyFilter}
              onChange={e => handleCompanyFilter(e.target.value)}
              className="admin-form-input"
              style={{ width: 'auto', minWidth: 140, padding: '8px 12px', fontSize: 13 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
        ) : items.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">💊</div>
            <h4>No medicines found</h4>
            <p>{search ? 'Try a different search term' : 'Add your first medicine'}</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Generic Name</th>
                    <th>Type</th>
                    <th>Strength</th>
                    <th>Company</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(med => {
                    const typeColor = dosageColors[med.dosage_type] || { bg: '#F1F5F9', color: '#475569' }
                    return (
                      <tr key={med.id}>
                        <td style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>#{med.id}</td>
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
                            {(isAdmin || hasPermission('medicine.update')) && (
                              <button
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                onClick={() => navigate(`/admin/medicines/edit/${med.id}`)}
                              >✏️ Edit</button>
                            )}
                            {(isAdmin || hasPermission('medicine.delete')) && (
                              <button
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => setDeleteTarget(med)}
                              >🗑️</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        )}
      </div>

      <DeleteModal
        show={!!deleteTarget}
        title="Delete Medicine"
        message={`Are you sure you want to delete "${deleteTarget?.medicine_name || ''}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

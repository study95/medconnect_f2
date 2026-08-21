// MedicineListPage.jsx — Admin medicine list with search, filter, pagination
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMedicines, deleteMedicine } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { useAuth } from '../../../context/AuthContext'
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
  const [showFilters, setShowFilters] = useState(false)
  const [perPage, setPerPage] = useState(25)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
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

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMedicine(deleteTarget.id)
      setDeleteTarget(null)
      fetchData(pagination.current_page, search, dosageFilter, companyFilter, perPage)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const getFullName = (med) => {
    if (med.full_name) return med.full_name
    return [med.dosage_type, med.medicine_name, med.strength].filter(Boolean).join(' ') || med.medicine_name || '—'
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
        <div className="admin-card-header">
          <h3 className="admin-card-title">Medicine Database</h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>{pagination.total} records</span>
        </div>
        {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['80px', '25%', '22%', '12%', '15%', '18%', '8%']} headers={['ID', 'Full Name', 'Generic Name', 'Type', 'Strength', 'Company', 'Actions']} />
        ) : items.length === 0 ? (
          <EmptyState hasFilters={Boolean(dosageFilter !== 'ALL' || companyFilter || search)} searchQuery={search} onClearFilters={() => { setDosageFilter('ALL'); setCompanyFilter(''); fetchData(1, '', 'ALL', '', perPage) }} onClearSearch={() => handleSearch('')} icon="💊" title="No medicines found" description="Try searching with a generic name or clear dosage filters." primaryAction={(isAdmin || hasPermission('medicine.create')) ? { label: '+ Add Medicine', to: '/admin/medicines/create' } : undefined} />
        ) : (
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
                      <td><CompactUlid value={med.id} /></td>
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

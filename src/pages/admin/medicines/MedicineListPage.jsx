// MedicineListPage.jsx — Admin medicine list with search, filter, pagination
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMedicines, deleteMedicine } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
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

      {/* Show Entries Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
          Show
          <select
            value={perPage}
            onChange={e => { const n = Number(e.target.value); setPerPage(n); fetchData(1, search, dosageFilter, companyFilter, n) }}
            style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none', minWidth: 70 }}
          >
            {[10, 25, 50, 100, 500].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          entries
        </div>
        <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
          Showing <strong>{pagination.total === 0 ? 0 : ((pagination.current_page - 1) * perPage + 1)}</strong>–<strong>{Math.min(pagination.current_page * perPage, pagination.total)}</strong> of <strong>{pagination.total}</strong> entries
        </div>
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
            {/* Bottom Pagination */}
            {(() => {
              const totalPages = pagination.last_page
              if (pagination.total === 0) return null
              const pages = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (pagination.current_page > 3) pages.push('...')
                const start = Math.max(2, pagination.current_page - 1)
                const end = Math.min(totalPages - 1, pagination.current_page + 1)
                for (let i = start; i <= end; i++) pages.push(i)
                if (pagination.current_page < totalPages - 2) pages.push('...')
                pages.push(totalPages)
              }
              const btnBase = {
                height: 34, minWidth: 34, padding: '0 10px', borderRadius: 8,
                border: '1.5px solid var(--admin-border)', background: 'var(--admin-card-bg)',
                color: 'var(--admin-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
              }
              const btnActive = { ...btnBase, border: 'none', background: 'linear-gradient(135deg, #00B875, #009E64)', color: '#fff', boxShadow: '0 2px 8px rgba(0,184,117,0.35)' }
              const btnDisabled = { ...btnBase, opacity: 0.4, cursor: 'not-allowed' }
              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 500 }}>
                    Showing <strong>{pagination.total === 0 ? 0 : ((pagination.current_page - 1) * perPage + 1)}</strong>–<strong>{Math.min(pagination.current_page * perPage, pagination.total)}</strong> of <strong>{pagination.total}</strong> entries
                  </div>
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button onClick={() => pagination.current_page > 1 && fetchData(1, search, dosageFilter, companyFilter, perPage)} style={pagination.current_page === 1 ? btnDisabled : btnBase} title="First">«</button>
                      <button onClick={() => pagination.current_page > 1 && fetchData(pagination.current_page - 1, search, dosageFilter, companyFilter, perPage)} style={pagination.current_page === 1 ? btnDisabled : btnBase} title="Previous">‹</button>
                      {pages.map((p, i) => p === '...'
                        ? <span key={`d${i}`} style={{ width: 30, textAlign: 'center', color: 'var(--admin-text-muted)', fontWeight: 700 }}>…</span>
                        : <button key={p} onClick={() => fetchData(p, search, dosageFilter, companyFilter, perPage)} style={p === pagination.current_page ? btnActive : btnBase}>{p}</button>
                      )}
                      <button onClick={() => pagination.current_page < totalPages && fetchData(pagination.current_page + 1, search, dosageFilter, companyFilter, perPage)} style={pagination.current_page === totalPages ? btnDisabled : btnBase} title="Next">›</button>
                      <button onClick={() => pagination.current_page < totalPages && fetchData(totalPages, search, dosageFilter, companyFilter, perPage)} style={pagination.current_page === totalPages ? btnDisabled : btnBase} title="Last">»</button>
                    </div>
                  )}
                </div>
              )
            })()}
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

// PrescriptionListPage.jsx — List all prescriptions (doctor sees own, admin sees all)
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getPrescriptions, deletePrescription } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function PrescriptionListPage() {
  const { isAdmin, isDoctor, isManager } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const isDoctorOnly = !isAdmin && !isManager && isDoctor

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await getPrescriptions()
      setItems(res.data?.data?.data || res.data?.data || res.data || [])
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePrescription(deleteTarget.id)
      setItems(items.filter(i => i.id !== deleteTarget.id))
      
    } catch (err) {
          <p className="admin-page-subtitle">{items.length} prescription(s)</p>
        </div>
        {(isDoctorOnly || isAdmin) && (
          <Link to="/admin/prescriptions/create" className="admin-btn admin-btn-primary">
            + Write Prescription
          </Link>
        )}
      </div>

      {/* Show Entries Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, flexWrap: 'wrap', gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
          Show
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setCurrentPage(1) }}
            style={{
              padding: '5px 10px', borderRadius: 8,
              border: '1.5px solid var(--admin-border)',
              background: 'var(--admin-card-bg)', color: 'var(--admin-text)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none', minWidth: 70
            }}
          >
            {[10, 25, 50, 100, 500].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          entries
        </div>
        <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
          Showing <strong>{filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong>–<strong>{Math.min(currentPage * perPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">All Prescriptions</h3>
          <div className="admin-table-search">
            <input type="text" placeholder="Search by patient, diagnosis..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📋</div>
            <h4>No prescriptions found</h4>
            <p>{search ? 'Try different search' : 'No prescriptions written yet'}</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  {!isDoctorOnly && <th>Doctor</th>}
                  <th>Diagnosis</th>
                  <th>Medicines</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(rx => (
                  <tr key={rx.id}>
                    <td>#{rx.id}</td>
                    <td style={{ fontWeight: 600 }}>{rx.patient_name || '—'}</td>
                    {!isDoctorOnly && <td>{rx.doctor_name || '—'}</td>}
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rx.diagnosis || '—'}
                    </td>
                    <td>
                      <span style={{ background: '#E6F6F4', color: '#00A88C', padding: '4px 10px', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
                        {rx.medicines?.length || 0} items
                      </span>
                    </td>
                    <td>{rx.created_at ? new Date(rx.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate(`/admin/prescriptions/view/${rx.id}`)}>
                          👁️ View
                        </button>
                        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate(`/admin/prescriptions/edit/${rx.id}`)}>
                          ✏️ Edit
                        </button>
                        {(isAdmin || isDoctorOnly) && (
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setDeleteTarget(rx)}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Pagination */}
      {(() => {
        const totalPages = Math.ceil(filtered.length / perPage)
        if (filtered.length === 0) return null
        const pages = []
        if (totalPages <= 7) {
          for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
          pages.push(1)
          if (currentPage > 3) pages.push('...')
          const start = Math.max(2, currentPage - 1)
          const end = Math.min(totalPages - 1, currentPage + 1)
          for (let i = start; i <= end; i++) pages.push(i)
          if (currentPage < totalPages - 2) pages.push('...')
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
              Showing <strong>{filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong>–<strong>{Math.min(currentPage * perPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => currentPage > 1 && setCurrentPage(1)} style={currentPage === 1 ? btnDisabled : btnBase} title="First">«</button>
                <button onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)} style={currentPage === 1 ? btnDisabled : btnBase} title="Previous">‹</button>
                {pages.map((p, i) => p === '...'
                  ? <span key={`d${i}`} style={{ width: 30, textAlign: 'center', color: 'var(--admin-text-muted)', fontWeight: 700 }}>…</span>
                  : <button key={p} onClick={() => setCurrentPage(p)} style={p === currentPage ? btnActive : btnBase}>{p}</button>
                )}
                <button onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)} style={currentPage === totalPages ? btnDisabled : btnBase} title="Next">›</button>
                <button onClick={() => currentPage < totalPages && setCurrentPage(totalPages)} style={currentPage === totalPages ? btnDisabled : btnBase} title="Last">»</button>
              </div>
            )}
          </div>
        )
      })()}

      <DeleteModal show={!!deleteTarget} title="Delete Prescription" message="Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  )
}

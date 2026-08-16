// AdminSubscriptionListPage.jsx — Admin view for doctor subscriptions with approval tools
import { useState, useEffect } from 'react'
import { getAdminSubscriptions, updateAdminSubscription, deleteAdminSubscription } from '../../../api/subscriptionApi'
import { useAuth } from '../../../context/AuthContext'
import { getErrorMessage } from '../../../utils/errorHelper'
import DeleteModal from '../../../components/admin/DeleteModal'

export default function AdminSubscriptionListPage() {
  const { isAdmin } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', payment_status: '', search: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchSubscriptions()
  }, [filter])

  const filtered = subscriptions

  useEffect(() => {
    setCurrentPage(1)
  }, [subscriptions.length])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const res = await getAdminSubscriptions(filter)
      const data = res.data?.data?.data || res.data?.data || []
      setSubscriptions(Array.isArray(data) ? data : [])
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id, payload) => {
    try {
      await updateAdminSubscription(id, payload)
      
      fetchSubscriptions()
    } catch (err) {
}
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAdminSubscription(deleteTarget.id)
      
      setSubscriptions(subscriptions.filter(s => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
} finally {
      setDeleting(false)
    }
  }

  if (!isAdmin) {
    return <div className="admin-loading">Admin access required</div>
  }

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">💳 Doctor Subscriptions</h2>
          <p className="admin-page-subtitle">Manage, approve, or cancel doctor subscription plans</p>
        </div>
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
          <h3 className="admin-card-title">Filter Subscriptions</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="admin-table-search">
              <input
                type="text"
                placeholder="Search doctor or email..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                style={{ minWidth: 200, height: 38 }}
              />
            </div>

            <select
              className="admin-form-select"
              value={filter.payment_status}
              onChange={(e) => setFilter({ ...filter, payment_status: e.target.value })}
              style={{ width: 'auto', minWidth: 150, height: 38 }}
            >
              <option value="">All Payments</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              className="admin-form-select"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              style={{ width: 'auto', minWidth: 150 }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
        ) : subscriptions.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">💳</div>
            <h4>No Subscriptions Found</h4>
            <p>Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Doctor</th>
                  <th>Package</th>
                  <th>Price</th>
                  <th>Dates</th>
                  <th>Payment Status</th>
                  <th>Sub Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((sub) => (
                  <tr key={sub.id}>
                    <td>#{sub.id}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{sub.doctor?.name || sub.user?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{sub.user?.email || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{sub.package?.name || 'Unknown Package'}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                        {sub.is_trial ? 'Trial' : `${sub.package?.duration_months || 0} Months`}
                      </div>
                    </td>
                    <td>৳ {sub.final_price || '0.00'}</td>
                    <td style={{ fontSize: 13 }}>
                      <div><span style={{ color: '#00A88C' }}>Start:</span> {new Date(sub.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div><span style={{ color: '#EF4444' }}>End:</span> {new Date(sub.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </td>
                    <td>
                      <span className={`admin-badge ${sub.payment_status === 'verified' ? 'badge-success' : sub.payment_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {sub.payment_status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${sub.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {sub.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        {sub.payment_status === 'pending' && (
                          <button
                            className="admin-btn admin-btn-sm"
                            style={{ background: '#00A88C', color: 'white', border: 'none' }}
                            onClick={() => handleUpdate(sub.id, { payment_status: 'verified', status: 'active' })}
                          >
                            ✓ Approve
                          </button>
                        )}
                        {sub.payment_status === 'pending' && (
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => handleUpdate(sub.id, { payment_status: 'rejected', status: 'cancelled' })}
                          >
                            ✕ Reject
                          </button>
                        )}
                        {sub.status === 'active' && (
                          <button
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => handleUpdate(sub.id, { status: 'cancelled' })}
                          >
                            Pause/Cancel
                          </button>
                        )}
                        {sub.status === 'cancelled' && sub.payment_status === 'verified' && (
                          <button
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => handleUpdate(sub.id, { status: 'active' })}
                          >
                            Re-activate
                          </button>
                        )}
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => setDeleteTarget(sub)}
                          title="Delete Subscription"
                        >
                          🗑️
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

      <DeleteModal
        show={!!deleteTarget}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription record? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

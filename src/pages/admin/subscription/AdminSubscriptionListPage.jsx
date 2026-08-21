// AdminSubscriptionListPage.jsx — Admin view for doctor subscriptions with approval tools
import { useState, useEffect } from 'react'
import { getAdminSubscriptions, updateAdminSubscription, deleteAdminSubscription } from '../../../api/subscriptionApi'
import { useAuth } from '../../../context/AuthContext'
import { getErrorMessage } from '../../../utils/errorHelper'
import DeleteModal from '../../../components/admin/DeleteModal'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'

export default function AdminSubscriptionListPage() {
  const { isAdmin } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', payment_status: '', search: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

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

      <ListToolbar
        search={filter.search}
        onSearchChange={val => setFilter(prev => ({ ...prev, search: val }))}
        searchPlaceholder="Search subscription by user, package, transaction..."
        onRefresh={fetchSubscriptions}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(filter.status || filter.payment_status)}
        onClearFilters={() => setFilter({ status: '', payment_status: '', search: '' })}
        activeFilters={[
          filter.payment_status && { key: 'payment_status', label: `Payment: ${filter.payment_status.toUpperCase()}`, onRemove: () => setFilter(prev => ({ ...prev, payment_status: '' })) },
          filter.status && { key: 'status', label: `Status: ${filter.status.toUpperCase()}`, onRemove: () => setFilter(prev => ({ ...prev, status: '' })) },
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 150 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Payment Status</label>
          <select className="status-select" value={filter.payment_status} onChange={e => setFilter(prev => ({ ...prev, payment_status: e.target.value }))} style={{ width: '100%', height: 38, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8 }}>
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div style={{ minWidth: 150 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Subscription Status</label>
          <select className="status-select" value={filter.status} onChange={e => setFilter(prev => ({ ...prev, status: e.target.value }))} style={{ width: '100%', height: 38, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8 }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </ListToolbar>
<div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">All Subscriptions</h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>{filtered.length} records found</span>
        </div>

        {loading ? (
          <TableSkeleton rowCount={6} columnWidths={['120px', '22%', '18%', '16%', '14%', '10%']} headers={['ID / Code', 'User Details', 'Package Plan', 'Duration', 'Status', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilters={Boolean(filter.status || filter.payment_status || filter.search)}
            searchQuery={filter.search}
            onClearFilters={() => setFilter({ status: '', payment_status: '', search: '' })}
            onClearSearch={() => setFilter(prev => ({ ...prev, search: '' }))}
            icon="💳"
            title="No subscriptions found"
            description="Try changing your search parameters or reset applied payment filters."
          />
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
                    <td><CompactUlid value={sub.subscription_code || sub.id} /></td>
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

      
      <TableFooter
        total={filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />
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

// AdminSubscriptionListPage.jsx — Admin view for doctor subscriptions with approval tools
import { useState, useEffect } from 'react'
import { getAdminSubscriptions, updateAdminSubscription, deleteAdminSubscription } from '../../../api/subscriptionApi'
import { useAuth } from '../../../context/AuthContext'
import { toast } from 'react-toastify'
import { getErrorMessage } from '../../../utils/errorHelper'
import DeleteModal from '../../../components/admin/DeleteModal'

export default function AdminSubscriptionListPage() {
  const { isAdmin } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', payment_status: '', search: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchSubscriptions()
  }, [filter])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const res = await getAdminSubscriptions(filter)
      const data = res.data?.data?.data || res.data?.data || []
      setSubscriptions(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch subscriptions'))
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id, payload) => {
    try {
      await updateAdminSubscription(id, payload)
      toast.success('Subscription updated successfully')
      fetchSubscriptions()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update subscription'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAdminSubscription(deleteTarget.id)
      toast.success('Subscription deleted')
      setSubscriptions(subscriptions.filter(s => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete subscription'))
    } finally {
      setDeleting(false)
    }
  }

  if (!isAdmin) {
    return <div className="admin-loading">Admin access required</div>
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">💳 Doctor Subscriptions</h2>
          <p className="admin-page-subtitle">Manage, approve, or cancel doctor subscription plans</p>
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
                {subscriptions.map((sub) => (
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

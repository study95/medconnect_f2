// SubscriptionHistoryPage.jsx — Doctor's past subscriptions
import { useState, useEffect } from 'react'
import { getSubscriptionHistory } from '../../../api/subscriptionApi'
import { toast } from 'react-toastify'

const statusColors = {
  active: { bg: '#D1FAE5', color: '#065F46' },
  expired: { bg: '#FEE2E2', color: '#991B1B' },
  cancelled: { bg: '#F1F5F9', color: '#475569' },
}

const paymentStatusColors = {
  verified: { bg: '#D1FAE5', color: '#065F46' },
  pending: { bg: '#FEF3C7', color: '#92400E' },
  rejected: { bg: '#FEE2E2', color: '#991B1B' },
}

export default function SubscriptionHistoryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadHistory() }, [])

  const loadHistory = async () => {
    try {
      const res = await getSubscriptionHistory()
      setItems(res.data?.data || [])
    } catch { toast.error('Failed to load history') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">📋 Subscription History</h2>
          <p className="admin-page-subtitle">{items.length} subscription record(s)</p>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
        ) : items.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📋</div>
            <h4>No subscription history</h4>
            <p>You haven't purchased any subscriptions yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Package</th>
                  <th>Period</th>
                  <th>Price</th>
                  <th>Payment</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((sub, idx) => {
                  const sc = statusColors[sub.status] || statusColors.cancelled
                  const pc = paymentStatusColors[sub.payment_status] || paymentStatusColors.pending
                  return (
                    <tr key={sub.id}>
                      <td style={{ color: '#94A3B8', fontWeight: 600 }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 700 }}>
                        {sub.package?.name || 'Trial'}
                        {sub.is_trial && <span style={{ color: '#D97706', fontSize: 11, marginLeft: 6 }}>(Trial)</span>}
                      </td>
                      <td style={{ fontSize: 13, color: '#64748B' }}>
                        {sub.start_date?.slice(0, 10)} → {sub.end_date?.slice(0, 10)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>৳{Math.round(sub.final_price)}</div>
                        {sub.discount_applied > 0 && (
                          <div style={{ fontSize: 11, color: '#10B981' }}>-৳{Math.round(sub.discount_applied)} discount</div>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: '#64748B' }}>{sub.payment_reference || '—'}</td>
                      <td style={{ fontSize: 12, textTransform: 'capitalize', fontWeight: 600 }}>{sub.payment_method}</td>
                      <td>
                        <span style={{
                          background: sc.bg, color: sc.color,
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700
                        }}>{sub.status}</span>
                      </td>
                      <td>
                        <span style={{
                          background: pc.bg, color: pc.color,
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700
                        }}>{sub.payment_status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

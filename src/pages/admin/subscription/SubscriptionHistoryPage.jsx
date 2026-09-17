import { useState, useEffect } from 'react'
import { getSubscriptionHistory } from '../../../api/subscriptionApi'
import axiosInstance from '../../../api/axiosInstance'
import { ExternalLink, FileText, X, CheckCircle2, Clock, AlertTriangle, Eye, Image as ImageIcon } from 'lucide-react'

const statusColors = {
  active: { bg: '#D1FAE5', color: '#065F46' },
  under_review: { bg: '#FEF3C7', color: '#92400E' },
  pending: { bg: '#FEF3C7', color: '#92400E' },
  trialing: { bg: '#DBEAFE', color: '#1E40AF' },
  rejected: { bg: '#FEE2E2', color: '#991B1B' },
  failed: { bg: '#FEE2E2', color: '#991B1B' },
  expired: { bg: '#FEE2E2', color: '#991B1B' },
  cancelled: { bg: '#F1F5F9', color: '#475569' },
  canceled: { bg: '#F1F5F9', color: '#475569' },
}

const paymentStatusColors = {
  verified: { bg: '#D1FAE5', color: '#065F46' },
  pending: { bg: '#FEF3C7', color: '#92400E' },
  rejected: { bg: '#FEE2E2', color: '#991B1B' },
  failed: { bg: '#FEE2E2', color: '#991B1B' },
}

export default function SubscriptionHistoryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [slipBlobUrl, setSlipBlobUrl] = useState(null)
  const [slipLoading, setSlipLoading] = useState(false)

  useEffect(() => { loadHistory() }, [])

  useEffect(() => {
    if (!selectedRecord) {
      if (slipBlobUrl) URL.revokeObjectURL(slipBlobUrl)
      setSlipBlobUrl(null)
      return
    }

    if (selectedRecord.has_slip && (selectedRecord.transaction_id || selectedRecord.slip_url)) {
      setSlipLoading(true)
      const targetUrl = selectedRecord.transaction_id 
        ? `/billing/manual-payment/${selectedRecord.transaction_id}/slip`
        : selectedRecord.slip_url
      axiosInstance.get(targetUrl, { responseType: 'blob' })
        .then(res => {
          const url = URL.createObjectURL(res.data)
          setSlipBlobUrl(url)
        })
        .catch(() => setSlipBlobUrl(null))
        .finally(() => setSlipLoading(false))
    }
  }, [selectedRecord])

  const loadHistory = async () => {
    try {
      const res = await getSubscriptionHistory()
      const raw = res.data?.data
      const list = Array.isArray(raw) ? raw : (raw?.data || [])
      setItems(list)
    } catch {  }
    finally { setLoading(false) }
  }

  const pendingItem = items.find(
    i => i.status === 'under_review' || i.status === 'pending' || i.payment_status === 'pending'
  )

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">📋 Subscription & Payment History</h2>
          <p className="admin-page-subtitle">{items.length} subscription and transaction record(s)</p>
        </div>
      </div>

      {pendingItem && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#92400e', fontSize: '14.5px' }}>
                Payment Verification Under Administrative Review
              </div>
              <div style={{ fontSize: '13px', color: '#b45309', marginTop: '2px' }}>
                Your package request for <strong>{pendingItem.package?.name || pendingItem.plan_name}</strong> (Ref: {pendingItem.payment_reference}) of ৳{Math.round(pendingItem.final_price || pendingItem.amount || 0)} is undergoing verification. Features will be unlocked once approved.
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: '#fde68a',
              color: '#854d0e',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Awaiting Admin Action
          </span>
        </div>
      )}

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
                  <th>Plan / Package</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Payment Ref</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Payment State</th>
                  <th style={{ textAlign: 'right' }}>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {items.map((sub, idx) => {
                  const sc = statusColors[sub.status] || statusColors.cancelled
                  const pc = paymentStatusColors[sub.payment_status] || paymentStatusColors.pending
                  return (
                    <tr key={sub.id || idx}>
                      <td style={{ color: '#94A3B8', fontWeight: 600 }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 700 }}>
                        {sub.package?.name || sub.plan_name || 'Practice Plan'}
                        {sub.is_trial && <span style={{ color: '#D97706', fontSize: 11, marginLeft: 6 }}>(Trial)</span>}
                      </td>
                      <td style={{ fontSize: 13, color: '#64748B' }}>
                        {sub.start_date
                          ? `${sub.start_date.slice(0, 10)} → ${sub.end_date?.slice(0, 10) || 'Active'}`
                          : (sub.status === 'under_review' ? 'Pending Approval' : '—')}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>৳{Math.round(sub.final_price || sub.amount || 0)}</div>
                        {sub.discount_applied > 0 && (
                          <div style={{ fontSize: 11, color: '#10B981' }}>-৳{Math.round(sub.discount_applied)} discount</div>
                        )}
                      </td>
                      <td style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: '#64748B' }}>
                        {sub.payment_reference || '—'}
                      </td>
                      <td style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>
                        {sub.payment_method?.replace('_', ' ')}
                      </td>
                      <td>
                        <span style={{
                          background: sc.bg, color: sc.color,
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase'
                        }}>{sub.status}</span>
                      </td>
                      <td>
                        <span style={{
                          background: pc.bg, color: pc.color,
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase'
                        }}>{sub.payment_status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(sub)}
                          className="admin-btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Inspect payment evidence & audit log"
                        >
                          <Eye size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── PAYMENT EVIDENCE MODAL ─── */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Payment & Lifecycle Evidence</h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Reference: {selectedRecord.payment_reference || 'N/A'}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Plan</span>
                <strong style={{ color: '#0f172a' }}>{selectedRecord.package?.name || selectedRecord.plan_name || 'Practice Plan'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Channel</span>
                <strong style={{ color: '#0f172a', textTransform: 'uppercase' }}>{selectedRecord.payment_method?.replace('_', ' ')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Amount Paid</span>
                <strong style={{ color: '#00b875' }}>৳{Number(selectedRecord.final_price || selectedRecord.amount || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Sender Mobile / Acc</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.sender_number || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Receiver Acc</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.receiver_number || 'Corporate Merchant'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Submission Time</span>
                <span>{selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString() : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Verification Status</span>
                <strong style={{ textTransform: 'uppercase', color: selectedRecord.payment_status === 'verified' ? '#059669' : '#d97706' }}>
                  {selectedRecord.payment_status || 'Pending'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Verified By</span>
                <span>{selectedRecord.approved_by || 'Awaiting Review'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Verification Time</span>
                <span>{selectedRecord.approved_at ? new Date(selectedRecord.approved_at).toLocaleString() : '—'}</span>
              </div>
              {selectedRecord.audit_note && (
                <div style={{ marginTop: '8px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                    Admin Audit Note
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#334155' }}>{selectedRecord.audit_note}</div>
                </div>
              )}
              {(slipBlobUrl || slipLoading) && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                    Uploaded Payment Proof Slip
                  </div>
                  {slipLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '12px', color: '#64748b' }}>
                      Loading payment proof screenshot...
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', background: '#0f172a', borderRadius: '10px', overflow: 'hidden', padding: '8px' }}>
                      <img
                        src={slipBlobUrl}
                        alt="Payment Proof Slip"
                        style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain', margin: '0 auto', display: 'block', borderRadius: '6px' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="admin-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

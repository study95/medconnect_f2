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

const getStatusLabel = (status) => {
  const map = {
    active: 'সক্রিয়',
    under_review: 'পর্যালোচনায়',
    pending: 'অপেক্ষমাণ',
    trialing: 'ট্রায়ালে',
    rejected: 'প্রত্যাখ্যাত',
    failed: 'ব্যর্থ',
    expired: 'মেয়াদোত্তীর্ণ',
    cancelled: 'বাতিল',
    canceled: 'বাতিল',
  }
  return map[status] || status
}

const getPaymentStatusLabel = (status) => {
  const map = {
    verified: 'অনুমোদিত',
    pending: 'অপেক্ষমাণ',
    rejected: 'প্রত্যাখ্যাত',
    failed: 'ব্যর্থ',
  }
  return map[status] || status
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
          <h2 className="admin-page-title">📋 সাবস্ক্রিপশন ও লেনদেনের ইতিহাস</h2>
          <p className="admin-page-subtitle">{items.length}টি সাবস্ক্রিপশন ও লেনদেনের রেকর্ড</p>
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
                পেমেন্ট ভেরিফিকেশন অ্যাডমিন পর্যালোচনায় রয়েছে
              </div>
              <div style={{ fontSize: '13px', color: '#b45309', marginTop: '2px' }}>
                <strong>{pendingItem.package?.name || pendingItem.plan_name}</strong>-এর জন্য আপনার প্যাকেজ অনুরোধ (রেফারেন্স: {pendingItem.payment_reference}, পরিমাণ: ৳{Math.round(pendingItem.final_price || pendingItem.amount || 0)}) যাচাই করা হচ্ছে। অ্যাডমিন অনুমোদন সম্পন্ন হলে সকল ফিচার উন্মুক্ত হবে।
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
            অ্যাডমিন অনুমোদনের অপেক্ষায়
          </span>
        </div>
      )}

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /> লোড হচ্ছে...</div>
        ) : items.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📋</div>
            <h4>কোনো সাবস্ক্রিপশন রেকর্ড নেই</h4>
            <p>আপনি এখনও কোনো সাবস্ক্রিপশন গ্রহণ করেননি।</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>প্ল্যান / প্যাকেজ</th>
                  <th>মেয়াদকাল</th>
                  <th>পরিমাণ</th>
                  <th>পেমেন্ট রেফারেন্স</th>
                  <th>মাধ্যম</th>
                  <th>অবস্থা</th>
                  <th>পেমেন্ট স্ট্যাটাস</th>
                  <th style={{ textAlign: 'right' }}>প্রমাণপত্র</th>
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
                        {sub.package?.name || sub.plan_name || 'প্র্যাকটিস প্ল্যান'}
                        {sub.is_trial && <span style={{ color: '#D97706', fontSize: 11, marginLeft: 6 }}>(ট্রায়াল)</span>}
                      </td>
                      <td style={{ fontSize: 13, color: '#64748B' }}>
                        {sub.start_date
                          ? `${sub.start_date.slice(0, 10)} → ${sub.end_date?.slice(0, 10) || 'সক্রিয়'}`
                          : (sub.status === 'under_review' ? 'অনুমোদনের অপেক্ষায়' : '—')}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>৳{Math.round(sub.final_price || sub.amount || 0)}</div>
                        {sub.discount_applied > 0 && (
                          <div style={{ fontSize: 11, color: '#10B981' }}>-৳{Math.round(sub.discount_applied)} ছাড়</div>
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
                        }}>{getStatusLabel(sub.status)}</span>
                      </td>
                      <td>
                        <span style={{
                          background: pc.bg, color: pc.color,
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase'
                        }}>{getPaymentStatusLabel(sub.payment_status)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(sub)}
                          className="admin-btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="পেমেন্টের প্রমাণ ও অডিট লগ দেখুন"
                        >
                          <Eye size={12} /> বিবরণ দেখুন
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
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>পেমেন্ট ও লাইফসাইকেল প্রমাণপত্র</h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>রেফারেন্স: {selectedRecord.payment_reference || 'প্রযোজ্য নয়'}</div>
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
                <span style={{ color: '#64748b' }}>প্ল্যান</span>
                <strong style={{ color: '#0f172a' }}>{selectedRecord.package?.name || selectedRecord.plan_name || 'প্র্যাকটিস প্ল্যান'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>পেমেন্ট মাধ্যম</span>
                <strong style={{ color: '#0f172a', textTransform: 'uppercase' }}>{selectedRecord.payment_method?.replace('_', ' ')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>পরিশোধিত অর্থ</span>
                <strong style={{ color: '#00b875' }}>৳{Number(selectedRecord.final_price || selectedRecord.amount || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>প্রেরকের মোবাইল / একাউন্ট</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.sender_number || 'প্রযোজ্য নয়'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>প্রাপক একাউন্ট</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.receiver_number || 'কর্পোরেট মার্চেন্ট'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>জমা দেওয়ার সময়</span>
                <span>{selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString('bn-BD') : 'প্রযোজ্য নয়'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>যাচাইকরণের অবস্থা</span>
                <strong style={{ textTransform: 'uppercase', color: selectedRecord.payment_status === 'verified' ? '#059669' : '#d97706' }}>
                  {getPaymentStatusLabel(selectedRecord.payment_status || 'pending')}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>যাচাইকারী</span>
                <span>{selectedRecord.approved_by || 'পর্যালোচনার অপেক্ষায়'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>যাচাইয়ের সময়</span>
                <span>{selectedRecord.approved_at ? new Date(selectedRecord.approved_at).toLocaleString('bn-BD') : '—'}</span>
              </div>
              {selectedRecord.audit_note && (
                <div style={{ marginTop: '8px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                    অ্যাডমিন অডিট নোট
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#334155' }}>{selectedRecord.audit_note}</div>
                </div>
              )}
              {(slipBlobUrl || slipLoading) && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                    আপলোডকৃত পেমেন্ট স্লিপ
                  </div>
                  {slipLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '12px', color: '#64748b' }}>
                      পেমেন্ট স্লিপ ছবি লোড হচ্ছে...
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
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

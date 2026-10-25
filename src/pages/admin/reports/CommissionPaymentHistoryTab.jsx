import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  CreditCard, CheckCircle2, Clock, XCircle, Search, Filter, 
  RotateCcw, FileText, Smartphone, Building2, Check, Copy,
  ArrowUpRight, AlertTriangle, Eye, ShieldCheck, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { TableSkeleton } from '../../../components/common/Skeletons'
import TableFooter from '../../../components/admin/TableFooter'
import EmptyState from '../../../components/common/EmptyState'

const formatBnDateTime = (dtStr) => {
  if (!dtStr) return '—'
  try {
    const d = new Date(dtStr)
    if (isNaN(d.getTime())) return String(dtStr)
    return d.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(dtStr)
  }
}

export default function CommissionPaymentHistoryTab({
  fetchApi,
  queryKey,
  onPayClick,
  dueAmount = 0,
  providerType = 'doctor'
}) {
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'pending', 'approved', 'rejected'
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const { data: response = {}, isLoading, refetch } = useQuery({
    queryKey: [queryKey, statusFilter, search, currentPage],
    queryFn: async () => {
      const res = await fetchApi({
        status: statusFilter,
        search: search.trim() || undefined,
        page: currentPage,
        per_page: 10,
      })
      return res.data || {}
    },
    staleTime: 30 * 1000,
  })

  const requests = response.data || []
  const stats = response.stats || {}
  const pagination = response.pagination || { current_page: 1, last_page: 1, total: 0 }

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    toast.success('ক্লিপবোর্ডে কপি করা হয়েছে!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const renderMethodBadge = (method, trxId) => {
    const m = (method || '').toLowerCase()
    let icon = <Smartphone size={14} />
    let color = '#d97706'
    let bg = 'rgba(245, 158, 11, 0.1)'
    let label = method || 'অন্যান্য'

    if (m.includes('bkash')) {
      icon = <Smartphone size={14} />
      color = '#e11d48'
      bg = 'rgba(225, 29, 72, 0.1)'
      label = 'bKash'
    } else if (m.includes('nagad')) {
      icon = <Smartphone size={14} />
      color = '#ea580c'
      bg = 'rgba(234, 88, 12, 0.1)'
      label = 'Nagad'
    } else if (m.includes('bank') || m.includes('offline') || m.includes('ebl')) {
      icon = <Building2 size={14} />
      color = '#0284c7'
      bg = 'rgba(2, 132, 199, 0.1)'
      label = 'Bank Transfer'
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 8px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          color,
          background: bg,
          width: 'fit-content'
        }}>
          {icon}
          <span>{label}</span>
        </span>
        {trxId && (
          <span style={{
            fontSize: 11.5,
            fontFamily: 'monospace',
            color: 'var(--admin-text-muted, #64748b)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            TrxID: <strong style={{ color: 'var(--admin-text, #0f172a)' }}>{trxId}</strong>
          </span>
        )}
      </div>
    )
  }

  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'approved') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: 800,
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <CheckCircle2 size={13} />
          <span>অনুমোদিত ও সম্পন্ন</span>
        </span>
      )
    }
    if (s === 'rejected') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: 800,
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
          border: '1px solid rgba(239, 68, 68, 0.25)'
        }}>
          <XCircle size={13} />
          <span>বাতিল</span>
        </span>
      )
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 800,
        background: 'rgba(245, 158, 11, 0.12)',
        color: '#d97706',
        border: '1px solid rgba(245, 158, 11, 0.3)'
      }}>
        <Clock size={13} />
        <span>যাচাই চলছে</span>
      </span>
    )
  }

  return (
    <div>
      {/* ── 1. KPI Metric Deck ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 20
      }}>
        {/* Total Settled / Submitted */}
        <div className="admin-card" style={{ padding: '16px 20px', borderRadius: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 6 }}>
            মোট পরিশোধের আবেদন
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--admin-text, #0f172a)', lineHeight: 1.2 }}>
            ৳ {Number(stats.total_amount || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748b)', marginTop: 4 }}>
            মোট {stats.total_count || 0}টি পেমেন্ট আবেদন
          </div>
        </div>

        {/* Pending Verification */}
        <div className="admin-card" style={{ padding: '16px 20px', borderRadius: 14, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309', marginBottom: 6 }}>
            যাচাইয়ের অপেক্ষায় (Pending)
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706', lineHeight: 1.2 }}>
            ৳ {Number(stats.pending_amount || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>
            {stats.pending_count || 0}টি রিকোয়েস্ট অ্যাডমিন পর্যালোচনায়
          </div>
        </div>

        {/* Approved & Locked */}
        <div className="admin-card" style={{ padding: '16px 20px', borderRadius: 14, borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#047857', marginBottom: 6 }}>
            অনুমোদিত ও চূড়ান্ত (Approved)
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', lineHeight: 1.2 }}>
            ৳ {Number(stats.approved_amount || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#047857', marginTop: 4 }}>
            {stats.approved_count || 0}টি পেমেন্ট চূড়ান্তভাবে গৃহীত
          </div>
        </div>

        {/* Rejected */}
        <div className="admin-card" style={{ padding: '16px 20px', borderRadius: 14, borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', marginBottom: 6 }}>
            বাতিলকৃত (Rejected)
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626', lineHeight: 1.2 }}>
            ৳ {Number(stats.rejected_amount || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>
            {stats.rejected_count || 0}টি বাতিল আবেদন
          </div>
        </div>
      </div>

      {/* ── Compact Settlement Info Note ── */}
      <div style={{
        padding: '8px 14px',
        borderRadius: 10,
        background: 'rgba(59, 130, 246, 0.06)',
        border: '1px solid rgba(59, 130, 246, 0.18)',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: '#1e40af',
        lineHeight: 1.45
      }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
        <span>
          অনলাইন বুকিংয়ের কমিশন সরাসরি প্ল্যাটফর্ম দ্বারা স্বয়ংক্রিয়ভাবে সমন্বয় হয়। চেম্বারের ক্যাশ বুকিংয়ের বকেয়া কমিশন পরিশোধে TrxID জমা দিলে তার আবেদন ও অ্যাডমিন ফিডব্যাক এখানে দেখা যাবে।
        </span>
      </div>

      {/* ── 2. Filters & Search Deck ── */}
      <div className="admin-card" style={{ padding: '14px 18px', borderRadius: 14, marginBottom: 18 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          {/* Status Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'সবগুলো', count: stats.total_count },
              { key: 'pending', label: 'যাচাই চলছে', count: stats.pending_count },
              { key: 'approved', label: 'অনুমোদিত', count: stats.approved_count },
              { key: 'rejected', label: 'বাতিল', count: stats.rejected_count },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key)
                  setCurrentPage(1)
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: statusFilter === tab.key ? 800 : 600,
                  border: statusFilter === tab.key ? '1px solid #00A88C' : '1px solid var(--admin-border, #e2e8f0)',
                  background: statusFilter === tab.key ? '#00A88C' : 'var(--admin-bg, #f8fafc)',
                  color: statusFilter === tab.key ? '#ffffff' : 'var(--admin-text, #0f172a)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s'
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 800,
                    background: statusFilter === tab.key ? 'rgba(255, 255, 255, 0.25)' : 'var(--admin-border, #e2e8f0)',
                    color: statusFilter === tab.key ? '#ffffff' : 'var(--admin-text-muted, #64748b)'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Input & Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 240 }}>
              <input
                type="text"
                placeholder="TrxID বা রিকোয়েস্ট # দিয়ে খুঁজুন..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="admin-form-input"
                style={{ height: 36, fontSize: 12.5, paddingLeft: 32 }}
              />
              <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {onPayClick && dueAmount > 0 && (
              <button
                type="button"
                onClick={onPayClick}
                className="admin-btn admin-btn-primary"
                style={{ height: 36, padding: '0 14px', fontSize: 12.5, fontWeight: 700 }}
              >
                <CreditCard size={14} />
                <span>বকেয়া পরিশোধ করুন (৳{Number(dueAmount).toLocaleString()})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Requests History Table ── */}
      <div className="admin-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 20 }}>
            <TableSkeleton rows={5} columns={6} />
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <EmptyState
              icon={<CreditCard size={48} />}
              title="কোনো কমিশন পরিশোধের আবেদন পাওয়া যায়নি"
              message={
                search || statusFilter !== 'all'
                  ? 'আপনার নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো আবেদন পাওয়া যায়নি।'
                  : dueAmount > 0
                  ? `আপনার বর্তমানে ৳${Number(dueAmount).toLocaleString()} বকেয়া রয়েছে। পরিশোধ করে TrxID দিয়ে আবেদন জমা দিন।`
                  : 'অনলাইন বুকিংয়ের কমিশন সরাসরি প্ল্যাটফর্ম দ্বারা স্বয়ংক্রিয়ভাবে সমন্বয় হয়। চেম্বারের ক্যাশ বুকিংয়ের বকেয়া পরিশোধে TrxID দিলে তার আবেদন ও অ্যাডমিন ফিডব্যাক এখানে দেখা যাবে।'
              }
            />
            {onPayClick && dueAmount > 0 && (
              <button
                type="button"
                onClick={onPayClick}
                className="admin-btn admin-btn-primary"
                style={{ marginTop: 16 }}
              >
                <CreditCard size={15} />
                <span>বকেয়া কমিশন পরিশোধ করুন</span>
              </button>
            )}
          </div>
        ) : (
          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', minWidth: 950, fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ width: 140 }}>রিকোয়েস্ট আইডি</th>
                  <th style={{ width: 150 }}>জমা দেওয়ার সময়</th>
                  <th style={{ width: 140 }}>পরিশোধিত পরিমাণ</th>
                  <th style={{ width: 160 }}>মাধ্যম ও ট্রানজ্যাকশন</th>
                  <th style={{ minWidth: 160 }}>আপনার মন্তব্য</th>
                  <th style={{ minWidth: 200 }}>অ্যাডমিন ফিডব্যাক ও মন্তব্য</th>
                  <th style={{ width: 130 }}>স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const isApproved = req.status === 'approved'
                  const isRejected = req.status === 'rejected'
                  const isPending = req.status === 'pending'

                  return (
                    <tr key={req.id}>
                      {/* Request ID */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--admin-text, #0f172a)' }}>
                            #{req.request_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(req.request_number, req.id)}
                            title="কপি করুন"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedId === req.id ? '#10b981' : '#94a3b8',
                              cursor: 'pointer',
                              padding: 2
                            }}
                          >
                            {copiedId === req.id ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td>
                        <div style={{ color: 'var(--admin-text, #0f172a)', fontWeight: 600 }}>
                          {formatBnDateTime(req.created_at)}
                        </div>
                      </td>

                      {/* Amount & Count */}
                      <td>
                        <div style={{ fontWeight: 900, fontSize: 14, color: '#00B875' }}>
                          ৳ {Number(req.amount || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--admin-text-muted, #64748b)', marginTop: 2 }}>
                          {req.appointment_count || (req.appointment_ids?.length || 0)}টি অ্যাপয়েন্টমেন্ট
                        </div>
                      </td>

                      {/* Method & TrxID */}
                      <td>
                        {renderMethodBadge(req.payment_method, req.transaction_reference)}
                      </td>

                      {/* Provider Notes */}
                      <td>
                        {req.notes ? (
                          <span style={{ color: 'var(--admin-text, #0f172a)', fontSize: 12 }}>
                            {req.notes}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted, #94a3b8)', fontStyle: 'italic', fontSize: 11.5 }}>
                            কোনো নোট দেওয়া হয়নি
                          </span>
                        )}
                      </td>

                      {/* Admin Feedback */}
                      <td>
                        {isApproved ? (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: 8,
                            padding: '6px 10px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#065f46', fontWeight: 700, fontSize: 11.5 }}>
                              <CheckCircle2 size={13} />
                              <span>{req.admin_notes || 'অনুমোদিত ও যাচাইকৃত'}</span>
                            </div>
                            {req.action_at && (
                              <div style={{ fontSize: 10.5, color: '#047857', marginTop: 2 }}>
                                {formatBnDateTime(req.action_at)}
                              </div>
                            )}
                          </div>
                        ) : isRejected ? (
                          <div style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: 8,
                            padding: '6px 10px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#991b1b', fontWeight: 700, fontSize: 11.5 }}>
                              <AlertTriangle size={13} />
                              <span>বাতিল করার কারণ:</span>
                            </div>
                            <div style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 2 }}>
                              {req.admin_notes || 'তথ্যে গরমিল বা ভেরিফিকেশন ব্যর্থ হয়েছে।'}
                            </div>
                            {req.action_at && (
                              <div style={{ fontSize: 10.5, color: '#dc2626', marginTop: 2 }}>
                                {formatBnDateTime(req.action_at)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            borderRadius: 8,
                            padding: '6px 10px',
                            color: '#92400e',
                            fontSize: 11.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}>
                            <Clock size={12} />
                            <span>অ্যাডমিন ব্যাংক/bKash স্টেটমেন্ট যাচাই করছেন...</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        {renderStatusBadge(req.status)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--admin-border, #e2e8f0)' }}>
            <TableFooter
              totalItems={pagination.total}
              currentPage={pagination.current_page}
              totalPages={pagination.last_page}
              perPage={pagination.per_page}
              onPageChange={page => setCurrentPage(page)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

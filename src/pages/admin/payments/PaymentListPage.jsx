// PaymentListPage.jsx — Admin payment records management
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { getPayments, updatePayment, deletePayment } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import StatusBadge from '../../../components/admin/StatusBadge'
import { getErrorMessage } from '../../../utils/errorHelper'

const PAYMENT_STATUS_COLORS = {
  Paid:   { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)' },
  Unpaid: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
  default:{ bg: 'var(--admin-bg)', color: 'var(--admin-text-muted)', border: 'var(--admin-border)' },
}

export default function PaymentListPage() {
  const { isAdmin, isManager } = useAuth()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ payment_status: '', transaction_id: '', amount: '', payment_method: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (dateFilter) params.date = dateFilter
      if (monthFilter) params.month = monthFilter
      if (yearFilter) params.year = yearFilter
      if (search) params.search = search
      const res = await getPayments(params)
      const raw = res.data?.data?.data || res.data?.data || res.data || []
      setItems(Array.isArray(raw) ? raw : [])
    } catch (err) {
} finally {
      setLoading(false)
    }
  }, [dateFilter, monthFilter, yearFilter, search])

  useEffect(() => { fetchData() }, [fetchData])

  // Client side filter (payment_status since backend doesn't filter by it)
  const filtered = items.filter(a => {
    if (paymentFilter && a.payment_status !== paymentFilter) return false
    return true
  })

  const years = [...new Set(items.map(a => a.date ? new Date(a.date).getFullYear() : null).filter(Boolean))].sort((a, b) => b - a)

  const counts = {
    all: items.length,
    paid: items.filter(a => a.payment_status === 'Paid').length,
    unpaid: items.filter(a => a.payment_status === 'Unpaid').length,
  }

  const hasFilters = search || dateFilter || paymentFilter || monthFilter || yearFilter
  const clearFilters = () => {
    setSearch('')
    setDateFilter('')
    setPaymentFilter('')
    setMonthFilter('')
    setYearFilter('')
  }

  const openEdit = (appt) => {
    setEditTarget(appt)
    setEditForm({
      payment_status: appt.payment_status || '',
      transaction_id: appt.transaction_id || '',
      amount: appt.amount || '',
      payment_method: appt.payment_method || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editTarget) return
    setSaving(true)
    try {
      await updatePayment(editTarget.id, editForm)
      setItems(items.map(i => i.id === editTarget.id ? { ...i, ...editForm } : i))
      
      setEditTarget(null)
    } catch (err) {
} finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePayment(deleteTarget.id)
      setItems(items.filter(i => i.id !== deleteTarget.id))
      
    } catch (err) {
} finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const getPaymentStatusStyle = (status) => PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS.default

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>💳 Payment Records</h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>{items.length} total payment records · {counts.paid} paid · {counts.unpaid} unpaid</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: 4, background: 'var(--admin-bg)', borderRadius: 12, width: 'fit-content', border: '1px solid var(--admin-border)' }}>
        {[
          { key: '', label: 'All', count: counts.all, color: '#6366F1' },
          { key: 'Paid', label: 'Paid', count: counts.paid, color: '#10B981' },
          { key: 'Unpaid', label: 'Unpaid', count: counts.unpaid, color: '#F59E0B' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setPaymentFilter(tab.key)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: paymentFilter === tab.key ? 'var(--admin-card-bg)' : 'transparent',
              color: paymentFilter === tab.key ? 'var(--admin-text)' : 'var(--admin-text-muted)',
              boxShadow: paymentFilter === tab.key ? 'var(--admin-shadow-sm)' : 'none'
            }}
          >
            {tab.key === 'Paid' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />}
            {tab.key === 'Unpaid' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />}
            {tab.label}
            <span style={{ 
              background: paymentFilter === tab.key ? 'var(--admin-bg)' : 'rgba(0,0,0,0.05)', 
              color: paymentFilter === tab.key ? 'var(--admin-primary)' : 'inherit',
              padding: '2px 8px', 
              borderRadius: 6, 
              fontSize: 11,
              fontWeight: 800
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="admin-filters-bar" style={{ padding: 20, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr repeat(3, 1fr) auto', gap: 16, alignItems: 'flex-end' }}>
          {/* Search */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              🔍 Manual Search
            </label>
            <input
              type="text"
              className="admin-form-input"
              placeholder="TxnID, Reference, Patient..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 14px', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
            />
          </div>

          {/* Date */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              📅 Date
            </label>
            <input
              type="date"
              className="admin-form-input"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ padding: '9px 12px', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
            />
          </div>

          {/* Month */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              📆 Month
            </label>
            <select
              className="admin-form-select"
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              style={{ padding: '9px 12px', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
            >
              <option value="">All Months</option>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              🗓️ Year
            </label>
            <select
              className="admin-form-select"
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              style={{ padding: '9px 12px', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
            >
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {hasFilters && (
            <button 
              className="admin-btn admin-btn-outline admin-btn-sm" 
              onClick={clearFilters}
              style={{ height: 42, padding: '0 16px', color: 'var(--admin-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Total Records', value: counts.all, icon: '📋', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
          { label: 'Paid Amount', value: counts.paid, icon: '✅', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
          { label: 'Unpaid Pending', value: counts.unpaid, icon: '⏳', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
          {
            label: 'Total Collected',
            value: `৳${items.filter(a => a.payment_status === 'Paid').reduce((s, a) => s + (parseFloat(a.amount) || 0), 0).toLocaleString()}`,
            icon: '💰', color: '#00A88C', bg: 'rgba(0, 168, 140, 0.1)'
          },
        ].map(stat => (
          <div key={stat.label} className="admin-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: 16, background: stat.bg, color: stat.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
            }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--admin-text)', lineHeight: 1.2 }}>{stat.value}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', letterSpacing: '0.2px' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            Payment Transactions
            {filtered.length !== items.length && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)', marginLeft: 8 }}>({filtered.length} of {items.length})</span>}
          </h3>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="admin-loading"><div className="admin-spinner" /> Loading payments...</div>
          ) : filtered.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">💳</div>
              <h4 style={{ color: 'var(--admin-text)' }}>No payment records found</h4>
              <p style={{ color: 'var(--admin-text-muted)' }}>{hasFilters ? 'Try different filters' : 'No payments recorded yet'}</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 24 }}>Ref / ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Method</th>
                    <th>TxnID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    {(isAdmin || isManager) && <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(appt => {
                    const ps = getPaymentStatusStyle(appt.payment_status)
                    return (
                      <tr key={appt.id}>
                        <td style={{ paddingLeft: 24 }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--admin-primary)', fontSize: 13 }}>
                            {appt.registration_id || `#${appt.id}`}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Appt #{appt.id}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{appt.user_name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{appt.user_email || ''}</div>
                        </td>
                        <td style={{ color: 'var(--admin-text)', fontWeight: 600 }}>{appt.doctor_name || '—'}</td>
                        <td style={{ fontSize: 13, color: 'var(--admin-text)' }}>
                          {appt.date ? new Date(appt.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td>
                          <span style={{
                            background: ps.bg, color: ps.color, border: `1.5px solid ${ps.border}`,
                            padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800
                          }}>
                            {appt.payment_status || 'N/A'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 13 }}>
                          {appt.payment_method || '—'}
                          {appt.payment_number && <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{appt.payment_number}</div>}
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--admin-text)', fontWeight: 700 }}>
                            {appt.transaction_id || '—'}
                          </span>
                        </td>
                        <td>
                          {appt.amount
                            ? <span style={{ fontWeight: 800, color: '#10B981', fontSize: 14 }}>৳ {Number(appt.amount).toLocaleString()}</span>
                            : <span style={{ color: 'var(--admin-text-muted)' }}>—</span>
                          }
                        </td>
                        <td><StatusBadge status={appt.status} /></td>
                        {(isAdmin || isManager) && (
                          <td style={{ textAlign: 'right', paddingRight: 24 }}>
                            <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                              <button
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                style={{ color: 'var(--admin-primary)', borderColor: 'rgba(0, 168, 140, 0.2)' }}
                                onClick={() => openEdit(appt)}
                                title="Edit Payment"
                              >
                                ✏️ Edit
                              </button>
                              {isAdmin && (
                                <button
                                  className="admin-btn admin-btn-danger admin-btn-sm"
                                  onClick={() => setDeleteTarget(appt)}
                                  title="Delete Record"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="admin-card premium-modal" style={{ maxWidth: 460, background: 'var(--admin-card-bg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontWeight: 800, margin: 0, color: 'var(--admin-text)', fontSize: 18 }}>✏️ Edit Payment</h3>
              <button 
                onClick={() => setEditTarget(null)} 
                style={{ background: 'var(--admin-bg)', border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: 'var(--admin-text)' }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Payment Status */}
              <div className="admin-form-group">
                <label className="admin-form-label">Payment Status</label>
                <select
                  className="admin-form-select"
                  value={editForm.payment_status}
                  onChange={e => setEditForm(f => ({ ...f, payment_status: e.target.value }))}
                  style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
                >
                  <option value="">-- Select Status --</option>
                  <option value="Paid">✅ Paid</option>
                  <option value="Unpaid">⏳ Unpaid</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="admin-form-group">
                <label className="admin-form-label">Payment Method</label>
                <select
                  className="admin-form-select"
                  value={editForm.payment_method}
                  onChange={e => setEditForm(f => ({ ...f, payment_method: e.target.value }))}
                  style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
                >
                  <option value="">-- Select Method --</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Upay">Upay</option>
                  <option value="DBBL Nexus">DBBL Nexus</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              {/* Transaction ID */}
              <div className="admin-form-group">
                <label className="admin-form-label">Transaction ID</label>
                <input
                  className="admin-form-input"
                  type="text"
                  value={editForm.transaction_id}
                  onChange={e => setEditForm(f => ({ ...f, transaction_id: e.target.value }))}
                  placeholder="TRX..."
                  style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
                />
              </div>

              {/* Amount */}
              <div className="admin-form-group">
                <label className="admin-form-label">Amount (৳)</label>
                <input
                  className="admin-form-input"
                  type="number"
                  value={editForm.amount}
                  onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="500"
                  style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="admin-btn admin-btn-primary"
                style={{ flex: 1, padding: '12px' }}
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button onClick={() => setEditTarget(null)} className="admin-btn admin-btn-outline" style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteModal
        show={!!deleteTarget}
        title="Delete Payment Record"
        message={`Are you sure you want to delete the payment record for appointment #${deleteTarget?.id}? This will also delete the appointment.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 20px;
        }
      `}} />
    </div>
  )
}

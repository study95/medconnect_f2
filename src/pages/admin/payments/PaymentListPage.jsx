// PaymentListPage.jsx — Admin payment records management
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getPayments, updatePayment, deletePayment, bulkDeletePayments } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { getErrorMessage } from '../../../utils/errorHelper'
import toast from 'react-hot-toast'

function TableCheckbox({ checked, indeterminate, onChange, title }) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        margin: 0,
        position: 'relative',
        userSelect: 'none',
        verticalAlign: 'middle',
      }}
      title={title}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          margin: 0,
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: checked || indeterminate ? '1.5px solid #10B981' : '1.5px solid #D1D5DB',
          background: checked || indeterminate ? '#10B981' : '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease-in-out',
          boxShadow: checked || indeterminate ? '0 1px 3px rgba(16, 185, 129, 0.3)' : '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {!checked && indeterminate && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </span>
    </label>
  )
}

const PAYMENT_METHODS = ['all', 'bkash', 'nagad', 'rocket', 'cash', 'card', 'online', 'bank_transfer']
const PAYMENT_STATUSES = ['all', 'paid', 'unpaid', 'refunded', 'partial']

export default function PaymentListPage() {
  const { isAdmin } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (methodFilter !== 'all') params.payment_method = methodFilter
      if (statusFilter !== 'all') params.payment_status = statusFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const res = await getPayments(params)
      setPayments(res.data?.data?.data || res.data?.data || res.data || [])
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayments() }, [methodFilter, statusFilter])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePayment(deleteTarget.id)
      toast.success('Payment record deleted successfully.')
      setPayments(prev => prev.filter(p => p.id !== deleteTarget.id))
      setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id))
    } catch (err) {
      console.error('Failed to delete payment', err)
      toast.error('Failed to delete payment record.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setBulkDeleting(true)
    try {
      const res = await bulkDeletePayments(selectedIds)
      toast.success(res.data?.message || `Successfully deleted ${selectedIds.length} payment record(s).`)
      setPayments(prev => prev.filter(p => !selectedIds.includes(p.id)))
      setSelectedIds([])
      setShowBulkDeleteModal(false)
    } catch (err) {
      console.error('Failed to delete selected payment records', err)
      toast.error(err.response?.data?.message || 'Failed to delete selected payment records.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updatePayment(id, { payment_status: newStatus })
      setPayments(payments.map(p => p.id === id ? { ...p, payment_status: newStatus } : p))
      toast.success('পেমেন্ট স্ট্যাটাস আপডেট হয়েছে')
    } catch (err) {
      toast.error(err.response?.data?.message || 'পেমেন্ট স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি।')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setMethodFilter('all')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setTimeout(fetchPayments, 0)
  }

  const filtered = payments.filter(pay => {
    if (search) {
      const q = search.toLowerCase()
      const matchPatient = pay.patient?.name?.toLowerCase().includes(q) || pay.patient_name?.toLowerCase().includes(q) || pay.user_name?.toLowerCase().includes(q)
      const matchDoc = pay.doctor?.name?.toLowerCase().includes(q) || pay.doctor_name?.toLowerCase().includes(q)
      const matchTx = pay.transaction_id?.toLowerCase().includes(q) || String(pay.id).includes(q)
      if (!matchPatient && !matchDoc && !matchTx) return false
    }
    return true
  })

  useEffect(() => { setCurrentPage(1) }, [filtered.length])
  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(p => selectedIds.includes(p.id))
  const isSomeSelected = paginatedData.some(p => selectedIds.includes(p.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedData.map(p => p.id)
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)))
    } else {
      const newIds = paginatedData.map(p => p.id).filter(id => !selectedIds.includes(id))
      setSelectedIds(prev => [...prev, ...newIds])
    }
  }

  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const totalAmount = filtered.reduce((sum, p) => sum + Number(p.fee || p.amount || p.total_amount || 0), 0)
  const paidCount = filtered.filter(p => p.payment_status === 'paid').length
  const unpaidCount = filtered.filter(p => p.payment_status === 'unpaid' || !p.payment_status).length

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>💳</span>
            Payment Transactions
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Financial accounts, settlement logs, and billing ledger</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Total Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#00A88C', marginTop: 4 }}>৳{totalAmount.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Paid Transactions</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981', marginTop: 4 }}>{paidCount}</div>
        </div>
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Pending Dues</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>{unpaidCount}</div>
        </div>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by patient, doctor, transaction ID..."
        onRefresh={fetchPayments}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(methodFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo)}
        onClearFilters={clearFilters}
        activeFilters={[
          methodFilter !== 'all' && { key: 'method', label: `Method: ${methodFilter.toUpperCase()}`, onRemove: () => setMethodFilter('all') },
          statusFilter !== 'all' && { key: 'status', label: `Status: ${statusFilter.toUpperCase()}`, onRemove: () => setStatusFilter('all') },
          dateFrom && { key: 'dateFrom', label: `From: ${dateFrom}`, onRemove: () => setDateFrom('') },
          dateTo && { key: 'dateTo', label: `To: ${dateTo}`, onRemove: () => setDateTo('') },
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Payment Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}>
            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.toUpperCase()}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Method</label>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m === 'all' ? 'All Methods' : m.toUpperCase()}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Date From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }} />
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Date To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }} />
        </div>
      </ListToolbar>

      <div className="admin-card">
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '14px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 className="admin-card-title" style={{ margin: 0 }}>Transaction Ledger</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {selectedIds.length > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
                  border: '1px solid #FECDD3',
                  borderRadius: 20,
                  padding: '4px 6px 4px 14px',
                  boxShadow: '0 2px 6px rgba(225, 29, 72, 0.08)',
                  animation: 'fadeInSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#E11D48',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#9F1239', letterSpacing: '-0.01em' }}>
                    {selectedIds.length} <span style={{ fontWeight: 600, color: '#BE123C' }}>selected</span>
                  </span>
                </div>

                <div style={{ width: 1, height: 16, background: '#FDA4AF', opacity: 0.6 }} />

                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9F1239',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 12,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(225, 29, 72, 0.1)'
                    e.currentTarget.style.color = '#881337'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#9F1239'
                  }}
                >
                  Deselect
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowBulkDeleteModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 14px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(225, 29, 72, 0.25)',
                      transition: 'transform 0.1s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(225, 29, 72, 0.35)'
                      e.currentTarget.style.transform = 'translateY(-0.5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(225, 29, 72, 0.25)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    <span>Delete ({selectedIds.length})</span>
                  </button>
                )}
              </div>
            )}
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--admin-text-muted, #64748B)',
                background: 'var(--admin-bg, #F8FAFC)',
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid var(--admin-border, #E2E8F0)',
              }}
            >
              <strong style={{ color: 'var(--admin-text, #0F172A)' }}>{filtered.length}</strong> Records Found
            </div>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['44px', '120px', '22%', '20%', '14%', '12%', '12%', '8%']} headers={['', 'Transaction', 'Payer / Patient', 'Doctor / Service', 'Amount', 'Method', 'Status', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(methodFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo || search)} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="💳" title="No payment records found" description="No transactions match your search or filter settings." />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center', paddingLeft: 16 }}>
                    <TableCheckbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected && !isAllSelected}
                      onChange={toggleSelectAll}
                      title={isAllSelected ? 'Deselect all' : 'Select all on this page'}
                    />
                  </th>
                  <th>Transaction ID</th>
                  <th>Patient Details</th>
                  <th>Doctor / Service</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(pay => {
                  const isSelected = selectedIds.includes(pay.id)
                  return (
                  <tr
                    key={pay.id}
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.06)' : undefined,
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ width: 44, textAlign: 'center', paddingLeft: 16 }} onClick={e => e.stopPropagation()}>
                      <TableCheckbox
                        checked={isSelected}
                        onChange={() => toggleSelectOne(pay.id)}
                        title="Select row"
                      />
                    </td>
                    <td>
                      <CompactUlid value={pay.transaction_id || `TXN-${pay.id}`} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{pay.patient?.name || pay.user_name || pay.patient_name || 'Patient'}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{pay.patient?.phone || pay.user_phone || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{pay.doctor?.name || pay.doctor_name || 'Medical Consultation'}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{pay.hospital?.name || pay.hospital_name || 'Hospital'}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--admin-text)', fontSize: 14 }}>
                        ৳{pay.fee || pay.amount || pay.total_amount || 0}
                      </span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>
                        {pay.payment_method || 'CASH'}
                      </span>
                    </td>
                    <td>
                      {pay.is_payment_locked ? (
                        <span 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: 'rgba(16,185,129,0.15)',
                            color: '#059669',
                            border: '1px solid rgba(16,185,129,0.3)',
                            userSelect: 'none'
                          }} 
                          title="প্রেসক্রিপশন সম্পন্ন হওয়ায় এই পেমেন্টটি লক করা হয়েছে"
                        >
                          🔒 PAID
                        </span>
                      ) : (
                        <select
                          value={pay.payment_status?.toLowerCase() || 'unpaid'}
                          onChange={(e) => handleStatusUpdate(pay.id, e.target.value)}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--admin-border)',
                            background: pay.payment_status?.toLowerCase() === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                            color: pay.payment_status?.toLowerCase() === 'paid' ? '#10B981' : '#F59E0B',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="paid">PAID</option>
                          <option value="unpaid">UNPAID</option>
                          <option value="refunded">REFUNDED</option>
                          <option value="partial">PARTIAL</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => setDeleteTarget(pay)}
                          disabled={pay.is_payment_locked}
                          style={pay.is_payment_locked ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                          title={pay.is_payment_locked ? "প্রেসক্রিপশন সম্পন্ন হওয়ায় পেমেন্ট মুছে ফেলা সম্ভব নয়" : "Delete"}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
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
        title="Delete Payment Record"
        message="Are you sure you want to delete this payment record? This action is permanent."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <DeleteModal
        show={showBulkDeleteModal}
        title="Bulk Delete Payment Records"
        message={`Are you sure you want to delete ${selectedIds.length} selected payment transaction(s)? All associated billing logs will be affected. This action is permanent.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
        loading={bulkDeleting}
      />
    </div>
  )
}
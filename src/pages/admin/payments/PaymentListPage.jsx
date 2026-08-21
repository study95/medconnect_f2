// PaymentListPage.jsx — Admin payment records management
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getPayments, updatePayment, deletePayment } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { getErrorMessage } from '../../../utils/errorHelper'

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
  const [deleting, setDeleting] = useState(false)
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
      setPayments(payments.filter(p => p.id !== deleteTarget.id))
    } catch (err) {
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updatePayment(id, { payment_status: newStatus })
      setPayments(payments.map(p => p.id === id ? { ...p, payment_status: newStatus } : p))
    } catch (err) {
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

  const totalAmount = filtered.reduce((sum, p) => sum + Number(p.fee || p.amount || p.total_amount || 0), 0)
  const paidCount = filtered.filter(p => p.payment_status === 'paid').length
  const unpaidCount = filtered.filter(p => p.payment_status === 'unpaid' || !p.payment_status).length

  return (
    <div>
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
        <div className="admin-card-header">
          <h3 className="admin-card-title">Transaction Ledger</h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>{filtered.length} total</span>
        </div>

        {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['120px', '22%', '20%', '14%', '12%', '12%', '8%']} headers={['Transaction', 'Payer / Patient', 'Doctor / Service', 'Amount', 'Method', 'Status', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(methodFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo || search)} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="💳" title="No payment records found" description="No transactions match your search or filter settings." />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
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
                {paginatedData.map(pay => (
                  <tr key={pay.id}>
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
                      <select
                        value={pay.payment_status || 'unpaid'}
                        onChange={(e) => handleStatusUpdate(pay.id, e.target.value)}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-border)',
                          background: pay.payment_status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: pay.payment_status === 'paid' ? '#10B981' : '#F59E0B',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="paid">PAID</option>
                        <option value="unpaid">UNPAID</option>
                        <option value="refunded">REFUNDED</option>
                        <option value="partial">PARTIAL</option>
                      </select>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => setDeleteTarget(pay)}
                          title="Delete"
                        >🗑️</button>
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
        title="Delete Payment Record"
        message="Are you sure you want to delete this payment record? This action is permanent."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
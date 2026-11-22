import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Loader2, 
  Search,
  AlertCircle,
  X,
  Wallet,
  Building,
  Phone,
  ArrowRight,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Receipt,
  FileCheck
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import adminAgentApi from '../../../api/adminAgentApi'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import EmptyState from '../../../components/common/EmptyState'
import { TableSkeleton } from '../../../components/common/Skeletons'
import CompactUlid from '../../../components/common/CompactUlid'
import useTableUrlFilters from '../../../hooks/useTableUrlFilters'

export default function PayoutApprovalDeskPage() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Settlement Modal State
  const [settlingPayout, setSettlingPayout] = useState(null)
  const [trxRef, setTrxRef] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)

  // Enterprise URL & session-synchronized filters
  const {
    filters,
    setFilter,
    resetFilters,
    search,
    setSearch,
    debouncedSearch,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    hasActiveFilters,
  } = useTableUrlFilters({
    initialFilters: {
      statusFilter: '',
      methodFilter: '',
    },
    aliases: {
      statusFilter: ['status'],
      methodFilter: ['method', 'payout_method'],
    },
    storageKey: 'admin_payout_desk_filters',
    defaultPerPage: 15,
  })

  const { statusFilter, methodFilter } = filters
  const setStatusFilter = (val) => setFilter('statusFilter', val)
  const setMethodFilter = (val) => setFilter('methodFilter', val)

  // Pagination
  const [total, setTotal] = useState(0)

  const fetchPayouts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const params = {
        page: currentPage,
        per_page: perPage,
      }
      if (statusFilter) params.status = statusFilter
      if (methodFilter) params.payout_method = methodFilter

      const res = await adminAgentApi.getPayoutsQueue(params)
      let list = res.data || []

      // Client-side search filtering if backend search is not wired
      if (debouncedSearch && debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim()
        list = list.filter(p => 
          (p.payout_no && p.payout_no.toLowerCase().includes(q)) ||
          (p.agent?.user?.name && p.agent.user.name.toLowerCase().includes(q)) ||
          (p.agent?.agent_code && p.agent.agent_code.toLowerCase().includes(q)) ||
          (p.agent?.user?.phone && p.agent.user.phone.toLowerCase().includes(q)) ||
          (p.account_details?.account_number && String(p.account_details.account_number).toLowerCase().includes(q))
        )
      }

      setPayouts(list)
      if (res.pagination) {
        setTotal(res.pagination.total || 0)
      } else {
        setTotal(list.length)
      }
    } catch (err) {
      console.error('Failed to load payouts queue:', err)
      toast.error(err?.response?.data?.message || 'Failed to fetch payout requests queue.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentPage, perPage, statusFilter, methodFilter, debouncedSearch])

  useEffect(() => {
    fetchPayouts()
  }, [fetchPayouts])

  const clearFilters = () => {
    resetFilters()
  }

  // Summary Metrics
  const stats = useMemo(() => {
    const totalCount = total || payouts.length
    const pendingList = payouts.filter(p => p.status === 'pending')
    const completedList = payouts.filter(p => p.status === 'completed')

    const pendingTotal = pendingList.reduce((acc, p) => acc + parseFloat(p.net_payable_amount || 0), 0)
    const completedTotal = completedList.reduce((acc, p) => acc + parseFloat(p.net_payable_amount || 0), 0)
    const totalTds = payouts.reduce((acc, p) => acc + parseFloat(p.tds_amount || 0), 0)

    return {
      totalCount,
      pendingCount: pendingList.length,
      pendingTotal,
      completedCount: completedList.length,
      completedTotal,
      totalTds
    }
  }, [total, payouts])

  const handleSettle = async (e) => {
    e.preventDefault()
    if (!trxRef.trim()) {
      const msg = 'MFS or Bank Transaction Reference is strictly required.'
      setModalError(msg)
      toast.error(msg)
      return
    }

    setSubmitting(true)
    setModalError(null)
    try {
      await adminAgentApi.settlePayout(settlingPayout.id, {
        transaction_reference: trxRef,
        admin_notes: adminNotes,
      })
      toast.success(`Payout ${settlingPayout.payout_no} settled and 3-leg ledger posted successfully!`)
      setSettlingPayout(null)
      setTrxRef('')
      setAdminNotes('')
      await fetchPayouts(true)
    } catch (err) {
      console.error('Failed to settle payout:', err)
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Settlement failed.'
      setModalError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'AG'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="admin-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ 
              fontSize: 22, 
              width: 44, 
              height: 44, 
              borderRadius: 12, 
              background: 'linear-gradient(135deg, rgba(0, 184, 117, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)',
              border: '1px solid rgba(0, 184, 117, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              💳
            </span>
            <div>
              <h2 className="admin-page-title" style={{ color: 'var(--admin-text)', margin: 0, fontSize: 24, fontWeight: 800 }}>
                Agent Payout &amp; TDS Settlement Desk
              </h2>
              <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)', margin: '4px 0 0', fontSize: 13 }}>
                Disburse field agent commission claims with automated 10% Withholding Tax (TDS) and double-entry postings
              </p>
            </div>
          </div>
        </div>

        <div className="admin-page-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => fetchPayouts(true)}
            className="admin-btn admin-btn-outline"
            style={{
              height: 40,
              padding: '0 16px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh Desk</span>
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 20,
      }}>
        {/* Pending Disbursements */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
          className="admin-card" 
          style={{ 
            padding: '18px 20px', 
            borderRadius: 14, 
            margin: 0,
            cursor: 'pointer',
            border: statusFilter === 'pending' ? '2px solid #F59E0B' : '1px solid var(--admin-border)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Payouts
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#D97706', marginTop: 8, letterSpacing: '-0.02em' }}>
            {stats.pendingCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            <span>৳{stats.pendingTotal.toLocaleString()} Net Pending</span>
          </div>
        </div>

        {/* Settled Disbursements */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'completed' ? '' : 'completed')}
          className="admin-card" 
          style={{ 
            padding: '18px 20px', 
            borderRadius: 14, 
            margin: 0,
            cursor: 'pointer',
            border: statusFilter === 'completed' ? '2px solid #10B981' : '1px solid var(--admin-border)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Settled Payouts
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981', marginTop: 8, letterSpacing: '-0.02em' }}>
            {stats.completedCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            <span>৳{stats.completedTotal.toLocaleString()} Disbursed</span>
          </div>
        </div>

        {/* 10% Withholding Tax (TDS) */}
        <div className="admin-card" style={{ padding: '18px 20px', borderRadius: 14, margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              10% NBR Tax Withheld
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#6366F1', marginTop: 8, letterSpacing: '-0.02em' }}>
            ৳{stats.totalTds.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            <span>Auto-credited to ACC-TAX-PAYABLE-NBR</span>
          </div>
        </div>

        {/* Total Portfolio Requests */}
        <div 
          onClick={() => setStatusFilter('')}
          className="admin-card" 
          style={{ 
            padding: '18px 20px', 
            borderRadius: 14, 
            margin: 0,
            cursor: 'pointer',
            border: '1px solid var(--admin-border)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Claims
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(2, 132, 199, 0.1)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--admin-text)', marginTop: 8, letterSpacing: '-0.02em' }}>
            {stats.totalCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            <span>Across all settlement batches</span>
          </div>
        </div>
      </div>

      {/* ── Enterprise Toolbar ── */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by payout no, agent name, phone, account number..."
        onRefresh={() => fetchPayouts(true)}
        refreshing={refreshing || loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        activeFilters={[
          statusFilter && { 
            key: 'status', 
            label: `Status: ${statusFilter.toUpperCase()}`, 
            onRemove: () => setStatusFilter('') 
          },
          methodFilter && {
            key: 'method',
            label: `Method: ${methodFilter.toUpperCase()}`,
            onRemove: () => setMethodFilter('')
          }
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Status Filter
          </label>
          <select
            className="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              height: 40,
              background: 'var(--admin-card-bg)',
              border: '1px solid var(--admin-border)',
              color: 'var(--admin-text)',
              borderRadius: 8,
              padding: '0 12px',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Settlement</option>
            <option value="completed">Completed &amp; Settled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div style={{ minWidth: 150 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Payout Method
          </label>
          <select
            className="status-select"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{
              width: '100%',
              height: 40,
              background: 'var(--admin-card-bg)',
              border: '1px solid var(--admin-border)',
              color: 'var(--admin-text)',
              borderRadius: 8,
              padding: '0 12px',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <option value="">All Channels</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>
      </ListToolbar>

      {/* ── Main Payouts Table Card ── */}
      <div className="admin-card" style={{ overflow: 'hidden', marginTop: 16 }}>
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 className="admin-card-title" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--admin-text)' }}>
              Payout Settlement Queue
            </h3>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              background: 'rgba(0, 184, 117, 0.1)',
              color: '#00B875',
              padding: '3px 8px',
              borderRadius: 6,
            }}>
              {total} Requests
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
              Showing Page {currentPage}
            </span>
          </div>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading && payouts.length === 0 ? (
            <TableSkeleton
              rowCount={6}
              columnWidths={['160px', '220px', '140px', '120px', '140px', '170px', '110px', '130px']}
              headers={['Payout No', 'Agent Profile', 'Gross Amount', '10% TDS', 'Net Payable', 'Disbursement Channel', 'Status', 'Action']}
            />
          ) : payouts.length === 0 ? (
            <EmptyState
              hasFilters={Boolean(statusFilter || methodFilter || search)}
              searchQuery={search}
              onClearFilters={clearFilters}
              onClearSearch={() => setSearch('')}
              icon="💳"
              title="No payout requests found"
              description={search || statusFilter ? 'Try adjusting your search criteria or resetting filters.' : 'All agent commission withdrawals have been processed.'}
            />
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Payout No</th>
                    <th>Agent Profile</th>
                    <th>Gross Amount</th>
                    <th>10% TDS</th>
                    <th>Net Payable</th>
                    <th>Disbursement Account</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: 20 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => {
                    const isPending = p.status === 'pending'
                    const isCompleted = p.status === 'completed'
                    const isRejected = p.status === 'rejected'

                    return (
                      <tr key={p.id} style={{ transition: 'background 0.15s' }}>
                        {/* Payout No */}
                        <td style={{ paddingLeft: 20 }}>
                          <span style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: 13,
                            fontWeight: 800,
                            color: '#00B875',
                            background: 'rgba(0, 184, 117, 0.08)',
                            border: '1px solid rgba(0, 184, 117, 0.2)',
                            padding: '3px 8px',
                            borderRadius: 6,
                            display: 'inline-block'
                          }}>
                            {p.payout_no}
                          </span>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                            {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}
                          </div>
                        </td>

                        {/* Agent Profile */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: 'linear-gradient(135deg, #00B875 0%, #0284c7 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 12.5,
                              flexShrink: 0
                            }}>
                              {getInitials(p.agent?.user?.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13.5 }}>
                                {p.agent?.user?.name || `Agent #${p.agent_id}`}
                              </div>
                              <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--admin-text-muted)', marginTop: 1 }}>
                                {p.agent?.agent_code || 'AGT-N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Gross Amount */}
                        <td>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--admin-text)' }}>
                            ৳{parseFloat(p.gross_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* 10% TDS */}
                        <td>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#D97706',
                            background: 'rgba(245, 158, 11, 0.1)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            display: 'inline-block'
                          }}>
                            - ৳{parseFloat(p.tds_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Net Payable */}
                        <td>
                          <span style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: '#00B875',
                            display: 'inline-block'
                          }}>
                            ৳{parseFloat(p.net_payable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Disbursement Account */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              background: 'var(--admin-bg)',
                              border: '1px solid var(--admin-border)',
                              padding: '2px 6px',
                              borderRadius: 4,
                              color: 'var(--admin-text)'
                            }}>
                              {p.payout_method}
                            </span>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--admin-text)' }}>
                              {p.account_details?.account_number || 'N/A'}
                            </span>
                          </div>
                          {p.account_details?.bank_name && (
                            <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                              {p.account_details.bank_name}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 10px',
                              borderRadius: 20,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : isRejected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: isCompleted ? '#059669' : isRejected ? '#DC2626' : '#D97706',
                              border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : isRejected ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            <span style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: isCompleted ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B',
                              boxShadow: `0 0 6px ${isCompleted ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B'}`
                            }} />
                            {isCompleted ? 'Settled' : isRejected ? 'Rejected' : 'Pending'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right', paddingRight: 20 }}>
                          {isPending ? (
                            <button
                              onClick={() => {
                                setSettlingPayout(p)
                                setModalError(null)
                              }}
                              className="admin-btn admin-btn-sm admin-btn-primary"
                              style={{
                                height: 32,
                                padding: '0 14px',
                                fontSize: 12,
                                fontWeight: 700,
                                borderRadius: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                boxShadow: '0 2px 8px rgba(0, 184, 117, 0.25)'
                              }}
                            >
                              <CheckCircle2 size={13} />
                              <span>Settle Payout</span>
                            </button>
                          ) : (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 700, color: 'var(--admin-text)' }}>
                                {p.transaction_reference || 'Settled'}
                              </span>
                              <span style={{ fontSize: 10.5, color: '#10B981', fontWeight: 600 }}>
                                ✓ 3-Leg Ledger Posted
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Table Footer & Pagination ── */}
        {!loading && payouts.length > 0 && (
          <TableFooter
            total={total}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            perPage={perPage}
            setPerPage={setPerPage}
          />
        )}
      </div>

      {/* ── Settle Payout Modal ── */}
      {settlingPayout && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1060,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setSettlingPayout(null)
          }}
        >
          <div 
            style={{
              background: 'var(--admin-card-bg, #FFFFFF)',
              border: '1px solid var(--admin-border, #E2E8F0)',
              borderRadius: 20,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--admin-border, #E2E8F0)',
              background: 'var(--admin-bg, #F8FAFC)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #00B875 0%, #0284c7 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 184, 117, 0.3)'
                }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                    Confirm Payout Settlement
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-text-muted, #64748B)' }}>
                    Payout Ref: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00B875' }}>{settlingPayout.payout_no}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSettlingPayout(null)}
                disabled={submitting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--admin-text-muted, #94A3B8)',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 8,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {modalError && (
                <div style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#FEF2F2',
                  border: '1px solid #FECDD3',
                  color: '#B91C1C',
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Financial Voucher Breakdown */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 184, 117, 0.08) 0%, rgba(2, 132, 199, 0.08) 100%)',
                border: '1px solid rgba(0, 184, 117, 0.25)',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 20
              }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--admin-text-muted, #64748B)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>
                  Double-Entry Settlement Breakdown
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text, #0F172A)' }}>
                    <span>Agent Gross Claim:</span>
                    <span style={{ fontWeight: 700 }}>৳{parseFloat(settlingPayout.gross_amount).toFixed(2)} BDT</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706' }}>
                    <span>10% TDS (Credit to NBR Tax Liability):</span>
                    <span style={{ fontWeight: 700 }}>- ৳{parseFloat(settlingPayout.tds_amount).toFixed(2)} BDT</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    marginTop: 4,
                    borderTop: '1px dashed rgba(0, 184, 117, 0.3)',
                    color: '#00B875',
                    fontSize: 14,
                    fontWeight: 900
                  }}>
                    <span>Net Bank / MFS Outflow:</span>
                    <span>৳{parseFloat(settlingPayout.net_payable_amount).toFixed(2)} BDT</span>
                  </div>
                </div>

                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: 11.5, color: 'var(--admin-text-muted, #64748B)' }}>
                  Payable to: <strong>{settlingPayout.payout_method?.toUpperCase()}</strong> • Account: <strong>{settlingPayout.account_details?.account_number}</strong>
                </div>
              </div>

              {/* Settlement Form */}
              <form onSubmit={handleSettle} id="payout-settle-form" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--admin-text-muted, #475569)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Bank / MFS Transaction Reference (TrxID) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={trxRef}
                    onChange={(e) => setTrxRef(e.target.value)}
                    placeholder="e.g. BKASH-TRX-202611-9988 or BANK-REF-00123"
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: '1.5px solid var(--admin-border, #CBD5E1)',
                      background: 'var(--admin-card-bg, #FFFFFF)',
                      color: 'var(--admin-text, #0F172A)',
                      fontSize: 13.5,
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--admin-border, #CBD5E1)'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--admin-text-muted, #475569)', marginBottom: 6 }}>
                    Disbursement Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Confirmed via City Bank / bKash Business app..."
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: '1px solid var(--admin-border, #CBD5E1)',
                      background: 'var(--admin-card-bg, #FFFFFF)',
                      color: 'var(--admin-text, #0F172A)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--admin-border, #CBD5E1)'}
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--admin-border, #E2E8F0)',
              background: 'var(--admin-bg, #F8FAFC)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12
            }}>
              <button
                type="button"
                onClick={() => setSettlingPayout(null)}
                disabled={submitting}
                style={{
                  padding: '0 18px',
                  height: 38,
                  borderRadius: 8,
                  border: '1px solid var(--admin-border, #CBD5E1)',
                  background: 'transparent',
                  color: 'var(--admin-text, #475569)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                form="payout-settle-form"
                disabled={submitting}
                className="admin-btn admin-btn-primary"
                style={{
                  height: 38,
                  padding: '0 22px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(0, 184, 117, 0.3)'
                }}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                <span>{submitting ? 'Posting 3-Leg Ledger...' : 'Confirm & Settle Payout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

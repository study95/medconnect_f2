import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertTriangle,
  Stethoscope,
  Building2,
  Users,
  ShieldCheck,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import adminAgentApi from '../../../api/adminAgentApi'
import OnboardingSplitViewer from '../../../features/adminAgent/components/OnboardingSplitViewer'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import EmptyState from '../../../components/common/EmptyState'
import { TableSkeleton } from '../../../components/common/Skeletons'
import CompactUlid from '../../../components/common/CompactUlid'
import { useDebounce } from '../../../hooks/useDebounce'

export default function OnboardingVerificationDeskPage() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [entityFilter, setEntityFilter] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [total, setTotal] = useState(0)

  const fetchQueue = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const params = {
        page: currentPage,
        per_page: perPage,
      }
      if (statusFilter) params.status = statusFilter
      if (entityFilter) params.entity_type = entityFilter
      if (debouncedSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim()

      const res = await adminAgentApi.getOnboardingQueue(params)
      setQueue(res.data || [])
      if (res.pagination) {
        setTotal(res.pagination.total || 0)
      } else {
        setTotal((res.data || []).length)
      }

      // Safely update selected request without creating a re-render loop
      setSelectedRequest((prev) => {
        if (!prev) return null
        const refreshed = (res.data || []).find((r) => r.id === prev.id)
        return refreshed || prev
      })
    } catch (err) {
      console.error('Failed to load onboarding queue:', err)
      toast.error(err?.response?.data?.message || 'Failed to fetch verification queue.', {
        id: 'onboarding-queue-error',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentPage, perPage, statusFilter, entityFilter, debouncedSearch])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, entityFilter, debouncedSearch])

  const clearFilters = () => {
    setStatusFilter('')
    setEntityFilter('')
    setSearch('')
    setCurrentPage(1)
  }

  // Live KPI Summary
  const stats = useMemo(() => {
    const totalCount = total || queue.length
    const pendingCount = queue.filter(r => r.status === 'submitted').length
    const underReviewCount = queue.filter(r => r.status === 'under_review').length
    const approvedCount = queue.filter(r => r.status === 'approved').length
    const flaggedCount = queue.filter(r => ['revision_requested', 'rejected'].includes(r.status)).length

    return { totalCount, pendingCount, underReviewCount, approvedCount, flaggedCount }
  }, [total, queue])

  const getInitials = (name) => {
    if (!name) return 'DR'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          bg: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          dot: '#10B981'
        }
      case 'rejected':
        return {
          label: 'Rejected',
          bg: 'rgba(239, 68, 68, 0.1)',
          color: '#DC2626',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          dot: '#EF4444'
        }
      case 'revision_requested':
        return {
          label: 'Revision Needed',
          bg: 'rgba(245, 158, 11, 0.1)',
          color: '#D97706',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          dot: '#F59E0B'
        }
      case 'under_review':
        return {
          label: 'Under Review',
          bg: 'rgba(59, 130, 246, 0.1)',
          color: '#2563EB',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          dot: '#3B82F6'
        }
      case 'submitted':
      default:
        return {
          label: 'Pending Verification',
          bg: 'rgba(245, 158, 11, 0.12)',
          color: '#B45309',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          dot: '#F59E0B'
        }
    }
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
              📋
            </span>
            <div>
              <h2 className="admin-page-title" style={{ color: 'var(--admin-text)', margin: 0, fontSize: 24, fontWeight: 800 }}>
                Onboarding Verification Desk
              </h2>
              <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)', margin: '4px 0 0', fontSize: 13 }}>
                Inspect doctor credentials, verify BMDC certificates, and provision live provider accounts
              </p>
            </div>
          </div>
        </div>

        <div className="admin-page-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => fetchQueue(true)}
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
            <span>Refresh Queue</span>
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
        {/* Pending Verification */}
        <div 
          onClick={() => setStatusFilter('submitted')}
          className="admin-card" 
          style={{ 
            padding: '18px 20px', 
            borderRadius: 14, 
            margin: 0,
            cursor: 'pointer',
            border: statusFilter === 'submitted' ? '2px solid #F59E0B' : '1px solid var(--admin-border)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Review
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#D97706', marginTop: 8, letterSpacing: '-0.02em' }}>
            {stats.pendingCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            <span>Awaiting BMDC verification</span>
          </div>
        </div>

        {/* Under Review */}
        <div 
          onClick={() => setStatusFilter('under_review')}
          className="admin-card" 
          style={{ 
            padding: '18px 20px', 
            borderRadius: 14, 
            margin: 0,
            cursor: 'pointer',
            border: statusFilter === 'under_review' ? '2px solid #3B82F6' : '1px solid var(--admin-border)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Under Review
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#3B82F6', marginTop: 8, letterSpacing: '-0.02em' }}>
            {stats.underReviewCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            <span>Currently being audited</span>
          </div>
        </div>

        {/* Approved & Provisioned */}
        <div 
          onClick={() => setStatusFilter('approved')}
          className="admin-card" 
          style={{ 
            padding: '18px 20px', 
            borderRadius: 14, 
            margin: 0,
            cursor: 'pointer',
            border: statusFilter === 'approved' ? '2px solid #10B981' : '1px solid var(--admin-border)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Approved
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981', marginTop: 8, letterSpacing: '-0.02em' }}>
            {stats.approvedCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            <span>Active licensed doctors</span>
          </div>
        </div>

        {/* Revisions & Flagged */}
        <div 
          onClick={() => setStatusFilter('revision_requested')}
          className="admin-card" 
          style={{ 
            padding: '18px 20px', 
            borderRadius: 14, 
            margin: 0,
            cursor: 'pointer',
            border: statusFilter === 'revision_requested' ? '2px solid #EF4444' : '1px solid var(--admin-border)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Flagged / Revision
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: stats.flaggedCount > 0 ? '#EF4444' : 'var(--admin-text)', marginTop: 8, letterSpacing: '-0.02em' }}>
            {stats.flaggedCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            <span>Returned for correction</span>
          </div>
        </div>
      </div>

      {/* ── Enterprise Toolbar ── */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search candidate by name, BMDC, phone, or request code..."
        onRefresh={() => fetchQueue(true)}
        refreshing={refreshing || loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(statusFilter || entityFilter)}
        onClearFilters={clearFilters}
        activeFilters={[
          statusFilter && { 
            key: 'status', 
            label: `Status: ${statusFilter.replace(/_/g, ' ').toUpperCase()}`, 
            onRemove: () => setStatusFilter('') 
          },
          entityFilter && {
            key: 'entity',
            label: `Type: ${entityFilter.toUpperCase()}`,
            onRemove: () => setEntityFilter('')
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
            <option value="submitted">Pending Verification</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved & Provisioned</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Entity Type
          </label>
          <select
            className="status-select"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
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
            <option value="">All Provider Types</option>
            <option value="doctor">Doctors</option>
            <option value="hospital">Hospitals</option>
          </select>
        </div>
      </ListToolbar>

      {/* ── Main Queue Table Card ── */}
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
              Provider Applications Queue
            </h3>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              background: 'rgba(0, 184, 117, 0.1)',
              color: '#00B875',
              padding: '3px 8px',
              borderRadius: 6,
            }}>
              {total} Applications
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
              Showing Page {currentPage}
            </span>
          </div>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading && queue.length === 0 ? (
            <TableSkeleton
              rowCount={6}
              columnWidths={['160px', '240px', '140px', '180px', '160px', '130px', '120px']}
              headers={['Request Code', 'Provider Candidate', 'Registration', 'Submitting Agent', 'Submission Date', 'Status', 'Actions']}
            />
          ) : queue.length === 0 ? (
            <EmptyState
              hasFilters={Boolean(statusFilter || entityFilter || search)}
              searchQuery={search}
              onClearFilters={clearFilters}
              onClearSearch={() => setSearch('')}
              icon="📋"
              title="No verification requests found"
              description={search || statusFilter ? 'Try adjusting your search criteria or resetting filters.' : 'All provider applications have been processed and settled.'}
            />
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Request Code</th>
                    <th>Provider Candidate</th>
                    <th>Registration No.</th>
                    <th>Submitting Agent</th>
                    <th>Submission Date</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((req) => {
                    const badge = getStatusBadge(req.status)
                    const payload = req.payload || {}
                    const isSelected = selectedRequest?.id === req.id

                    return (
                      <tr 
                        key={req.id} 
                        style={{ 
                          background: isSelected ? 'rgba(0, 184, 117, 0.05)' : undefined,
                          transition: 'background 0.15s' 
                        }}
                      >
                        {/* Request Code */}
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
                            {req.request_code}
                          </span>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4, textTransform: 'uppercase' }}>
                            {req.entity_type}
                          </div>
                        </td>

                        {/* Provider Candidate */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: 'linear-gradient(135deg, #00B875 0%, #0284c7 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 13,
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(0, 184, 117, 0.25)',
                            }}>
                              {getInitials(payload.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 14 }}>
                                {payload.name || 'Unnamed Candidate'}
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--admin-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{payload.degree || 'MBBS'}</span>
                                {payload.fee && <span>• ৳{payload.fee}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* BMDC Registration */}
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '4px 10px', borderRadius: 8 }}>
                            <Stethoscope size={13} color="#0284C7" />
                            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: '#0284C7' }}>
                              {payload.bmdc || payload.license_number || 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Submitting Agent */}
                        <td>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>
                              {req.agent?.user?.name || `Agent #${req.agent_id}`}
                            </div>
                            <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--admin-text-muted)', marginTop: 2 }}>
                              {req.agent?.agent_code || 'AGT-N/A'}
                            </div>
                          </div>
                        </td>

                        {/* Submission Date */}
                        <td>
                          <div style={{ fontSize: 12.5, color: 'var(--admin-text)' }}>
                            {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recent'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                            {req.created_at ? new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 12px',
                              borderRadius: 20,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: badge.bg,
                              color: badge.color,
                              border: badge.border,
                            }}
                          >
                            <span style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: badge.dot,
                              boxShadow: `0 0 6px ${badge.dot}`
                            }} />
                            {badge.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right', paddingRight: 20 }}>
                          {['approved', 'rejected', 'revoked'].includes(req.status) ? (
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="admin-btn admin-btn-sm"
                              style={{
                                height: 32,
                                padding: '0 14px',
                                fontSize: 12,
                                fontWeight: 600,
                                borderRadius: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'var(--admin-bg, #F1F5F9)',
                                border: '1px solid var(--admin-border, #CBD5E1)',
                                color: 'var(--admin-text, #334155)',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={13} />
                              <span>View Details</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedRequest(req)}
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
                                boxShadow: '0 2px 8px rgba(0, 184, 117, 0.25)',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={13} />
                              <span>Verify &amp; Review</span>
                            </button>
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
        {!loading && queue.length > 0 && (
          <TableFooter
            total={total}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            perPage={perPage}
            setPerPage={setPerPage}
          />
        )}
      </div>

      {/* ── Split-Screen Inspector Modal ── */}
      {selectedRequest && (
        <OnboardingSplitViewer
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onDecisionComplete={() => {
            setSelectedRequest(null)
            fetchQueue(true)
          }}
        />
      )}
    </div>
  )
}

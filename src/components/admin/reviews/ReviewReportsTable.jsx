import React, { memo } from 'react'
import { formatReviewDate } from '../../../features/reviews/mappers'
import { REPORT_REASONS } from '../../../features/reviews/constants'
import { ShieldAlert, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'

/**
 * Enterprise Admin Dispute Reports Queue Table Component
 */
const ReviewReportsTable = memo(function ReviewReportsTable({
  reports = [],
  isLoading = false,
  page = 1,
  setPage,
  totalPages = 1,
  statusFilter = 'pending',
  setStatusFilter,
  onResolve,
}) {
  const statusBadges = {
    pending: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
    resolved: 'bg-success-subtle text-success border border-success-subtle',
    dismissed: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
    under_review: 'bg-info-subtle text-info border border-info-subtle',
  }

  const getReasonLabel = (reasonVal) => {
    return REPORT_REASONS.find((r) => r.value === reasonVal)?.label || reasonVal || 'Dispute'
  }

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
      {/* Filter Tabs */}
      <div className="p-3 border-bottom border-light-subtle d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-1 flex-wrap">
          {[
            { key: 'pending', label: 'Pending Triage' },
            { key: 'under_review', label: 'Under Review' },
            { key: 'resolved', label: 'Resolved (Action Taken)' },
            { key: 'dismissed', label: 'Dismissed' },
            { key: '', label: 'All Reports' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key)
                setPage(1)
              }}
              className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold ${
                statusFilter === tab.key ? 'btn-primary' : 'btn-light border-light-subtle text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light text-muted small text-uppercase">
            <tr>
              <th style={{ minWidth: '150px' }}>Reporter</th>
              <th style={{ minWidth: '150px' }}>Dispute Reason</th>
              <th style={{ minWidth: '240px' }}>Explanation</th>
              <th style={{ minWidth: '200px' }}>Target Review</th>
              <th style={{ minWidth: '110px' }}>Status</th>
              <th style={{ minWidth: '110px' }}>Date</th>
              <th style={{ minWidth: '120px' }} className="text-end">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="placeholder-glow">
                  <td colSpan={7} className="py-3">
                    <span className="placeholder col-12 py-2 rounded" />
                  </td>
                </tr>
              ))
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <ShieldAlert size={36} className="mb-2 opacity-50 d-block mx-auto" />
                  <div className="fw-semibold">No dispute reports found in this queue</div>
                </td>
              </tr>
            ) : (
              reports.map((rep) => (
                <tr key={rep.public_id || rep.id}>
                  <td>
                    <div className="fw-bold text-dark">{rep.reporter?.name || 'Anonymous User'}</div>
                  </td>
                  <td>
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill extra-small">
                      {getReasonLabel(rep.reason)}
                    </span>
                  </td>
                  <td>
                    <div className="small text-dark text-truncate" style={{ maxWidth: '280px' }} title={rep.explanation}>
                      {rep.explanation}
                    </div>
                  </td>
                  <td>
                    <div className="text-muted extra-small text-truncate" style={{ maxWidth: '220px' }}>
                      {rep.review?.comment || 'Review content'}
                    </div>
                    {rep.review?.doctor?.name && (
                      <div className="extra-small text-secondary">
                        Dr. {rep.review.doctor.name}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge rounded-pill px-2 py-1 extra-small text-capitalize ${statusBadges[rep.status] || 'bg-light text-dark'}`}>
                      {rep.status}
                    </span>
                  </td>
                  <td className="small text-muted">{formatReviewDate(rep.created_at)}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      onClick={() => onResolve(rep)}
                      className="btn btn-sm btn-primary rounded-pill px-3 py-1"
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-top border-light-subtle d-flex align-items-center justify-content-between">
          <span className="small text-muted">
            Page <strong>{page}</strong> of {totalPages}
          </span>
          <div className="d-flex gap-1">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1"
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export default ReviewReportsTable

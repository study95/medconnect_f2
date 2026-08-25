import React, { memo } from 'react'
import StarRating from '../../reviews/StarRating'
import { formatReviewerName, formatReviewDate } from '../../../features/reviews/mappers'
import { CheckCircle2, XCircle, Flag, EyeOff, ShieldCheck, ChevronLeft, ChevronRight, MessageSquareOff } from 'lucide-react'

/**
 * Enterprise Admin Review Moderation Queue Table Component
 */
const ReviewModerationTable = memo(function ReviewModerationTable({
  reviews = [],
  isLoading = false,
  page = 1,
  setPage,
  totalPages = 1,
  statusFilter = 'pending',
  setStatusFilter,
  onModerate,
}) {
  const statusBadges = {
    pending: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
    approved: 'bg-success-subtle text-success border border-success-subtle',
    rejected: 'bg-danger-subtle text-danger border border-danger-subtle',
    hidden: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
    flagged: 'bg-danger text-white',
  }

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
      {/* Header Toolbar: Status Filter Tabs */}
      <div className="p-3 border-bottom border-light-subtle d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-1 flex-wrap">
          {[
            { key: 'pending', label: 'Pending Approval' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'flagged', label: 'Flagged / Disputed' },
            { key: '', label: 'All Reviews' },
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
              <th style={{ minWidth: '160px' }}>Reviewer</th>
              <th style={{ minWidth: '180px' }}>Target Provider</th>
              <th style={{ minWidth: '120px' }}>Rating</th>
              <th style={{ minWidth: '240px' }}>Comment Excerpt</th>
              <th style={{ minWidth: '100px' }}>Status</th>
              <th style={{ minWidth: '120px' }}>Date</th>
              <th style={{ minWidth: '140px' }} className="text-end">
                Actions
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
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <MessageSquareOff size={36} className="mb-2 opacity-50 d-block mx-auto" />
                  <div className="fw-semibold">No reviews found in this moderation queue</div>
                </td>
              </tr>
            ) : (
              reviews.map((rev) => {
                const isAnonymous = Boolean(rev.is_anonymous)
                const reviewerName = formatReviewerName(rev)

                return (
                  <tr key={rev.public_id || rev.id}>
                    <td>
                      <div className="fw-bold text-dark">{reviewerName}</div>
                      {isAnonymous && (
                        <span className="badge bg-secondary-subtle text-secondary rounded-pill extra-small d-inline-flex align-items-center gap-1">
                          <ShieldCheck size={11} />
                          Anonymous
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">Dr. {rev.doctor?.name || 'N/A'}</div>
                      <div className="text-muted extra-small">{rev.hospital?.name || rev.chamber?.name || 'Chamber'}</div>
                    </td>
                    <td>
                      <StarRating rating={rev.rating} size={14} showValue />
                    </td>
                    <td>
                      {rev.title && <div className="fw-semibold text-dark small">{rev.title}</div>}
                      <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>
                        {rev.comment}
                      </div>
                    </td>
                    <td>
                      <span className={`badge rounded-pill px-2 py-1 extra-small text-capitalize ${statusBadges[rev.status] || 'bg-light text-dark'}`}>
                        {rev.status}
                      </span>
                    </td>
                    <td className="small text-muted">{formatReviewDate(rev.created_at)}</td>
                    <td className="text-end">
                      <div className="d-inline-flex align-items-center gap-1">
                        {rev.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => onModerate(rev, 'approve')}
                            className="btn btn-sm btn-outline-success rounded-circle p-1"
                            title="Approve Review"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {rev.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => onModerate(rev, 'reject')}
                            className="btn btn-sm btn-outline-danger rounded-circle p-1"
                            title="Reject Review"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        {rev.status !== 'flagged' && (
                          <button
                            type="button"
                            onClick={() => onModerate(rev, 'flag')}
                            className="btn btn-sm btn-outline-warning rounded-circle p-1"
                            title="Flag Review"
                          >
                            <Flag size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
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

export default ReviewModerationTable

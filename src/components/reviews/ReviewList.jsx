import React, { useState, useMemo, memo } from 'react'
import RatingBreakdown from './RatingBreakdown'
import ReviewCard from './ReviewCard'
import ReviewSkeleton from './ReviewSkeleton'
import { useDoctorReviews, useHospitalReviews } from '../../features/reviews/useReviews'
import { REVIEW_SORT_OPTIONS } from '../../features/reviews/constants'
import { MessageSquarePlus, MessageSquareOff, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Enterprise Review List Component
 * Manages filtering, sorting, pagination, breakdown statistics, and review card feeds.
 */
const ReviewList = memo(function ReviewList({
  doctorId = null,
  hospitalId = null,
  currentUser = null,
  onReply,
  onEdit,
  onDelete,
  onReport,
  onWriteReview,
  canWrite = false,
  className = '',
}) {
  const [selectedStar, setSelectedStar] = useState(null)
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)

  const filterParams = useMemo(() => {
    const params = {
      page,
      sort: sortBy,
    }
    if (selectedStar) {
      params.rating = selectedStar
    }
    return params
  }, [page, sortBy, selectedStar])

  // Consume appropriate hook based on entity context
  const doctorQuery = useDoctorReviews(doctorId, filterParams, { enabled: Boolean(doctorId) })
  const hospitalQuery = useHospitalReviews(hospitalId, filterParams, { enabled: Boolean(hospitalId && !doctorId) })

  const activeQuery = doctorId ? doctorQuery : hospitalQuery

  const { data, isLoading, isError, error, refetch, isFetching } = activeQuery

  const reviews = useMemo(() => {
    if (!data) return []
    return Array.isArray(data) ? data : data.data || []
  }, [data])

  const meta = data?.meta || data?.pagination || null
  const totalPages = meta?.last_page || 1

  const handleStarFilter = (star) => {
    setSelectedStar(star)
    setPage(1)
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setPage(1)
  }

  return (
    <div className={`review-list-container ${className}`}>
      {/* Header with Title and "Write a Review" Action */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Patient Reviews & Feedback</h4>
          <p className="text-muted small mb-0">Verified consultations and patient experiences</p>
        </div>

        {canWrite && onWriteReview && (
          <button
            type="button"
            onClick={onWriteReview}
            className="btn btn-primary rounded-pill d-inline-flex align-items-center gap-2 px-4 py-2 shadow-sm"
          >
            <MessageSquarePlus size={18} />
            Write a Review
          </button>
        )}
      </div>

      {/* Loading State Skeleton */}
      {isLoading ? (
        <ReviewSkeleton count={3} showBreakdown={true} />
      ) : isError ? (
        /* Error State */
        <div className="alert alert-danger rounded-4 p-4 d-flex align-items-center justify-content-between" role="alert">
          <div className="d-flex align-items-center gap-3">
            <AlertCircle size={24} className="text-danger flex-shrink-0" />
            <div>
              <h6 className="fw-bold mb-1">Unable to Load Reviews</h6>
              <p className="small mb-0 text-secondary">
                {error?.response?.data?.message || 'A network error occurred while retrieving review records.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-sm btn-outline-danger rounded-pill d-inline-flex align-items-center gap-1"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Rating Breakdown & Star Bar Component */}
          <RatingBreakdown
            reviews={reviews}
            selectedStar={selectedStar}
            onFilterByStar={handleStarFilter}
            className="mb-4"
          />

          {/* Filter & Sort Controls Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 pb-2 border-bottom border-light-subtle">
            {/* Star Filter Pills */}
            <div className="d-flex align-items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleStarFilter(null)}
                className={`btn btn-sm rounded-pill px-3 py-1 ${
                  selectedStar === null ? 'btn-primary' : 'btn-outline-secondary border-light-subtle'
                }`}
              >
                All Stars
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarFilter(star)}
                  className={`btn btn-sm rounded-pill px-3 py-1 ${
                    selectedStar === star ? 'btn-primary' : 'btn-outline-secondary border-light-subtle'
                  }`}
                >
                  {star} ★
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="review-sort-select" className="small text-muted mb-0 text-nowrap">
                Sort by:
              </label>
              <select
                id="review-sort-select"
                value={sortBy}
                onChange={handleSortChange}
                className="form-select form-select-sm rounded-3 border-light-subtle"
                style={{ width: '160px' }}
              >
                {REVIEW_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Review Feed */}
          {reviews.length === 0 ? (
            /* Empty State */
            <div className="text-center py-5 rounded-4 bg-light border border-light-subtle my-3">
              <MessageSquareOff size={48} className="text-muted mb-3 opacity-50" />
              <h6 className="fw-bold text-dark mb-1">No Reviews Found</h6>
              <p className="text-muted small mb-3">
                {selectedStar
                  ? `There are no ${selectedStar}-star reviews matching your current filter.`
                  : 'Be the first verified patient to share your consultation experience.'}
              </p>
              {selectedStar && (
                <button
                  type="button"
                  onClick={() => handleStarFilter(null)}
                  className="btn btn-sm btn-outline-primary rounded-pill px-3"
                >
                  Clear Star Filter
                </button>
              )}
            </div>
          ) : (
            <div className={`reviews-feed-wrapper ${isFetching ? 'opacity-75' : ''}`}>
              {reviews.map((review) => (
                <ReviewCard
                  key={review.public_id || review.id}
                  review={review}
                  currentUser={currentUser}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReport={onReport}
                />
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="d-flex align-items-center justify-content-center gap-2 mt-4 pt-3 border-top border-light-subtle">
                  <button
                    type="button"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <span className="small text-muted px-2">
                    Page <strong className="text-dark">{page}</strong> of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
})

export default ReviewList

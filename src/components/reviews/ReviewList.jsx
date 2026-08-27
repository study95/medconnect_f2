import React, { useState, useMemo, memo } from 'react'
import RatingBreakdown from './RatingBreakdown'
import ReviewCard from './ReviewCard'
import ReviewSkeleton from './ReviewSkeleton'
import { useDoctorReviews, useHospitalReviews } from '../../features/reviews/useReviews'
import { REVIEW_SORT_OPTIONS } from '../../features/reviews/constants'
import { getReviewErrorMessage } from '../../features/reviews/mappers'
import {
  MessageSquarePlus,
  MessageSquareOff,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
  Lock,
  CheckCircle,
  Edit3,
  LogIn,
} from 'lucide-react'

/**
 * Enterprise Review List Component
 * Manages filtering, sorting, pagination, breakdown statistics, entry point CTAs, and review feeds.
 */
const ReviewList = memo(function ReviewList({
  doctorId = null,
  hospitalId = null,
  currentUser = null,
  isLoggedIn = false,
  isEligible = false,
  hasReviewed = false,
  onReply,
  onEdit,
  onDelete,
  onReport,
  onWriteReview,
  onLoginClick,
  canWrite = false,
  showReplyFilter = false,
  className = '',
}) {
  const [selectedStar, setSelectedStar] = useState(null)
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [replyFilter, setReplyFilter] = useState('all') // 'all' | 'needs_reply' | 'replied'

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

  const displayedReviews = useMemo(() => {
    if (replyFilter === 'needs_reply') {
      return reviews.filter(
        (r) => !r.doctor_reply && !r.doctorReply && !r.hospital_reply && !r.hospitalReply
      )
    }
    if (replyFilter === 'replied') {
      return reviews.filter(
        (r) => Boolean(r.doctor_reply || r.doctorReply || r.hospital_reply || r.hospitalReply)
      )
    }
    return reviews
  }, [reviews, replyFilter])

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
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">রোগীর মতামত ও রিভিউ</h4>
          <p className="text-muted small mb-0">যাচাইকৃত অ্যাপয়েন্টমেন্ট ও রোগীদের বাস্তব অভিজ্ঞতা</p>
        </div>

        {/* Feature 1 — Enterprise Entry Point CTA */}
        <div>
          {!isLoggedIn ? (
            <button
              type="button"
              onClick={onLoginClick || onWriteReview}
              className="btn btn-outline-primary rounded-pill d-inline-flex align-items-center gap-2 px-4 py-2 shadow-sm fw-semibold"
            >
              <LogIn size={16} />
              লগইন করে রিভিউ দিন
            </button>
          ) : hasReviewed ? (
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-2 small d-inline-flex align-items-center gap-1">
                <CheckCircle size={14} />
                আপনার রিভিউ
              </span>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit?.()}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                >
                  <Edit3 size={14} />
                  সম্পাদনা করুন
                </button>
              )}
            </div>
          ) : isEligible ? (
            <button
              type="button"
              onClick={onWriteReview}
              className="btn btn-primary rounded-pill d-inline-flex align-items-center gap-2 px-4 py-2 shadow-sm fw-semibold"
            >
              <Star size={16} fill="currentColor" />
              রিভিউ লিখুন
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="btn btn-light border text-muted rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2"
              title="শুধুমাত্র চিকিৎসা গ্রহণ করা রোগীরাই রিভিউ দিতে পারবেন।"
              style={{ cursor: 'not-allowed', opacity: 0.8, fontSize: '0.85rem' }}
            >
              <Lock size={14} />
              রিভিউ দেওয়ার জন্য চিকিৎসা সম্পন্ন করুন
            </button>
          )}
        </div>
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
              <h6 className="fw-bold mb-1">রিভিউ লোড করা সম্ভব হয়নি</h6>
              <p className="small mb-0 text-secondary">
                {getReviewErrorMessage(error)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-sm btn-outline-danger rounded-pill d-inline-flex align-items-center gap-1"
          >
            <RefreshCw size={14} />
            আবার চেষ্টা করুন
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

          {/* Feature 3 — Enterprise Review Invitation Card */}
          {isLoggedIn && isEligible && !hasReviewed && onWriteReview && (
            <div
              className="card border-0 rounded-4 p-4 mb-4 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                border: '1.5px solid #86EFAC',
              }}
            >
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <div className="text-warning mb-1 fs-5">★★★★★</div>
                  <h6 className="fw-bold text-dark mb-1">
                    আপনার চিকিৎসার অভিজ্ঞতা অন্য রোগীদের সঠিক ডাক্তার নির্বাচন করতে সাহায্য করবে।
                  </h6>
                  <p className="text-muted small mb-0">
                    আপনার মূল্যবান মতামত শেয়ার করে স্বাস্থ্যসেবা উন্নত করতে সাহায্য করুন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onWriteReview}
                  className="btn btn-success rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                >
                  <MessageSquarePlus size={18} />
                  রিভিউ লিখুন
                </button>
              </div>
            </div>
          )}

          {/* Feature 8K: Review Management Quick Filters (All, Needs Reply, Replied) */}
          {Boolean(showReplyFilter) && (
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom border-light-subtle flex-wrap">
              <span className="small fw-bold text-dark me-2">ম্যানেজমেন্ট ফিল্টার:</span>
              {[
                { key: 'all', label: 'All (সবগুলো)', count: reviews.length },
                {
                  key: 'needs_reply',
                  label: 'Needs Reply (উত্তর প্রয়োজন)',
                  count: reviews.filter(
                    (r) => !r.doctor_reply && !r.doctorReply && !r.hospital_reply && !r.hospitalReply
                  ).length,
                },
                {
                  key: 'replied',
                  label: 'Replied (উত্তর সম্পন্ন)',
                  count: reviews.filter(
                    (r) => Boolean(r.doctor_reply || r.doctorReply || r.hospital_reply || r.hospitalReply)
                  ).length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setReplyFilter(tab.key)}
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1 ${
                    replyFilter === tab.key
                      ? 'btn-dark text-white shadow-sm'
                      : 'btn-light border-light-subtle text-secondary'
                  }`}
                >
                  {tab.label}
                  <span className="badge bg-secondary-subtle text-dark rounded-pill extra-small ms-1">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Filter & Sort Controls Toolbar */}
          <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-3 mb-4 pb-2 border-bottom border-light-subtle">
            {/* Star Filter Pills with Horizontal Scroll on Mobile */}
            <div className="d-flex align-items-center gap-1.5 overflow-auto pb-1 pb-sm-0 flex-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
              <button
                type="button"
                onClick={() => handleStarFilter(null)}
                className={`btn btn-sm rounded-pill px-3 py-1 text-nowrap flex-shrink-0 ${
                  selectedStar === null ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary border-light-subtle'
                }`}
                style={{
                  backgroundColor: selectedStar === null ? '#00B875' : 'transparent',
                  borderColor: selectedStar === null ? '#00B875' : '#E2E8F0',
                  fontSize: '12.5px',
                  fontWeight: 700
                }}
              >
                সকল রেটিং
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarFilter(star)}
                  className={`btn btn-sm rounded-pill px-2.5 py-1 text-nowrap flex-shrink-0 ${
                    selectedStar === star ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary border-light-subtle'
                  }`}
                  style={{
                    backgroundColor: selectedStar === star ? '#00B875' : 'transparent',
                    borderColor: selectedStar === star ? '#00B875' : '#E2E8F0',
                    fontSize: '12.5px',
                    fontWeight: 700
                  }}
                >
                  {star} ★
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="d-flex align-items-center justify-content-end gap-2 flex-shrink-0">
              <label htmlFor="review-sort-select" className="small text-muted mb-0 text-nowrap" style={{ fontSize: '12.5px', fontWeight: 600 }}>
                সাজান:
              </label>
              <select
                id="review-sort-select"
                value={sortBy}
                onChange={handleSortChange}
                className="form-select form-select-sm rounded-3 border-light-subtle shadow-none"
                style={{ width: '140px', fontSize: '12.5px' }}
              >
                {REVIEW_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feature 4 — Review Feed & Empty States */}
          {displayedReviews.length === 0 ? (
            /* Empty State */
            <div className="text-center py-5 rounded-4 bg-light border border-light-subtle my-3 px-3">
              <MessageSquareOff size={48} className="text-muted mb-3 opacity-50" />
              <h6 className="fw-bold text-dark mb-2">এখনও কোনো রোগী রিভিউ দেননি</h6>
              <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '440px' }}>
                {replyFilter !== 'all'
                  ? `আপনার নির্বাচিত ফিল্টারের সাথে মেলেনি এমন কোনো রিভিউ নেই।`
                  : selectedStar
                  ? `${selectedStar}-তারকার কোনো রিভিউ আপনার ফিল্টারের সাথে মেলেনি।`
                  : !isLoggedIn
                  ? 'লগইন করে আপনার চিকিৎসার অভিজ্ঞতা শেয়ার করুন এবং অন্যান্য রোগীদের সাহায্য করুন।'
                  : isEligible && !hasReviewed
                  ? 'প্রথম রোগী হিসেবে আপনার চিকিৎসার অভিজ্ঞতা সবার সাথে শেয়ার করুন।'
                  : 'চিকিৎসা সম্পন্ন হওয়ার পর রোগীরা এখানে তাদের রিভিউ প্রদান করতে পারেন।'}
              </p>

              {replyFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setReplyFilter('all')}
                  className="btn btn-sm btn-outline-primary rounded-pill px-4 py-2"
                >
                  সকল রিভিউ দেখুন
                </button>
              ) : selectedStar ? (
                <button
                  type="button"
                  onClick={() => handleStarFilter(null)}
                  className="btn btn-sm btn-outline-primary rounded-pill px-4 py-2"
                >
                  ফিল্টার মুছুন
                </button>
              ) : !isLoggedIn ? (
                <button
                  type="button"
                  onClick={onLoginClick || onWriteReview}
                  className="btn btn-primary rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2 shadow-sm"
                >
                  <LogIn size={16} />
                  লগইন করে আপনার চিকিৎসার অভিজ্ঞতা শেয়ার করুন
                </button>
              ) : isEligible && !hasReviewed && onWriteReview ? (
                <button
                  type="button"
                  onClick={onWriteReview}
                  className="btn btn-primary rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2 shadow-sm"
                >
                  <MessageSquarePlus size={16} />
                  প্রথম রিভিউটি লিখুন
                </button>
              ) : null}
            </div>
          ) : (
            <div className={`reviews-feed-wrapper ${isFetching ? 'opacity-75' : ''}`}>
              {displayedReviews.map((review) => (
                <ReviewCard
                  key={review.public_id || review.id}
                  review={review}
                  currentUser={currentUser}
                  showManagementStatus={showReplyFilter}
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
                    পূর্ববর্তী
                  </button>

                  <span className="small text-muted px-2">
                    পৃষ্ঠা <strong className="text-dark">{page}</strong> / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1"
                  >
                    পরবর্তী
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

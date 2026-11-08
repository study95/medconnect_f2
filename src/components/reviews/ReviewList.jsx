import React, { useState, useEffect, useRef, useMemo, memo } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedStar, setSelectedStar] = useState(() => searchParams.get('rev_rating') ? Number(searchParams.get('rev_rating')) : null)
  const [sortBy, setSortBy] = useState(() => searchParams.get('rev_sort') || 'newest')
  const [page, setPage] = useState(() => Math.max(1, parseInt(searchParams.get('rev_page') || '1', 10)))
  const [replyFilter, setReplyFilter] = useState(() => searchParams.get('rev_reply') || 'all') // 'all' | 'needs_reply' | 'replied'

  const isSyncingFromUrlRef = useRef(false)
  const prevParamsRef = useRef(searchParams.toString())

  useEffect(() => {
    const currentStr = searchParams.toString()
    if (prevParamsRef.current === currentStr) return
    prevParamsRef.current = currentStr
    isSyncingFromUrlRef.current = true

    const rStar = searchParams.get('rev_rating') ? Number(searchParams.get('rev_rating')) : null
    const rSort = searchParams.get('rev_sort') || 'newest'
    const rPage = Math.max(1, parseInt(searchParams.get('rev_page') || '1', 10))
    const rReply = searchParams.get('rev_reply') || 'all'

    setSelectedStar(rStar)
    setSortBy(rSort)
    setPage(rPage)
    setReplyFilter(rReply)
  }, [searchParams])

  useEffect(() => {
    if (isSyncingFromUrlRef.current) {
      isSyncingFromUrlRef.current = false
      return
    }

    const params = new URLSearchParams(searchParams)
    if (selectedStar) params.set('rev_rating', String(selectedStar))
    else params.delete('rev_rating')

    if (sortBy && sortBy !== 'newest') params.set('rev_sort', sortBy)
    else params.delete('rev_sort')

    if (page > 1) params.set('rev_page', String(page))
    else params.delete('rev_page')

    if (replyFilter && replyFilter !== 'all') params.set('rev_reply', replyFilter)
    else params.delete('rev_reply')

    const newQueryStr = params.toString()
    if (newQueryStr !== searchParams.toString()) {
      prevParamsRef.current = newQueryStr
      setSearchParams(params, { replace: true })
    }
  }, [selectedStar, sortBy, page, replyFilter, searchParams, setSearchParams])

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

  const [cachedAllReviews, setCachedAllReviews] = useState([])

  useEffect(() => {
    if (!selectedStar && reviews.length > 0) {
      setCachedAllReviews(reviews)
    }
  }, [selectedStar, reviews])

  const breakdownReviews = (!selectedStar || cachedAllReviews.length === 0) ? reviews : cachedAllReviews

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
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2.5 mb-3 mb-md-4">
        <div>
          <h4 className="fw-bold text-dark mb-0.5" style={{ fontSize: 'clamp(1.15rem, 3vw, 1.4rem)' }}>
            {hospitalId ? 'হাসপাতালের মূল্যায়ন ও রোগীর মতামত' : 'রোগীর মতামত ও রিভিউ'}
          </h4>
          <p className="text-muted small mb-0" style={{ fontSize: '12.5px' }}>
            {hospitalId
              ? 'হাসপাতালের পরিবেশ, পরিচ্ছন্নতা ও সার্বিক সেবা সম্পর্কে রোগীদের বাস্তব অভিজ্ঞতা'
              : 'যাচাইকৃত অ্যাপয়েন্টমেন্ট ও রোগীদের বাস্তব অভিজ্ঞতা'}
          </p>
        </div>

        {/* Feature 1 — Enterprise Entry Point CTA */}
        <div className="ms-auto ms-sm-0">
          {!isLoggedIn ? (
            <button
              type="button"
              onClick={onLoginClick || onWriteReview}
              className="btn btn-sm rounded-pill d-inline-flex align-items-center gap-1.5 px-3.5 py-1.5 shadow-sm fw-semibold"
              style={{
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                fontSize: '12.5px'
              }}
            >
              <LogIn size={14} />
              লগইন করে রিভিউ দিন
            </button>
          ) : hasReviewed ? (
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span 
                className="badge rounded-pill px-3 py-1.5 small d-inline-flex align-items-center gap-1"
                style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '12px' }}
              >
                <CheckCircle size={13} />
                আপনার রিভিউ
              </span>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit?.()}
                  className="btn btn-sm rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                  style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '12px' }}
                >
                  <Edit3 size={13} />
                  সম্পাদনা করুন
                </button>
              )}
            </div>
          ) : (canWrite || isEligible || Boolean(hospitalId)) ? (
            <button
              type="button"
              onClick={onWriteReview}
              className="btn btn-sm rounded-pill d-inline-flex align-items-center gap-1.5 px-3.5 py-1.5 shadow-sm fw-semibold text-white"
              style={{ backgroundColor: '#00B875', border: '1px solid #00B875', fontSize: '13px' }}
            >
              <Star size={14} fill="currentColor" />
              {hospitalId ? 'হাসপাতাল রিভিউ লিখুন' : 'রিভিউ লিখুন'}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="btn btn-light border text-muted rounded-pill d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
              title="শুধুমাত্র চিকিৎসা গ্রহণ করা রোগীরাই রিভিউ দিতে পারবেন।"
              style={{ cursor: 'not-allowed', opacity: 0.85, fontSize: '0.8rem' }}
            >
              <Lock size={13} />
              রিভিউ দিতে চিকিৎসা সম্পন্ন করুন
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
            reviews={breakdownReviews}
            selectedStar={selectedStar}
            onFilterByStar={handleStarFilter}
            isHospital={Boolean(hospitalId)}
            className="mb-3"
          />

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
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5 mt-2 mt-md-3 mb-3.5 mb-md-4 pb-2.5 border-bottom border-light-subtle">
            {/* Star Filter Pills with Horizontal Scroll on Mobile */}
            <div className="d-flex align-items-center gap-1.5 overflow-auto pb-1 flex-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
              <button
                type="button"
                onClick={() => handleStarFilter(null)}
                className="btn btn-sm rounded-pill text-nowrap flex-shrink-0 transition"
                style={{
                  backgroundColor: selectedStar === null ? '#00B875' : '#F1F5F9',
                  color: selectedStar === null ? '#FFFFFF' : '#475569',
                  border: '1px solid',
                  borderColor: selectedStar === null ? '#00B875' : '#E2E8F0',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: selectedStar === null ? 700 : 600,
                  boxShadow: selectedStar === null ? '0 2px 6px rgba(0, 184, 117, 0.25)' : 'none'
                }}
              >
                সকল
              </button>
              {[5, 4, 3, 2, 1].map((star) => {
                const isSelected = selectedStar === star
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarFilter(star)}
                    className="btn btn-sm rounded-pill text-nowrap flex-shrink-0 transition"
                    style={{
                      backgroundColor: isSelected ? '#00B875' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      border: '1px solid',
                      borderColor: isSelected ? '#00B875' : '#E2E8F0',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 600,
                      boxShadow: isSelected ? '0 2px 6px rgba(0, 184, 117, 0.25)' : 'none'
                    }}
                  >
                    {star} ★
                  </button>
                )
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="d-flex align-items-center gap-1.5 ms-auto flex-shrink-0">
              <span className="text-muted d-none d-sm-inline" style={{ fontSize: '12px', fontWeight: 600 }}>
                সাজান:
              </span>
              <select
                id="review-sort-select"
                value={sortBy}
                onChange={handleSortChange}
                className="form-select form-select-sm rounded-pill border-light-subtle shadow-none py-1 ps-2.5 pe-4"
                style={{ 
                  fontSize: '12px', 
                  fontWeight: 600,
                  color: '#334155',
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  cursor: 'pointer'
                }}
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
              <h6 className="fw-bold text-dark mb-2">
                {selectedStar
                  ? `${selectedStar}-তারকার কোনো রিভিউ পাওয়া যায়নি`
                  : replyFilter !== 'all'
                  ? 'ফিল্টার অনুযায়ী কোনো রিভিউ পাওয়া যায়নি'
                  : 'এখনও কোনো রোগী রিভিউ দেননি'}
              </h6>
              <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '440px' }}>
                {replyFilter !== 'all'
                  ? `আপনার নির্বাচিত ফিল্টারের সাথে মেলেনি এমন কোনো রিভিউ নেই।`
                  : selectedStar
                  ? `${selectedStar}-তারকার কোনো রিভিউ পাওয়া যায়নি। অন্যান্য রেটিং বা সব রিভিউ দেখতে ফিল্টার ক্লিয়ার করুন।`
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
                  className="btn btn-sm rounded-pill px-4 py-2 text-white fw-semibold"
                  style={{ backgroundColor: '#00B875', border: '1px solid #00B875' }}
                >
                  সকল রিভিউ দেখুন
                </button>
              ) : selectedStar ? (
                <button
                  type="button"
                  onClick={() => handleStarFilter(null)}
                  className="btn btn-sm rounded-pill px-4 py-2 text-white fw-semibold shadow-sm"
                  style={{ backgroundColor: '#00B875', border: '1px solid #00B875' }}
                >
                  ফিল্টার মুছুন (সকল রিভিউ দেখুন)
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
                  isHospital={Boolean(hospitalId)}
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

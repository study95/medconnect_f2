import React, { memo, useState } from 'react'
import StarRating from './StarRating'
import {
  formatReviewerName,
  formatReviewDate,
} from '../../features/reviews/mappers'
import {
  canEditReview,
  canDeleteReview,
  canReply,
} from '../../features/reviews/permissions'
import { getMediaUrl } from '../../utils/mediaUtils'
import {
  ShieldCheck,
  UserCheck,
  CornerDownRight,
  Flag,
  Edit2,
  Trash2,
  MessageSquare,
  Sparkles,
  Users,
  Clock,
  CheckCircle2,
} from 'lucide-react'

/**
 * Enterprise Review Card Component
 * Displays verified patient reviews, sub-dimension tags, anonymous masking, and official replies.
 */
const ReviewCard = memo(function ReviewCard({
  review,
  currentUser = null,
  showManagementStatus = false,
  onReply,
  onEdit,
  onDelete,
  onReport,
  className = '',
}) {
  const [imageError, setImageError] = useState(false)
  if (!review) return null

  const reviewerName = formatReviewerName(review)
  const isAnonymous = Boolean(review.reviewer?.is_anonymous ?? review.is_anonymous)
  const reviewerPhoto = review.reviewer?.avatar || review.reviewer?.photo || review.user?.avatar || review.user?.photo
  const isVerified = review.appointment_id || review.verified_patient !== false

  const allowEdit = canEditReview(currentUser, review)
  const allowDelete = canDeleteReview(currentUser, review)
  const allowReply = canReply(currentUser, review)

  const doctorReply = review.doctor_reply || review.doctorReply
  const hospitalReply = review.hospital_reply || review.hospitalReply

  return (
    <div className={`card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white mb-3 ${className}`} style={{ border: '1px solid #E2E8F0' }}>
      {/* Header: Reviewer Info + Star Rating */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-3">
          {/* Avatar Icon / Image */}
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold overflow-hidden ${
              isAnonymous ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-dark'
            }`}
            style={{ width: '40px', height: '40px', fontSize: '0.95rem', flexShrink: 0 }}
            aria-hidden="true"
          >
            {isAnonymous ? (
              <ShieldCheck size={20} />
            ) : reviewerPhoto && !imageError ? (
              <img
                src={getMediaUrl(reviewerPhoto)}
                alt={reviewerName}
                className="w-100 h-100 object-fit-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              reviewerName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Name & Metadata */}
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '14.5px' }}>{reviewerName}</h6>
              {isVerified && (
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill d-inline-flex align-items-center gap-1 extra-small px-2 py-0.5" style={{ fontSize: '11px' }}>
                  <UserCheck size={11} />
                  যাচাইকৃত রোগী
                </span>
              )}
              {review.status === 'pending' && (
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill d-inline-flex align-items-center gap-1 extra-small px-2 py-0.5" style={{ fontSize: '11px' }}>
                  <Clock size={11} />
                  মূল্যায়নাধীন
                </span>
              )}
            </div>
            <div className="text-muted extra-small d-flex align-items-center gap-2 mt-0.5" style={{ fontSize: '11.5px' }}>
              <span>{formatReviewDate(review.created_at)}</span>
              {review.is_edited && (
                <>
                  <span>•</span>
                  <span className="text-secondary fst-italic">সম্পাদিত</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overall Star Rating */}
        <div className="d-flex align-items-center gap-2 mt-1 mt-sm-0">
          <StarRating rating={review.rating} size={16} showValue />
        </div>
      </div>

      {/* Sub-Dimension Ratings (Pills) */}
      {(review.cleanliness_rating || review.staff_rating || review.wait_time_rating) && (
        <div className="d-flex flex-wrap gap-1.5 gap-md-2 mb-3">
          {review.cleanliness_rating && (
            <span className="badge bg-light text-secondary border border-light-subtle rounded-pill px-2.5 py-1 small fw-normal d-inline-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
              <Sparkles size={12} className="text-primary" />
              পরিচ্ছন্নতা: {review.cleanliness_rating}★
            </span>
          )}
          {review.staff_rating && (
            <span className="badge bg-light text-secondary border border-light-subtle rounded-pill px-2.5 py-1 small fw-normal d-inline-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
              <Users size={12} className="text-success" />
              স্টাফদের ব্যবহার: {review.staff_rating}★
            </span>
          )}
          {review.wait_time_rating && (
            <span className="badge bg-light text-secondary border border-light-subtle rounded-pill px-2.5 py-1 small fw-normal d-inline-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
              <Clock size={12} className="text-info" />
              অপেক্ষার সময়: {review.wait_time_rating}★
            </span>
          )}
        </div>
      )}

      {/* Title & Comment Body */}
      {review.title && <h6 className="fw-bold text-dark mb-1.5" style={{ fontSize: '15px' }}>{review.title}</h6>}
      <p className="text-secondary mb-3 lh-base" style={{ whiteSpace: 'pre-line', fontSize: '13.5px', color: '#334155' }}>
        {review.comment}
      </p>

      {/* Official Doctor Reply */}
      {doctorReply && (
        <div className="p-3 rounded-3 bg-light border-start border-4 border-primary mt-2 mb-3">
          <div className="d-flex align-items-center gap-2 mb-1">
            <CornerDownRight size={15} className="text-primary" />
            <span className="fw-bold text-primary small">
              ডাঃ {review.doctor?.name || doctorReply.user?.name || 'ডাক্তার'}-এর অফিসিয়াল উত্তর
            </span>
            <span className="text-muted extra-small ms-auto">
              {formatReviewDate(doctorReply.created_at)}
            </span>
          </div>
          <p className="small text-dark mb-0 ps-3 ps-md-4">{doctorReply.reply}</p>
        </div>
      )}

      {/* Official Hospital Reply */}
      {hospitalReply && (
        <div className="p-3 rounded-3 bg-light border-start border-4 border-info mt-2 mb-3">
          <div className="d-flex align-items-center gap-2 mb-1">
            <CornerDownRight size={15} className="text-info" />
            <span className="fw-bold text-info small">
              {review.hospital?.name || 'হাসপাতাল কর্তৃপক্ষ'}-এর অফিসিয়াল উত্তর
            </span>
            <span className="text-muted extra-small ms-auto">
              {formatReviewDate(hospitalReply.created_at)}
            </span>
          </div>
          <p className="small text-dark mb-0 ps-3 ps-md-4">{hospitalReply.reply}</p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="d-flex align-items-center justify-content-between pt-2 border-top border-light-subtle flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          {allowReply && onReply && (
            <button
              type="button"
              onClick={() => onReply(review)}
              className="btn btn-sm btn-outline-primary rounded-pill d-inline-flex align-items-center gap-1 px-3 py-1"
              style={{ fontSize: '12px' }}
            >
              <MessageSquare size={13} />
              উত্তর দিন
            </button>
          )}

          {showManagementStatus && (doctorReply || hospitalReply) && onReply && !allowReply && (
            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small px-2.5 py-1.5 d-inline-flex align-items-center gap-1">
              <CheckCircle2 size={12} />
              ✓ Official Reply Added
            </span>
          )}

          {allowEdit && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="btn btn-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center gap-1 px-3 py-1"
              style={{ fontSize: '12px' }}
            >
              <Edit2 size={13} />
              সম্পাদন
            </button>
          )}

          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(review)}
              className="btn btn-sm btn-outline-danger rounded-pill d-inline-flex align-items-center gap-1 px-3 py-1"
              style={{ fontSize: '12px' }}
            >
              <Trash2 size={13} />
              মুছুন
            </button>
          )}
        </div>

        {onReport && (
          <button
            type="button"
            onClick={() => onReport(review)}
            className="btn btn-link text-muted p-0 text-decoration-none extra-small d-inline-flex align-items-center gap-1 hover-text-danger ms-auto"
            title="যদি এই রিভিউটি মিথ্যা, বিভ্রান্তিকর, অপমানজনক অথবা নীতিমালা লঙ্ঘন করে থাকে, তাহলে অভিযোগ জানান"
            aria-label="অভিযোগ করুন"
            style={{ fontSize: '11.5px' }}
          >
            <Flag size={12} />
            অভিযোগ করুন
          </button>
        )}
      </div>
    </div>
  )
})

export default ReviewCard

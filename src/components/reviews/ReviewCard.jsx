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
  showTypeBadge = false,
  isHospital = false,
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
    <div className={`card border-0 shadow-sm rounded-4 p-3 p-md-3.5 bg-white mb-3 ${className}`} style={{ border: '1px solid #E2E8F0' }}>
      {/* Header: Reviewer Info + Star Rating */}
      <div className="d-flex align-items-start justify-content-between gap-2 mb-2.5">
        <div className="d-flex align-items-center gap-2.5 min-w-0">
          {/* Avatar Icon / Image */}
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold overflow-hidden ${
              isAnonymous ? 'bg-primary-subtle text-primary' : 'bg-light text-dark border'
            }`}
            style={{ width: '38px', height: '38px', fontSize: '0.9rem', flexShrink: 0, borderColor: '#E2E8F0' }}
            aria-hidden="true"
          >
            {isAnonymous ? (
              <ShieldCheck size={18} />
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
          <div className="min-w-0">
            <div className="d-flex align-items-center gap-1.5 flex-wrap">
              <span className="fw-bold text-dark text-truncate" style={{ fontSize: '13.5px', maxWidth: '140px' }}>
                {reviewerName}
              </span>
              {isVerified && (
                <span 
                  className="badge rounded-pill d-inline-flex align-items-center gap-1 px-2 py-0.5" 
                  style={{ 
                    fontSize: '10.5px', 
                    fontWeight: 600,
                    backgroundColor: '#ECFDF5', 
                    color: '#059669', 
                    border: '1px solid #A7F3D0' 
                  }}
                >
                  <UserCheck size={10} />
                  যাচাইকৃত রোগী
                </span>
              )}
              {showTypeBadge && (
                <span 
                  className="badge rounded-pill d-inline-flex align-items-center gap-1 px-2 py-0.5" 
                  style={{ 
                    fontSize: '10.5px', 
                    fontWeight: 600,
                    backgroundColor: review.review_type === 'hospital' ? '#EFF6FF' : '#F0FDF4',
                    color: review.review_type === 'hospital' ? '#1D4ED8' : '#15803D',
                    border: `1px solid ${review.review_type === 'hospital' ? '#BFDBFE' : '#BBF7D0'}`
                  }}
                >
                  {review.review_type === 'hospital' ? '🏥 হাসপাতাল' : '👨‍⚕️ ডাক্তার'}
                </span>
              )}
              {review.status === 'pending' && (
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill d-inline-flex align-items-center gap-1 extra-small px-2 py-0.5" style={{ fontSize: '10.5px' }}>
                  <Clock size={10} />
                  মূল্যায়নাধীন
                </span>
              )}
            </div>
            <div className="text-muted extra-small d-flex align-items-center gap-1.5 mt-0.5" style={{ fontSize: '11px' }}>
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
        <div className="d-flex align-items-center gap-1 flex-shrink-0 bg-light px-2 py-1 rounded-pill border" style={{ borderColor: '#F1F5F9' }}>
          <StarRating rating={review.rating} size={13} />
          <span className="fw-bold text-dark ms-0.5" style={{ fontSize: '12px' }}>
            {Number(review.rating).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Sub-Dimension Ratings (Micro Pills) - Only shown for Hospital reviews */}
      {Boolean(isHospital || review.review_type === 'hospital') && (review.cleanliness_rating || review.staff_rating || review.wait_time_rating) && (
        <div className="d-flex flex-wrap gap-1.5 mb-2.5">
          {review.cleanliness_rating && (
            <span 
              className="badge rounded-pill px-2 py-0.5 d-inline-flex align-items-center gap-1"
              style={{ fontSize: '11px', fontWeight: 500, backgroundColor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}
            >
              <Sparkles size={11} />
              পরিচ্ছন্নতা: {review.cleanliness_rating}★
            </span>
          )}
          {review.staff_rating && (
            <span 
              className="badge rounded-pill px-2 py-0.5 d-inline-flex align-items-center gap-1"
              style={{ fontSize: '11px', fontWeight: 500, backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}
            >
              <Users size={11} />
              স্টাফদের ব্যবহার: {review.staff_rating}★
            </span>
          )}
          {review.wait_time_rating && (
            <span 
              className="badge rounded-pill px-2 py-0.5 d-inline-flex align-items-center gap-1"
              style={{ fontSize: '11px', fontWeight: 500, backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}
            >
              <Clock size={11} />
              অপেক্ষার সময়: {review.wait_time_rating}★
            </span>
          )}
        </div>
      )}

      {/* Title & Comment Body */}
      {review.title && (
        <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px', lineHeight: 1.35 }}>
          {review.title}
        </h6>
      )}
      <p className="text-secondary mb-2.5 lh-base" style={{ whiteSpace: 'pre-line', fontSize: '13px', color: '#334155' }}>
        {review.comment}
      </p>

      {/* Official Doctor Reply - Conversational Bubble */}
      {doctorReply && (
        <div 
          className="p-2.5 p-sm-3 rounded-3 mt-2 mb-2.5"
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderLeft: '3px solid #00B875'
          }}
        >
          <div className="d-flex align-items-center gap-1.5 mb-1 flex-wrap">
            <CornerDownRight size={13} style={{ color: '#00B875' }} />
            <span className="fw-bold small" style={{ color: '#0F172A', fontSize: '12px' }}>
              ডাঃ {review.doctor?.name || doctorReply.user?.name || 'ডাক্তার'}-এর অফিসিয়াল উত্তর
            </span>
            <span 
              className="badge rounded-pill px-1.5 py-0.2" 
              style={{ fontSize: '9.5px', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}
            >
              ভেরিফাইড
            </span>
            <span className="text-muted extra-small ms-auto" style={{ fontSize: '11px' }}>
              {formatReviewDate(doctorReply.created_at)}
            </span>
          </div>
          <p className="small text-secondary mb-0 ps-3" style={{ fontSize: '12.5px', color: '#475569' }}>
            {doctorReply.reply}
          </p>
        </div>
      )}

      {/* Official Hospital Reply - Conversational Bubble */}
      {hospitalReply && (
        <div 
          className="p-2.5 p-sm-3 rounded-3 mt-2 mb-2.5"
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderLeft: '3px solid #0284C7'
          }}
        >
          <div className="d-flex align-items-center gap-1.5 mb-1 flex-wrap">
            <CornerDownRight size={13} style={{ color: '#0284C7' }} />
            <span className="fw-bold small" style={{ color: '#0F172A', fontSize: '12px' }}>
              {review.hospital?.name || 'হাসপাতাল কর্তৃপক্ষ'}-এর অফিসিয়াল উত্তর
            </span>
            <span 
              className="badge rounded-pill px-1.5 py-0.2" 
              style={{ fontSize: '9.5px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
            >
              ভেরিফাইড
            </span>
            <span className="text-muted extra-small ms-auto" style={{ fontSize: '11px' }}>
              {formatReviewDate(hospitalReply.created_at)}
            </span>
          </div>
          <p className="small text-secondary mb-0 ps-3" style={{ fontSize: '12.5px', color: '#475569' }}>
            {hospitalReply.reply}
          </p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="d-flex align-items-center justify-content-between pt-2 border-top border-light-subtle flex-wrap gap-2">
        <div className="d-flex align-items-center gap-1.5">
          {allowReply && onReply && (
            <button
              type="button"
              onClick={() => onReply(review)}
              className="btn btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-2.5 py-1"
              style={{ 
                fontSize: '11.5px', 
                fontWeight: 600,
                backgroundColor: '#EFF6FF', 
                color: '#1D4ED8', 
                border: '1px solid #BFDBFE' 
              }}
            >
              <MessageSquare size={12} />
              উত্তর দিন
            </button>
          )}

          {showManagementStatus && (doctorReply || hospitalReply) && onReply && !allowReply && (
            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small px-2.5 py-1.5 d-inline-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
              <CheckCircle2 size={12} />
              ✓ Official Reply Added
            </span>
          )}

          {allowEdit && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="btn btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-2.5 py-1"
              style={{ 
                fontSize: '11.5px', 
                fontWeight: 600,
                backgroundColor: '#F8FAFC', 
                color: '#475569', 
                border: '1px solid #E2E8F0' 
              }}
            >
              <Edit2 size={12} />
              সম্পাদনা
            </button>
          )}

          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(review)}
              className="btn btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-2.5 py-1"
              style={{ 
                fontSize: '11.5px', 
                fontWeight: 600,
                backgroundColor: '#FEF2F2', 
                color: '#DC2626', 
                border: '1px solid #FECACA' 
              }}
            >
              <Trash2 size={12} />
              মুছুন
            </button>
          )}
        </div>

        {onReport && (
          <button
            type="button"
            onClick={() => onReport(review)}
            className="btn btn-link text-muted p-0 text-decoration-none extra-small d-inline-flex align-items-center gap-1 hover-text-danger ms-auto"
            title="যদি এই রিভিউটি মিথ্যা বা নীতিমালা লঙ্ঘন করে থাকে, তাহলে অভিযোগ জানান"
            aria-label="অভিযোগ করুন"
            style={{ fontSize: '11px', color: '#94A3B8' }}
          >
            <Flag size={11} />
            অভিযোগ করুন
          </button>
        )}
      </div>
    </div>
  )
})

export default ReviewCard

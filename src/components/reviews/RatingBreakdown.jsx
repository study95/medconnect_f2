import React, { useMemo, memo } from 'react'
import StarRating from './StarRating'
import { calculateRatingSummary } from '../../features/reviews/mappers'
import { Sparkles, Users, Clock } from 'lucide-react'

/**
 * Enterprise Rating Breakdown Component
 * Displays overall score, star distribution progress bars, and clinical sub-ratings with full mobile responsiveness.
 */
const RatingBreakdown = memo(function RatingBreakdown({
  reviews = [],
  ratingAvg = null,
  reviewCount = null,
  selectedStar = null,
  onFilterByStar,
  isHospital = false,
  className = '',
}) {
  const summary = useMemo(() => calculateRatingSummary(reviews), [reviews])

  const displayAverage = ratingAvg !== null ? Number(ratingAvg) : summary.average
  const displayTotal = reviewCount !== null ? Number(reviewCount) : summary.total

  return (
    <div className={`card border-0 shadow-sm rounded-4 p-3 p-md-4 ${className}`} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
      <div className="row g-2 g-md-4 align-items-center">
        {/* Left Column: Average Score (Compact side-by-side even on mobile) */}
        <div className="col-5 col-sm-4 text-center border-end border-light-subtle pe-2 pe-md-4">
          <div className="fw-bold mb-0.5" style={{ color: '#0F172A', fontSize: 'clamp(2rem, 4.5vw, 3rem)', lineHeight: 1.1 }}>
            {displayAverage > 0 ? displayAverage.toFixed(1) : '0.0'}
          </div>
          <StarRating rating={displayAverage} size={14} className="mb-1 justify-content-center" />
          <p className="text-muted small mb-0" style={{ fontSize: '11.5px', fontWeight: 600, lineHeight: 1.2 }}>
            <span className="fw-bold text-dark">{displayTotal}</span> রোগীর রিভিউ
          </p>
        </div>

        {/* Right Column: Star Distribution Bars */}
        <div className="col-7 col-sm-8 ps-2 ps-md-4">
          <div className="d-flex flex-column gap-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star] || 0
              const percentage = summary.percentages[star] || 0
              const isSelected = selectedStar === star

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => onFilterByStar && onFilterByStar(isSelected ? null : star)}
                  className={`btn p-0 border-0 text-start w-100 d-flex align-items-center gap-1.5 rounded-2 px-1.5 py-0.5 transition ${
                    isSelected ? 'bg-success-subtle text-success' : ''
                  }`}
                  style={{ 
                    cursor: onFilterByStar ? 'pointer' : 'default',
                    backgroundColor: isSelected ? '#E6F8F3' : 'transparent',
                    borderRadius: 6
                  }}
                  aria-label={`${star} তারকা রিভিউ: ${count}টি`}
                >
                  <span className="fw-bold" style={{ width: '28px', color: isSelected ? '#00B875' : '#64748B', fontSize: '11.5px' }}>
                    {star} ★
                  </span>
                  <div className="progress flex-grow-1" style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: 99 }}>
                    <div
                      className="progress-bar rounded"
                      role="progressbar"
                      style={{ width: `${percentage}%`, backgroundColor: '#F59E0B' }}
                      aria-valuenow={percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>
                  <span className="text-muted text-end fw-semibold" style={{ width: '26px', fontSize: '11px' }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sub-Dimension Facility Ratings - Only shown for Hospital Reviews */}
      {Boolean(isHospital) && (summary.cleanlinessAverage > 0 || summary.staffAverage > 0 || summary.waitTimeAverage > 0) && (
        <div className="border-top pt-2.5 mt-2.5" style={{ borderColor: '#E2E8F0' }}>
          <div className="row g-1.5 g-sm-2 text-center">
            {summary.cleanlinessAverage > 0 && (
              <div className="col-4">
                <div className="p-1.5 p-sm-2 rounded-3 bg-white border" style={{ borderColor: '#E2E8F0' }}>
                  <div className="d-flex align-items-center justify-content-center gap-1 mb-0.5" style={{ color: '#0284C7' }}>
                    <Sparkles size={13} />
                    <span className="fw-bold" style={{ fontSize: '12.5px' }}>{summary.cleanlinessAverage.toFixed(1)}</span>
                  </div>
                  <div className="text-muted extra-small" style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    পরিচ্ছন্নতা
                  </div>
                </div>
              </div>
            )}
            {summary.staffAverage > 0 && (
              <div className="col-4">
                <div className="p-1.5 p-sm-2 rounded-3 bg-white border" style={{ borderColor: '#E2E8F0' }}>
                  <div className="d-flex align-items-center justify-content-center gap-1 mb-0.5" style={{ color: '#00B875' }}>
                    <Users size={13} />
                    <span className="fw-bold" style={{ fontSize: '12.5px' }}>{summary.staffAverage.toFixed(1)}</span>
                  </div>
                  <div className="text-muted extra-small" style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    স্টাফ ব্যবহার
                  </div>
                </div>
              </div>
            )}
            {summary.waitTimeAverage > 0 && (
              <div className="col-4">
                <div className="p-1.5 p-sm-2 rounded-3 bg-white border" style={{ borderColor: '#E2E8F0' }}>
                  <div className="d-flex align-items-center justify-content-center gap-1 mb-0.5" style={{ color: '#E11D48' }}>
                    <Clock size={13} />
                    <span className="fw-bold" style={{ fontSize: '12.5px' }}>{summary.waitTimeAverage.toFixed(1)}</span>
                  </div>
                  <div className="text-muted extra-small" style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    অপেক্ষার সময়
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

export default RatingBreakdown

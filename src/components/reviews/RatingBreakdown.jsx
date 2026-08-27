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
  className = '',
}) {
  const summary = useMemo(() => calculateRatingSummary(reviews), [reviews])

  const displayAverage = ratingAvg !== null ? Number(ratingAvg) : summary.average
  const displayTotal = reviewCount !== null ? Number(reviewCount) : summary.total

  return (
    <div className={`card border-0 shadow-sm rounded-4 p-3 p-md-4 ${className}`} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
      <div className="row g-3 g-md-4 align-items-center">
        {/* Left Column: Big Average Score */}
        <div className="col-12 col-md-4 text-center border-md-end border-light-subtle pe-md-4 pb-2 pb-md-0">
          <div className="display-4 fw-bold mb-1" style={{ color: '#0F172A', fontSize: 'clamp(2.5rem, 5vw, 3.2rem)', lineHeight: 1.1 }}>
            {displayAverage > 0 ? displayAverage.toFixed(1) : '0.0'}
          </div>
          <StarRating rating={displayAverage} size={20} className="mb-2 justify-content-center" />
          <p className="text-muted small mb-0" style={{ fontSize: '13px', fontWeight: 600 }}>
            <span className="fw-bold text-dark">{displayTotal}</span> জন রোগীর যাচাইকৃত মতামতের ভিত্তিতে
          </p>
        </div>

        {/* Middle Column: Star Distribution Bars */}
        <div className="col-12 col-md-8">
          <div className="d-flex flex-column gap-1 gap-md-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star] || 0
              const percentage = summary.percentages[star] || 0
              const isSelected = selectedStar === star

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => onFilterByStar && onFilterByStar(isSelected ? null : star)}
                  className={`btn p-0 border-0 text-start w-100 d-flex align-items-center gap-2 rounded-2 px-2 py-1 transition ${
                    isSelected ? 'bg-success-subtle text-success' : ''
                  }`}
                  style={{ 
                    cursor: onFilterByStar ? 'pointer' : 'default',
                    backgroundColor: isSelected ? '#E6F8F3' : 'transparent',
                    borderRadius: 8
                  }}
                  aria-label={`${star} তারকা রিভিউ: ${count}টি`}
                >
                  <span className="small fw-bold" style={{ width: '38px', color: isSelected ? '#00B875' : '#64748B', fontSize: '12.5px' }}>
                    {star} ★
                  </span>
                  <div className="progress flex-grow-1" style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: 99 }}>
                    <div
                      className="progress-bar rounded"
                      role="progressbar"
                      style={{ width: `${percentage}%`, backgroundColor: '#F59E0B' }}
                      aria-valuenow={percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>
                  <span className="small text-muted text-end fw-semibold" style={{ width: '35px', fontSize: '12px' }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sub-Dimension Clinical Ratings */}
      {(summary.cleanlinessAverage > 0 || summary.staffAverage > 0 || summary.waitTimeAverage > 0) && (
        <div className="border-top pt-3 mt-3" style={{ borderColor: '#E2E8F0' }}>
          <div className="row g-2 text-center">
            {summary.cleanlinessAverage > 0 && (
              <div className="col-4">
                <div className="p-2 rounded-3 bg-white border" style={{ borderColor: '#E2E8F0' }}>
                  <div className="d-flex align-items-center justify-content-center gap-1 mb-1" style={{ color: '#0284C7' }}>
                    <Sparkles size={14} />
                    <span className="fw-bold small">{summary.cleanlinessAverage.toFixed(1)}</span>
                  </div>
                  <div className="text-muted extra-small" style={{ fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    পরিচ্ছন্নতা
                  </div>
                </div>
              </div>
            )}
            {summary.staffAverage > 0 && (
              <div className="col-4">
                <div className="p-2 rounded-3 bg-white border" style={{ borderColor: '#E2E8F0' }}>
                  <div className="d-flex align-items-center justify-content-center gap-1 mb-1" style={{ color: '#00B875' }}>
                    <Users size={14} />
                    <span className="fw-bold small">{summary.staffAverage.toFixed(1)}</span>
                  </div>
                  <div className="text-muted extra-small" style={{ fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    স্টাফদের ব্যবহার
                  </div>
                </div>
              </div>
            )}
            {summary.waitTimeAverage > 0 && (
              <div className="col-4">
                <div className="p-2 rounded-3 bg-white border" style={{ borderColor: '#E2E8F0' }}>
                  <div className="d-flex align-items-center justify-content-center gap-1 mb-1" style={{ color: '#E11D48' }}>
                    <Clock size={14} />
                    <span className="fw-bold small">{summary.waitTimeAverage.toFixed(1)}</span>
                  </div>
                  <div className="text-muted extra-small" style={{ fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

import React, { useMemo, memo } from 'react'
import StarRating from './StarRating'
import { calculateRatingSummary } from '../../features/reviews/mappers'
import { Sparkles, Users, Clock } from 'lucide-react'

/**
 * Enterprise Rating Breakdown Component
 * Displays overall score, star distribution progress bars, and clinical sub-ratings.
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
    <div className={`card border-0 shadow-sm rounded-4 p-4 ${className}`} style={{ backgroundColor: '#f8fafc' }}>
      <div className="row g-4 align-items-center">
        {/* Left Column: Big Average Score */}
        <div className="col-12 col-md-4 text-center border-md-end border-light-subtle pe-md-4">
          <div className="display-4 fw-bold text-dark mb-1">
            {displayAverage > 0 ? displayAverage.toFixed(1) : '0.0'}
          </div>
          <StarRating rating={displayAverage} size={22} className="mb-2" />
          <p className="text-muted small mb-0">
            <span className="fw-semibold text-dark">{displayTotal}</span> জন রোগীর যাচাইকৃত মতামতের ভিত্তিতে
          </p>
        </div>

        {/* Middle Column: Star Distribution Bars */}
        <div className="col-12 col-md-8">
          <div className="d-flex flex-column gap-2">
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
                    isSelected ? 'bg-primary-subtle' : 'hover-bg-light'
                  }`}
                  style={{ cursor: onFilterByStar ? 'pointer' : 'default' }}
                  aria-label={`${star} তারকা রিভিউ: ${count}টি`}
                >
                  <span className="small fw-semibold text-secondary" style={{ width: '40px' }}>
                    {star} ★
                  </span>
                  <div className="progress flex-grow-1" style={{ height: '8px', backgroundColor: '#e2e8f0' }}>
                    <div
                      className="progress-bar bg-warning rounded"
                      role="progressbar"
                      style={{ width: `${percentage}%` }}
                      aria-valuenow={percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>
                  <span className="small text-muted text-end" style={{ width: '45px' }}>
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
        <div className="border-top border-light-subtle pt-3 mt-4">
          <div className="row g-3 text-center">
            {summary.cleanlinessAverage > 0 && (
              <div className="col-4">
                <div className="p-2 rounded-3 bg-white border border-light-subtle">
                  <div className="d-flex align-items-center justify-content-center gap-1 text-primary mb-1">
                    <Sparkles size={16} />
                    <span className="fw-bold small">{summary.cleanlinessAverage.toFixed(1)}</span>
                  </div>
                  <div className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>
                    পরিচ্ছন্নতা
                  </div>
                </div>
              </div>
            )}
            {summary.staffAverage > 0 && (
              <div className="col-4">
                <div className="p-2 rounded-3 bg-white border border-light-subtle">
                  <div className="d-flex align-items-center justify-content-center gap-1 text-success mb-1">
                    <Users size={16} />
                    <span className="fw-bold small">{summary.staffAverage.toFixed(1)}</span>
                  </div>
                  <div className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>
                    স্টাফদের ব্যবহার
                  </div>
                </div>
              </div>
            )}
            {summary.waitTimeAverage > 0 && (
              <div className="col-4">
                <div className="p-2 rounded-3 bg-white border border-light-subtle">
                  <div className="d-flex align-items-center justify-content-center gap-1 text-info mb-1">
                    <Clock size={16} />
                    <span className="fw-bold small">{summary.waitTimeAverage.toFixed(1)}</span>
                  </div>
                  <div className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>
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

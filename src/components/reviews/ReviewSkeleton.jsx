import React, { memo } from 'react'

/**
 * CLS-Safe Skeleton Loading Placeholders for Reviews Feed
 */
const ReviewSkeleton = memo(function ReviewSkeleton({ count = 3, showBreakdown = true }) {
  return (
    <div className="d-flex flex-column gap-3 w-100 placeholder-glow" aria-hidden="true">
      {showBreakdown && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-2" style={{ backgroundColor: '#f8fafc', minHeight: '180px' }}>
          <div className="row g-4 align-items-center">
            <div className="col-12 col-md-4 text-center">
              <span className="placeholder col-6 py-4 rounded mb-2 d-block mx-auto" />
              <span className="placeholder col-8 py-2 rounded d-block mx-auto" />
            </div>
            <div className="col-12 col-md-8">
              <div className="d-flex flex-column gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="placeholder col-12 py-2 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ minHeight: '160px' }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-3 w-50">
              <span className="placeholder rounded-circle" style={{ width: '42px', height: '42px' }} />
              <div className="w-75">
                <span className="placeholder col-7 d-block mb-1" />
                <span className="placeholder col-4 d-block" />
              </div>
            </div>
            <span className="placeholder col-2 py-2 rounded" />
          </div>
          <span className="placeholder col-8 mb-2 d-block" />
          <span className="placeholder col-12 mb-1 d-block" />
          <span className="placeholder col-10 d-block" />
        </div>
      ))}
    </div>
  )
})

export default ReviewSkeleton

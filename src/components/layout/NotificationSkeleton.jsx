import React, { memo } from 'react'

/**
 * Loading Skeleton for Notification Popovers
 */
const NotificationSkeleton = memo(function NotificationSkeleton({ count = 3 }) {
  return (
    <div className="placeholder-glow">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="p-3 border-bottom border-light-subtle d-flex align-items-start gap-3">
          <span className="placeholder rounded-circle" style={{ width: '32px', height: '32px' }} />
          <div className="w-100">
            <span className="placeholder col-8 d-block mb-1" />
            <span className="placeholder col-11 d-block mb-1" />
            <span className="placeholder col-4 d-block" />
          </div>
        </div>
      ))}
    </div>
  )
})

export default NotificationSkeleton

import React, { useState, useCallback, memo } from 'react'
import { Star, StarHalf } from 'lucide-react'

/**
 * Reusable & Accessible Star Rating Component
 * Supports read-only display (with half-star decimals) and interactive rating inputs.
 */
const StarRating = memo(function StarRating({
  rating = 0,
  maxRating = 5,
  size = 18,
  readOnly = true,
  onChange,
  color = '#f59e0b',
  emptyColor = '#e2e8f0',
  showValue = false,
  className = '',
}) {
  const [hoverRating, setHoverRating] = useState(0)

  const handleMouseEnter = useCallback(
    (starValue) => {
      if (!readOnly) {
        setHoverRating(starValue)
      }
    },
    [readOnly]
  )

  const handleMouseLeave = useCallback(() => {
    if (!readOnly) {
      setHoverRating(0)
    }
  }, [readOnly])

  const handleClick = useCallback(
    (starValue) => {
      if (!readOnly && onChange) {
        onChange(starValue)
      }
    },
    [readOnly, onChange]
  )

  const handleKeyDown = useCallback(
    (e, starValue) => {
      if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        if (onChange) onChange(starValue)
      }
    },
    [readOnly, onChange]
  )

  const activeValue = !readOnly && hoverRating > 0 ? hoverRating : Number(rating) || 0

  return (
    <div
      className={`d-inline-flex align-items-center gap-1 ${className}`}
      onMouseLeave={handleMouseLeave}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `Rating: ${rating} out of ${maxRating} stars` : 'Select a star rating'}
    >
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1
        const isFull = activeValue >= starValue
        const isHalf = !isFull && activeValue >= starValue - 0.5 && readOnly

        return (
          <span
            key={starValue}
            role={readOnly ? undefined : 'radio'}
            aria-checked={!readOnly ? rating === starValue : undefined}
            aria-label={`${starValue} Star${starValue > 1 ? 's' : ''}`}
            tabIndex={readOnly ? -1 : 0}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onKeyDown={(e) => handleKeyDown(e, starValue)}
            style={{
              cursor: readOnly ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease',
              outline: 'none',
            }}
            className={!readOnly ? 'star-interactive hover-scale' : ''}
          >
            {isHalf ? (
              <StarHalf size={size} color={color} fill={color} />
            ) : (
              <Star
                size={size}
                color={isFull ? color : emptyColor}
                fill={isFull ? color : 'transparent'}
                strokeWidth={isFull ? 1 : 1.5}
              />
            )}
          </span>
        )
      })}

      {showValue && (
        <span className="ms-1 fw-bold text-dark fs-6" aria-hidden="true">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  )
})

export default StarRating

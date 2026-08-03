// src/components/common/OptimizedImage.jsx
// WHY: Native lazy loading + async decoding + skeleton placeholder.
// - loading="lazy": Browser only loads image when near viewport
// - decoding="async": Image decode doesn't block the main thread
// - Skeleton shimmer shows while image loads (no layout shift)
// - Built-in error fallback

import { useState, memo } from 'react'

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt = '',
  fallback = '',
  width,
  height,
  style = {},
  className = '',
  borderRadius,
  objectFit = 'cover',
  ...rest
}) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const [failed, setFailed] = useState(false)

  const imgSrc = failed ? '' : (errored ? (fallback || '') : (src || fallback || ''))

  const containerStyle = {
    position: 'relative',
    width: width || '100%',
    height: height || 'auto',
    overflow: 'hidden',
    borderRadius: borderRadius || style.borderRadius || 0,
    background: style.background || 'transparent', // Let it be transparent by default if not set, or let card style override it
    ...style,
  }

  return (
    <div style={containerStyle} className={className}>
      {/* Shimmer placeholder — visible until image loads */}
      {!loaded && !failed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '600px 100%',
            animation: 'shimmer 1.4s infinite linear',
            borderRadius: 'inherit',
          }}
        />
      )}

      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            if (!errored && fallback) {
              setErrored(true)
            } else {
              setFailed(true)
              setLoaded(true) // Hide shimmer even if no fallback
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            borderRadius: 'inherit',
          }}
          {...rest}
        />
      )}
    </div>
  )
})

export default OptimizedImage

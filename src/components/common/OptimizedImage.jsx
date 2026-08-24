// src/components/common/OptimizedImage.jsx
// WHY: Native lazy loading + async decoding + skeleton placeholder.
// - loading="lazy": Browser only loads image when near viewport
// - loading="eager" + fetchpriority="high": For LCP images (hero/above-fold)
// - decoding="async": Image decode doesn't block the main thread
// - width + height: Prevents CLS by reserving space before image loads
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
  // fetchpriority: 'high' for LCP/hero images, 'low' for below-fold
  // 'auto' (default) lets browser decide
  fetchpriority = 'auto',
  // eager: set true for above-the-fold images to disable lazy loading
  eager = false,
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
    background: style.background || 'transparent',
    ...style,
  }

  // Skeleton: only show if we have an explicit height (prevents CLS from unknown-height containers)
  const showSkeleton = !loaded && !failed && (height || style.height || style.minHeight)

  return (
    <div style={containerStyle} className={className}>
      {/* Shimmer placeholder — visible until image loads (only when height is known) */}
      {showSkeleton && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
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
          // loading: eager for above-fold (LCP), lazy for below-fold
          loading={eager ? 'eager' : 'lazy'}
          // decoding=async: never blocks rendering thread
          decoding="async"
          // fetchpriority: browser hint for resource priority
          fetchPriority={fetchpriority}
          onLoad={() => setLoaded(true)}
          onError={() => {
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
            // Prevent CLS — image always takes full container
            minWidth: '100%',
          }}
          // Pass width/height as attributes for browser paint reservation
          {...(width && !String(width).includes('%') ? { width: parseInt(width) } : {})}
          {...(height && !String(height).includes('%') ? { height: parseInt(height) } : {})}
          {...rest}
        />
      )}
    </div>
  )
})

export default OptimizedImage

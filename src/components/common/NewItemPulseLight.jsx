import React from 'react'

/**
 * Pure Solid Green Ball Notification Indicator.
 * - Just a clean, solid, steady green dot (7px).
 * - No outer ring, no border, no white circle, no halo, no blinking.
 */
export function PulseLight({
  size = 7,
  title = 'নতুন আইটেম (New / Unread)',
  dotColor = '#10B981',
  isActive = false,
  className = '',
  style = {}
}) {
  const isWhite = isActive || dotColor === '#FFFFFF'
  const color = isWhite ? '#FFFFFF' : '#10B981'

  return (
    <span
      className={`admin-green-dot ${className}`}
      title={title}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        backgroundColor: color,
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style
      }}
    />
  )
}

/**
 * Specialized Sidebar Green Dot.
 * Just a single clean ball right-aligned.
 * If the row is active (green background), turns solid white for crisp contrast.
 */
export function SidebarGreenDot({ isCollapsed = false, isActive = false, title = 'নতুন নোটিফিকেশন আছে' }) {
  const dotColor = isActive ? '#FFFFFF' : '#10B981'

  if (isCollapsed) {
    return (
      <span
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 3,
          display: 'inline-flex',
        }}
      >
        <PulseLight size={6.5} title={title} dotColor={dotColor} isActive={isActive} />
      </span>
    )
  }

  return (
    <span
      style={{
        marginLeft: 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 6,
        flexShrink: 0,
      }}
    >
      <PulseLight size={7} title={title} dotColor={dotColor} isActive={isActive} />
    </span>
  )
}

export default PulseLight

import React from 'react'

/**
 * Facebook-style Subtle Twinkling Emerald Green Dot Component.
 * Designed to be compact, elegant, and gently breathing ("mitmit kore"),
 * avoiding any overwhelming disc or distraction.
 */

export function PulseLight({
  size = 6.5,
  title = 'নতুন আইটেম (New / Unread)',
  dotColor = '#10B981',
  auraColor = '#10B981',
  isActive = false,
  className = '',
  style = {}
}) {
  const isWhite = isActive || dotColor === '#FFFFFF'

  return (
    <span
      className={`pulse-light-container ${className}`}
      title={title}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        ...style
      }}
    >
      {/* Subtle micro ring */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: isWhite ? '#FFFFFF' : auraColor,
          opacity: 0,
          animation: 'subtlePulseRing 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
          pointerEvents: 'none',
        }}
      />
      {/* Core twinkling dot */}
      <span
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          background: isWhite ? '#FFFFFF' : dotColor,
          animation: isWhite
            ? 'subtleMitMitWhite 2.2s ease-in-out infinite'
            : 'subtleMitMit 2.2s ease-in-out infinite',
        }}
      />
    </span>
  )
}

/**
 * Specialized Sidebar Green Dot.
 * Compact (6.5px), clean, and right-aligned with gentle twinkling.
 * When active page has green background, turns into a crisp white twinkling dot.
 */
export function SidebarGreenDot({ isCollapsed = false, isActive = false, title = 'নতুন নোটিফিকেশন আছে' }) {
  const dotColor = isActive ? '#FFFFFF' : '#10B981'

  if (isCollapsed) {
    return (
      <span
        style={{
          position: 'absolute',
          top: 7,
          right: 7,
          zIndex: 3,
        }}
      >
        <PulseLight size={6} title={title} dotColor={dotColor} isActive={isActive} />
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
      <PulseLight size={6.5} title={title} dotColor={dotColor} isActive={isActive} />
    </span>
  )
}

export default PulseLight

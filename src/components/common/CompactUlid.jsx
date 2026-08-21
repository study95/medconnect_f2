import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

/**
 * CompactUlid Component
 *
 * Formats full ULIDs/IDs cleanly:
 * - Strips unnecessary '#' prefixes.
 * - Applies middle truncation (e.g. '01M0HMMY...YY9NYD') for long identifiers.
 * - Displays full value in a tooltip on hover.
 * - Provides a subtle copy button with responsive 'Copied!' feedback.
 * - Keeps row height compact and matches enterprise dashboard typography.
 */
export default function CompactUlid({ value, style, className }) {
  const [copied, setCopied] = useState(false)

  if (!value && value !== 0) {
    return <span style={{ color: 'var(--admin-text-muted, #94a3b8)', fontSize: 12 }}>—</span>
  }

  // Remove leading '#' if present
  const cleanValue = String(value).replace(/^#+/, '').trim()

  // Truncate if long identifier (ULID is 26 chars, or any id > 14 chars)
  const isLong = cleanValue.length > 14
  const displayText = isLong
    ? `${cleanValue.slice(0, 8)}...${cleanValue.slice(-6)}`
    : cleanValue

  const handleCopy = (e) => {
    e.stopPropagation()
    if (!cleanValue) return

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(cleanValue)
    } else {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = cleanValue
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--admin-text, #334155)',
        maxWidth: '100%',
        verticalAlign: 'middle',
        ...style
      }}
      title={cleanValue}
    >
      <span style={{ letterSpacing: '-0.01em', userSelect: 'all' }}>
        {displayText}
      </span>

      <button
        type="button"
        onClick={handleCopy}
        style={{
          background: copied ? '#ecfdf5' : 'transparent',
          border: copied ? '1px solid #a7f3d0' : 'none',
          padding: copied ? '1px 5px' : '2px',
          borderRadius: 4,
          cursor: 'pointer',
          color: copied ? '#059669' : '#94a3b8',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          fontSize: 10,
          fontWeight: 700,
          transition: 'all 0.15s ease',
          lineHeight: 1,
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          if (!copied) {
            e.currentTarget.style.color = '#4f46e5'
            e.currentTarget.style.background = 'rgba(79, 70, 229, 0.08)'
          }
        }}
        onMouseLeave={(e) => {
          if (!copied) {
            e.currentTarget.style.color = '#94a3b8'
            e.currentTarget.style.background = 'transparent'
          }
        }}
        title={`Copy ${cleanValue}`}
        aria-label={`Copy ${cleanValue}`}
      >
        {copied ? (
          <>
            <Check size={11} strokeWidth={2.5} />
            <span style={{ fontSize: 10 }}>Copied!</span>
          </>
        ) : (
          <Copy size={11} strokeWidth={2} />
        )}
      </button>
    </span>
  )
}

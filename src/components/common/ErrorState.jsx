import React from 'react'
import { IconAlertTriangle, IconRefresh, IconRotate } from '@tabler/icons-react'
import { translateToBangla } from '../../utils/errorHelper'

/**
 * A clean, user-friendly, professional Error State card component.
 * Replaces raw technical strings (e.g. "Request failed with status code 500")
 * with reassuring Bangla copy, modern iconography, and retry controls.
 */
export default function ErrorState({
  title = 'তথ্য লোড করতে সমস্যা হয়েছে',
  message,
  onRetry,
  retryText = 'আবার চেষ্টা করুন',
  onSecondary,
  secondaryText,
  compact = false,
  style = {},
}) {
  // Ensure message is user-friendly and not a raw technical stack or code
  const friendlyMessage = typeof message === 'string'
    ? translateToBangla(message, 'সার্ভার থেকে তথ্য পাওয়া যায়নি বা সাময়িক সমস্যা দেখা দিয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।')
    : 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে পুনরায় চেষ্টা করুন।';

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #FEE2E2',
        borderRadius: 16,
        padding: compact ? '24px 20px' : '48px 24px',
        textAlign: 'center',
        boxShadow: '0 4px 20px -2px rgba(239, 68, 68, 0.05)',
        fontFamily: "'Hind Siliguri', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        maxWidth: compact ? '100%' : 540,
        margin: '20px auto',
        ...style,
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: compact ? 48 : 60,
          height: compact ? 48 : 60,
          borderRadius: '50%',
          background: '#FEF2F2',
          border: '1px solid #FEE2E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: '#DC2626',
        }}
      >
        <IconAlertTriangle size={compact ? 24 : 30} stroke={1.8} />
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: compact ? 16 : 19,
          fontWeight: 700,
          color: '#1E293B',
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      {/* Friendly Description */}
      <p
        style={{
          fontSize: compact ? 13 : 14,
          color: '#64748B',
          lineHeight: 1.6,
          maxWidth: 420,
          margin: '0 auto 20px',
        }}
      >
        {friendlyMessage}
      </p>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              background: '#0B192C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 22px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(11, 25, 44, 0.15)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#1E293B'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#0B192C'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <IconRefresh size={16} stroke={2} />
            <span>{retryText}</span>
          </button>
        )}

        {onSecondary && secondaryText && (
          <button
            type="button"
            onClick={onSecondary}
            style={{
              background: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#E2E8F0'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#F1F5F9'
            }}
          >
            {secondaryText}
          </button>
        )}
      </div>
    </div>
  )
}

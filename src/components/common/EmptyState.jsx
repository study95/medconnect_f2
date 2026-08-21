// EmptyState.jsx — Reusable Enterprise Empty State Component
import React from 'react'
import { Link } from 'react-router-dom'
import {
  SearchX, FilterX, Database, ShieldAlert,
  AlertTriangle, Sparkles, RefreshCw, X
} from 'lucide-react'

/**
 * Default variant configurations
 */
const VARIANT_CONFIG = {
  'no-data': {
    Icon: Database,
    defaultTitle: 'No records found',
    defaultDesc: 'There are currently no items in this dataset. Get started by creating your first entry.',
    iconColor: '#64748b',
    iconBg: 'rgba(100, 116, 139, 0.08)',
    iconBorder: 'rgba(100, 116, 139, 0.15)',
  },
  'no-search-results': {
    Icon: SearchX,
    defaultTitle: 'No matching results found',
    defaultDesc: 'We couldn’t find any records matching your search query. Try checking for typos or searching for a different keyword.',
    iconColor: '#3b82f6',
    iconBg: 'rgba(59, 130, 246, 0.08)',
    iconBorder: 'rgba(59, 130, 246, 0.2)',
  },
  'filters-active': {
    Icon: FilterX,
    defaultTitle: 'No results match your active filters',
    defaultDesc: 'We couldn’t find any records matching all applied filter criteria. Try resetting or adjusting your filter parameters.',
    iconColor: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.08)',
    iconBorder: 'rgba(245, 158, 11, 0.2)',
  },
  'permission-denied': {
    Icon: ShieldAlert,
    defaultTitle: 'Access Restricted',
    defaultDesc: 'You do not have the required administrative permissions to view or manage this section.',
    iconColor: '#ef4444',
    iconBg: 'rgba(239, 68, 68, 0.08)',
    iconBorder: 'rgba(239, 68, 68, 0.2)',
  },
  'error': {
    Icon: AlertTriangle,
    defaultTitle: 'Failed to load data',
    defaultDesc: 'An error occurred while communicating with the server. Please try refreshing the data.',
    iconColor: '#ef4444',
    iconBg: 'rgba(239, 68, 68, 0.08)',
    iconBorder: 'rgba(239, 68, 68, 0.2)',
  },
  'first-time-setup': {
    Icon: Sparkles,
    defaultTitle: 'Ready for initial setup',
    defaultDesc: 'Configure your parameters and initial database entries to begin managing operations seamlessly.',
    iconColor: '#00B875',
    iconBg: 'rgba(0, 184, 117, 0.08)',
    iconBorder: 'rgba(0, 184, 117, 0.2)',
  },
}

export default function EmptyState({
  variant,
  icon,
  title,
  description,
  searchQuery,
  hasFilters,
  onClearFilters,
  onClearSearch,
  onRetry,
  primaryAction,
  secondaryAction,
  compact = false,
  className = '',
  style = {},
}) {
  // ── Auto-detect variant if not explicitly provided ──
  let effectiveVariant = variant
  if (!effectiveVariant) {
    if (searchQuery) {
      effectiveVariant = 'no-search-results'
    } else if (hasFilters) {
      effectiveVariant = 'filters-active'
    } else {
      effectiveVariant = 'no-data'
    }
  }

  const config = VARIANT_CONFIG[effectiveVariant] || VARIANT_CONFIG['no-data']
  const IconComponent = config.Icon

  const finalTitle = title || config.defaultTitle
  const finalDesc = description || (
    effectiveVariant === 'no-search-results' && searchQuery
      ? `We couldn’t find any records matching "${searchQuery}". Try a different keyword or clear your search.`
      : config.defaultDesc
  )

  // Auto-generate primary actions for search / filter states if not provided
  let computedPrimaryAction = primaryAction
  if (!computedPrimaryAction) {
    if (effectiveVariant === 'no-search-results' && onClearSearch) {
      computedPrimaryAction = {
        label: 'Clear Search',
        onClick: onClearSearch,
        icon: X,
        variant: 'outline',
      }
    } else if (effectiveVariant === 'filters-active' && onClearFilters) {
      computedPrimaryAction = {
        label: 'Reset All Filters',
        onClick: onClearFilters,
        icon: RotateCcwFallback,
        variant: 'primary',
      }
    } else if (effectiveVariant === 'error' && onRetry) {
      computedPrimaryAction = {
        label: 'Retry Connection',
        onClick: onRetry,
        icon: RefreshCw,
        variant: 'primary',
      }
    }
  }

  return (
    <div
      className={`admin-empty-state ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '32px 16px' : '56px 24px',
        minHeight: compact ? 180 : 280,
        background: 'transparent',
        animation: 'skeletonFadeIn 0.25s ease-out',
        ...style,
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: compact ? 44 : 56,
          height: compact ? 44 : 56,
          borderRadius: compact ? 12 : 16,
          background: config.iconBg,
          border: `1.5px solid ${config.iconBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: config.iconColor,
          marginBottom: compact ? 12 : 16,
          fontSize: compact ? 20 : 26,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        {icon ? (
          typeof icon === 'string' ? <span>{icon}</span> : icon
        ) : (
          <IconComponent size={compact ? 22 : 28} strokeWidth={1.8} />
        )}
      </div>

      {/* Title */}
      <h4
        style={{
          margin: '0 0 8px',
          fontSize: compact ? 14 : 16,
          fontWeight: 700,
          color: 'var(--admin-text, #0f172a)',
          letterSpacing: '-0.2px',
        }}
      >
        {finalTitle}
      </h4>

      {/* Description */}
      <p
        style={{
          margin: '0 0 20px',
          fontSize: compact ? 12.5 : 13.5,
          color: 'var(--admin-text-muted, #64748b)',
          maxWidth: 440,
          lineHeight: 1.5,
          fontWeight: 400,
        }}
      >
        {finalDesc}
      </p>

      {/* Actions */}
      {(computedPrimaryAction || secondaryAction) && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {computedPrimaryAction && renderAction(computedPrimaryAction, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  )
}

function RotateCcwFallback(props) {
  return <RefreshCw {...props} />
}

function renderAction(action, isPrimary) {
  if (React.isValidElement(action)) return action
  if (!action || typeof action !== 'object') return null

  const { label, onClick, to, icon: ActionIcon, variant } = action
  const isOutline = variant === 'outline' || (!isPrimary && !variant)
  const btnClass = `admin-btn ${isOutline ? 'admin-btn-outline' : 'admin-btn-primary'} admin-btn-sm`
  const style = {
    height: 36,
    padding: '0 16px',
    borderRadius: 8,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontWeight: 600,
    fontSize: 13,
  }

  const content = (
    <>
      {ActionIcon && (React.isValidElement(ActionIcon) ? ActionIcon : <ActionIcon size={14} />)}
      <span>{label}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={btnClass} style={style}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={btnClass} style={style}>
      {content}
    </button>
  )
}

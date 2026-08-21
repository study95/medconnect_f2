import { useState, useRef, useEffect } from 'react'
import { Search, Filter, RefreshCw, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'

/**
 * ListToolbar Component
 *
 * Universal enterprise toolbar for all admin listings:
 * - Search and Refresh are ALWAYS visible in the primary toolbar.
 * - Filters button displays an active count badge when filters are applied.
 * - Removable Active Filters Chip Row appears when filters are active, with individual 'x' remove buttons and 'Clear all'.
 * - Advanced filters smoothly expand/collapse in a dedicated sub-panel.
 * - Fully responsive (Desktop, Tablet, Mobile).
 * - Preserves all parent filtering, debounce, pagination, and refresh behaviors.
 */
export default function ListToolbar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Quick search...',
  onRefresh,
  refreshing = false,
  showFilters = false,
  onToggleFilters,
  hasActiveFilters = false,
  onClearFilters,
  filterCount = 0,
  activeFilters = [], // Array of { key, label, onRemove }
  children, // Advanced filter fields (selects, datepickers, etc.)
  actions, // Extra buttons like 'Add Doctor', 'Export CSV', etc.
  perPage,
  onPerPageChange,
  perPageOptions = [10, 25, 50, 100],
  totalEntries,
  fromEntry,
  toEntry,
  className = '',
  style = {}
}) {
  const hasAdvancedFilters = Boolean(children)
  const effectiveFilterCount = activeFilters.length > 0 ? activeFilters.length : filterCount
  const isFilterActive = hasActiveFilters || effectiveFilterCount > 0

  return (
    <div
      className={`admin-list-toolbar-container ${className}`}
      style={{
        background: 'var(--admin-card-bg, #ffffff)',
        border: '1px solid var(--admin-border, #e2e8f0)',
        borderRadius: 14,
        padding: '12px 16px',
        marginBottom: 14,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        ...style
      }}
    >
      {/* ── Primary Always-Visible Toolbar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10
      }}>
        {/* Left: Quick Search Input */}
        <div style={{ flex: '1 1 260px', position: 'relative', minWidth: 200, maxWidth: '100%' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--admin-text-muted, #94a3b8)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: '100%',
              height: 38,
              paddingLeft: 36,
              paddingRight: search ? 32 : 12,
              borderRadius: 9,
              border: '1px solid var(--admin-border, #e2e8f0)',
              background: 'var(--admin-input-bg, #f8fafc)',
              color: 'var(--admin-text, #0f172a)',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'all 0.15s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1'
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.12)'
              e.target.style.background = '#ffffff'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--admin-border, #e2e8f0)'
              e.target.style.boxShadow = 'none'
              e.target.style.background = 'var(--admin-input-bg, #f8fafc)'
            }}
          />
          {search && onSearchChange && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                color: 'var(--admin-text-muted, #94a3b8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Right: Actions, Filters Toggle, Refresh */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginLeft: 'auto'
        }}>
          {/* Advanced Filters Toggle Button */}
          {hasAdvancedFilters && onToggleFilters && (
            <button
              type="button"
              onClick={onToggleFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 38,
                padding: '0 13px',
                borderRadius: 9,
                border: `1px solid ${isFilterActive ? '#6366f1' : 'var(--admin-border, #e2e8f0)'}`,
                background: isFilterActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--admin-card-bg, #ffffff)',
                color: isFilterActive ? '#4f46e5' : 'var(--admin-text, #334155)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isFilterActive) e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                if (!isFilterActive) e.currentTarget.style.background = 'var(--admin-card-bg, #ffffff)'
              }}
            >
              <Filter size={14} style={{ color: isFilterActive ? '#4f46e5' : 'var(--admin-text-muted, #64748b)' }} />
              <span>Filters</span>
              {isFilterActive && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#4f46e5',
                  color: '#ffffff',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 800,
                  height: 18,
                  minWidth: 18,
                  padding: '0 5px',
                  lineHeight: 1
                }}>
                  {effectiveFilterCount > 0 ? effectiveFilterCount : '•'}
                </span>
              )}
              {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {/* Reset / Clear Filters */}
          {isFilterActive && onClearFilters && activeFilters.length === 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                height: 38,
                padding: '0 11px',
                borderRadius: 9,
                border: '1px solid rgba(220, 38, 38, 0.25)',
                background: 'rgba(220, 38, 38, 0.06)',
                color: '#dc2626',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Reset all filters"
            >
              <X size={13} />
              <span>Clear</span>
            </button>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 38,
                padding: '0 13px',
                borderRadius: 9,
                border: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-card-bg, #ffffff)',
                color: 'var(--admin-text, #334155)',
                fontSize: 13,
                fontWeight: 600,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                opacity: refreshing ? 0.7 : 1,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!refreshing) e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                if (!refreshing) e.currentTarget.style.background = 'var(--admin-card-bg, #ffffff)'
              }}
              title="Refresh data"
            >
              <RefreshCw size={13} className={refreshing ? 'spin-icon' : ''} />
              <span className="hide-on-mobile">Refresh</span>
            </button>
          )}

          {/* Extra Custom Page Actions */}
          {actions}
        </div>
      </div>

      {/* ── Collapsible Advanced Filters Section ── */}
      {hasAdvancedFilters && showFilters && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--admin-border, #e2e8f0)',
          animation: 'toolbarSlideDown 0.18s ease-out'
        }}>
          <div style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {children}
          </div>
        </div>
      )}

      {/* ── Active Filters Chip Row (Removable Chips) ── */}
      {activeFilters.length > 0 && (
        <div style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid var(--admin-border, #f1f5f9)',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
          animation: 'toolbarSlideDown 0.15s ease-out'
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--admin-text-muted, #64748b)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginRight: 4
          }}>
            Active Filters:
          </span>

          {activeFilters.map((chip, idx) => (
            <span
              key={chip.key || idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px 3px 10px',
                borderRadius: 9999,
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.22)',
                color: '#4338ca',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.2
              }}
            >
              <span>{chip.label}</span>
              {chip.onRemove && (
                <button
                  type="button"
                  onClick={chip.onRemove}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4338ca'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none'
                    e.currentTarget.style.color = '#6366f1'
                  }}
                  title={`Remove ${chip.label}`}
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              )}
            </span>
          ))}

          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 8px',
                marginLeft: 4,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                transition: 'opacity 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.75'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Optional Inline Show Entries Counter ── */}
      {(onPerPageChange || totalEntries != null) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid var(--admin-border, #f1f5f9)',
          fontSize: 12,
          color: 'var(--admin-text-muted, #64748b)',
          fontWeight: 500,
          flexWrap: 'wrap',
          gap: 6
        }}>
          {onPerPageChange && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Show</span>
              <select
                value={perPage}
                onChange={(e) => onPerPageChange(Number(e.target.value))}
                style={{
                  height: 28,
                  padding: '0 6px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-border, #e2e8f0)',
                  background: 'var(--admin-card-bg, #ffffff)',
                  color: 'var(--admin-text, #0f172a)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>
          )}

          {totalEntries != null && (
            <div style={{ marginLeft: 'auto' }}>
              Showing <strong>{totalEntries === 0 ? 0 : (fromEntry ?? 1)}</strong>–<strong>{toEntry ?? totalEntries}</strong> of <strong>{totalEntries}</strong>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes toolbarSlideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .hide-on-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}

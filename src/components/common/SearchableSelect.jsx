// src/components/common/SearchableSelect.jsx
import React, { useState, useRef, useEffect } from 'react'

/**
 * Enterprise Reusable SearchableSelect Component
 *
 * Used across admin filter toolbars and form pages.
 * Features:
 * - Click-outside and Escape key dismissal
 * - In-memory live search across option `name` and optional `subtext`
 * - Supports disabled and error validation states
 * - Fluid sizing for both filter bars (default 42px) and form inputs (48px)
 * - Pure CSS variables for theme compatibility
 */
export default function SearchableSelect({
  id,
  label,
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error = '',
  size = 'md', // 'md' for toolbar filters (42px), 'lg' for form inputs (48px)
  className = '',
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const strValue = value !== null && value !== undefined ? String(value) : ''
  const selectedOption = options.find((opt) => String(opt.id) === strValue)

  const filteredOptions = options
    .filter((opt) => {
      const q = search.toLowerCase()
      const matchName = opt.name?.toLowerCase().includes(q)
      const matchSubtext = opt.subtext?.toLowerCase().includes(q)
      return matchName || matchSubtext
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  const isLarge = size === 'lg' || Boolean(error)
  const height = isLarge ? 48 : 42
  const borderRadius = isLarge ? 12 : 10
  const fontSize = isLarge ? 14 : 13
  const padding = isLarge ? '0 16px' : '0 14px'

  return (
    <div
      id={id}
      className={`searchable-select-container ${className}`}
      ref={dropdownRef}
      style={{
        position: 'relative',
        flex: '1 1 200px',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {label && (
        <label
          style={{
            fontSize: isLarge ? 13 : 11,
            fontWeight: 700,
            color: 'var(--admin-text-muted)',
            display: 'block',
            marginBottom: 6,
            textTransform: isLarge ? 'none' : 'uppercase',
            letterSpacing: isLarge ? 'normal' : '0.05em',
          }}
        >
          {label}
        </label>
      )}

      <div
        className={`status-select ${error ? 'border-red-500' : ''}`}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? 'var(--admin-bg)' : 'var(--admin-card-bg)',
          height,
          padding,
          border: error ? '1.5px solid #ef4444' : '1px solid var(--admin-border)',
          borderRadius,
          fontSize,
          fontWeight: 500,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s',
          color: 'var(--admin-text)',
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
      >
        <span
          style={{
            color: selectedOption ? 'var(--admin-text)' : 'var(--admin-text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span style={{ fontSize: 10, color: 'var(--admin-text-muted)', marginLeft: 8 }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border)',
            borderRadius: 12,
            marginTop: 6,
            boxShadow: 'var(--admin-shadow-lg, 0 10px 25px rgba(0,0,0,0.1))',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--admin-border)',
              background: 'var(--admin-bg)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type to search..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13,
                width: '100%',
                color: 'var(--admin-text)',
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '20px 14px',
                  textAlign: 'center',
                  color: 'var(--admin-text-muted)',
                  fontSize: 12,
                }}
              >
                No matching results
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = strValue === String(opt.id)
                return (
                  <div
                    key={opt.id}
                    style={{
                      padding: '10px 14px',
                      fontSize: 13,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(0, 168, 140, 0.1)' : 'transparent',
                      borderBottom: '1px solid var(--admin-border)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(0, 168, 140, 0.05)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                    onClick={() => {
                      onChange(String(opt.id))
                      setIsOpen(false)
                      setSearch('')
                    }}
                  >
                    <div
                      style={{
                        fontWeight: isSelected ? 700 : 500,
                        color: 'var(--admin-text)',
                      }}
                    >
                      {opt.name}
                    </div>
                    {opt.subtext && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--admin-text-muted)',
                          marginTop: 2,
                        }}
                      >
                        {opt.subtext}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

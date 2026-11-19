import React, { forwardRef, useEffect, useRef } from 'react'

const CustomCheckbox = forwardRef(function CustomCheckbox(
  {
    checked = false,
    indeterminate = false,
    onChange,
    disabled = false,
    size = 18,
    color = '#10B981',
    style,
    className = '',
    id,
    name,
    value,
    title,
    ...rest
  },
  ref
) {
  const innerRef = useRef(null)
  const inputRef = ref || innerRef

  useEffect(() => {
    if (inputRef && 'current' in inputRef && inputRef.current) {
      inputRef.current.indeterminate = Boolean(indeterminate && !checked)
    }
  }, [indeterminate, checked, inputRef])

  const isChecked = Boolean(checked)
  const isIndeterminate = Boolean(indeterminate && !checked)

  return (
    <span
      className={className}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        flexShrink: 0,
        verticalAlign: 'middle',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        userSelect: 'none',
        ...style,
      }}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        onChange={onChange}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          opacity: 0,
          zIndex: 2,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        {...rest}
      />
      <span
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: 5,
          border: isChecked || isIndeterminate ? `1.5px solid ${color}` : '1.5px solid #CBD5E1',
          background: isChecked || isIndeterminate ? color : '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease-in-out',
          boxShadow: isChecked || isIndeterminate ? '0 1px 3px rgba(16, 185, 129, 0.3)' : '0 1px 2px rgba(0,0,0,0.04)',
          pointerEvents: 'none',
        }}
      >
        {isChecked && (
          <svg
            width={Math.round(size * 0.65)}
            height={Math.round(size * 0.65)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {isIndeterminate && (
          <svg
            width={Math.round(size * 0.65)}
            height={Math.round(size * 0.65)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </span>
    </span>
  )
})

export default CustomCheckbox

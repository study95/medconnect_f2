import React from 'react'

/**
 * Reusable Clinical Preset Chips Component
 * Provides rapid single-click preset selection for dosage, duration, instructions, etc.
 * Associated inputs remain 100% manually editable.
 */
export default function ClinicalPresetChips({
  value = '',
  options = [],
  onSelect,
  className = '',
  ariaLabel = 'Clinical Presets'
}) {
  if (!options || options.length === 0) return null

  return (
    <div className={`ecw-chip-container ${className}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = value === option
        return (
          <button
            key={option}
            type="button"
            className={`ecw-chip-btn ${isSelected ? 'ecw-chip-selected' : ''}`}
            onClick={() => onSelect(option)}
            aria-pressed={isSelected}
            aria-label={`Preset ${option}`}
            title={option}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

// MedicineFormPage.jsx — Add/Edit medicine form with smart creatable suggestions & modern UI
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../../context/AuthContext'
import { getMedicine, createMedicine, updateMedicine, getMedicineSuggestions } from '../../../api/adminApi'
import { getErrorMessage } from '../../../utils/errorHelper'

const DOSAGE_TYPES = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Drop',
  'Injection',
  'Suspension',
  'Suppository',
  'Ointment',
  'Cream',
  'Gel',
  'Spray',
  'Inhaler',
]

const dosageColors = {
  TAB: { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
  TABLET: { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
  'TABLET (TAB)': { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
  CAP: { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
  CAPSULE: { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
  'CAPSULE (CAP)': { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
  SYP: { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  SYRUP: { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  'SYRUP (SYP)': { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  DROP: { bg: '#D1FAE5', color: '#047857', border: '#A7F3D0' },
  DROPS: { bg: '#D1FAE5', color: '#047857', border: '#A7F3D0' },
  'DROP (DROP)': { bg: '#D1FAE5', color: '#047857', border: '#A7F3D0' },
  INJ: { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
  INJECTION: { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
  'INJECTION (INJ)': { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
  SUSP: { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' },
  SUSPENSION: { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' },
  'SUSPENSION (SUSP)': { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' },
  SUPP: { bg: '#FCE7F3', color: '#BE185D', border: '#FBCFE8' },
  SUPPOSITORY: { bg: '#FCE7F3', color: '#BE185D', border: '#FBCFE8' },
  'SUPPOSITORY (SUPP)': { bg: '#FCE7F3', color: '#BE185D', border: '#FBCFE8' },
  OINT: { bg: '#F3E8FF', color: '#7E22CE', border: '#E9D5FF' },
  OINTMENT: { bg: '#F3E8FF', color: '#7E22CE', border: '#E9D5FF' },
  'OINTMENT (OINT)': { bg: '#F3E8FF', color: '#7E22CE', border: '#E9D5FF' },
  CREAM: { bg: '#ECFCCB', color: '#4D7C0F', border: '#D9F99D' },
  'CREAM (CREAM)': { bg: '#ECFCCB', color: '#4D7C0F', border: '#D9F99D' },
  GEL: { bg: '#E0E7FF', color: '#4338CA', border: '#C7D2FE' },
  'GEL (GEL)': { bg: '#E0E7FF', color: '#4338CA', border: '#C7D2FE' },
  SPRAY: { bg: '#CCFBF1', color: '#0F766E', border: '#99F6E4' },
  'SPRAY (SPRAY)': { bg: '#CCFBF1', color: '#0F766E', border: '#99F6E4' },
  INHALER: { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
  'INHALER (INHALER)': { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
}

const DOSAGE_DISPLAY_MAP = {
  TAB: 'Tablet',
  TABLET: 'Tablet',
  CAP: 'Capsule',
  CAPSULE: 'Capsule',
  SYP: 'Syrup',
  SYRUP: 'Syrup',
  DROP: 'Drop',
  DROPS: 'Drop',
  INJ: 'Injection',
  INJECTION: 'Injection',
  SUSP: 'Suspension',
  SUSPENSION: 'Suspension',
  SUPP: 'Suppository',
  SUPPOSITORY: 'Suppository',
  OINT: 'Ointment',
  OINTMENT: 'Ointment',
  CREAM: 'Cream',
  GEL: 'Gel',
  SPRAY: 'Spray',
  INHALER: 'Inhaler',
}

const getDosageDisplay = (type) => {
  if (!type) return ''
  const upper = String(type).trim().toUpperCase()
  return DOSAGE_DISPLAY_MAP[upper] || type
}

/**
 * CreatableSuggestionInput
 * Modern, elegant, auto-positioning combobox input that prevents clipping.
 */
function CreatableSuggestionInput({
  label,
  name,
  value = '',
  onChange,
  placeholder,
  error,
  field,
  icon,
  required = false,
  onSelectRichItem,
  staticSuggestions = [],
  autoFocus = false,
  tooltip,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [openUpward, setOpenUpward] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const debounceTimer = useRef(null)

  const checkDirection = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      // If space below is less than 240px and there's more room above, flip upward
      if (spaceBelow < 250 && rect.top > 250) {
        setOpenUpward(true)
      } else {
        setOpenUpward(false)
      }
    }
  }

  const fetchSuggestions = async (searchTerm) => {
    setLoading(true)
    try {
      const res = await getMedicineSuggestions({ field, query: searchTerm })
      const data = res.data?.data || []

      if (staticSuggestions.length > 0) {
        const queryLower = String(searchTerm).toLowerCase().trim()
        const filteredStatic = staticSuggestions.filter((s) =>
          String(s).toLowerCase().includes(queryLower)
        )
        const combined = Array.from(new Set([...data, ...filteredStatic]))
        setSuggestions(combined)
      } else {
        setSuggestions(data)
      }
    } catch (err) {
      console.error('Error fetching suggestions for', field, err)
      if (staticSuggestions.length > 0) {
        const queryLower = String(searchTerm).toLowerCase().trim()
        setSuggestions(
          staticSuggestions.filter((s) =>
            String(s).toLowerCase().includes(queryLower)
          )
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const newVal = e.target.value
    onChange(name, newVal)
    setHighlightIndex(-1)
    checkDirection()
    setIsOpen(true)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newVal)
    }, 180)
  }

  const handleFocus = () => {
    setIsFocused(true)
    checkDirection()
    setIsOpen(true)
    fetchSuggestions(value || '')
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleScroll = () => {
      if (isOpen) checkDirection()
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [isOpen])

  const handleSelect = (item) => {
    if (field === 'medicine_name' && typeof item === 'object') {
      onChange(name, item.medicine_name || '')
      if (onSelectRichItem) {
        onSelectRichItem(item)
      }
    } else {
      const textVal = typeof item === 'object' ? item.name || '' : String(item)
      onChange(name, textVal)
    }
    setIsOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown') {
        checkDirection()
        setIsOpen(true)
        fetchSuggestions(value || '')
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        e.preventDefault()
        handleSelect(suggestions[highlightIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const isExactMatch = suggestions.some((s) => {
    const text = typeof s === 'object' ? s.medicine_name : String(s)
    return text.trim().toLowerCase() === String(value).trim().toLowerCase()
  })

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--admin-text, #1E293B)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
        {tooltip && (
          <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #94A3B8)' }}>
            {tooltip}
          </span>
        )}
      </div>

      {/* Input Field Container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--admin-card-bg, #FFFFFF)',
          borderRadius: 10,
          border: error
            ? '1.5px solid #EF4444'
            : isFocused
            ? '1.5px solid #10B981'
            : '1.5px solid var(--admin-border, #E2E8F0)',
          boxShadow: isFocused
            ? error
              ? '0 0 0 3px rgba(239, 68, 68, 0.12)'
              : '0 0 0 3px rgba(16, 185, 129, 0.14)'
            : '0 1px 2px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Left Field Icon */}
        <span
          style={{
            paddingLeft: 14,
            paddingRight: 10,
            color: isFocused ? '#10B981' : 'var(--admin-text-muted, #94A3B8)',
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none',
          }}
        >
          {icon || '✎'}
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          style={{
            flex: 1,
            height: 42,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--admin-text, #0F172A)',
            fontSize: 14,
            fontWeight: 500,
            padding: '0 8px 0 0',
          }}
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(name, '')
              setSuggestions([])
              setIsOpen(false)
              if (inputRef.current) inputRef.current.focus()
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--admin-text-muted, #94A3B8)',
              cursor: 'pointer',
              fontSize: 14,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              transition: 'color 0.15s',
            }}
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(openUpward
              ? { bottom: 'calc(100% + 6px)', top: 'auto' }
              : { top: 'calc(100% + 6px)', bottom: 'auto' }),
            left: 0,
            right: 0,
            background: 'var(--admin-card-bg, #FFFFFF)',
            border: '1px solid var(--admin-border, #E2E8F0)',
            borderRadius: 12,
            boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.14), 0 6px 16px -4px rgba(0, 0, 0, 0.06)',
            zIndex: 1080,
            maxHeight: 250,
            overflowY: 'auto',
            padding: '6px',
            animation: 'fadeInSlide 0.15s ease',
          }}
        >
          {loading ? (
            <div style={{ padding: '14px', fontSize: 13, color: 'var(--admin-text-muted, #64748B)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="spinner-border spinner-border-sm" role="status" style={{ width: 14, height: 14 }} />
              Searching suggestions...
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              <div
                style={{
                  padding: '6px 10px 4px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--admin-text-muted, #94A3B8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Suggested ({suggestions.length})</span>
                <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.8 }}>Click to select</span>
              </div>
              {suggestions.map((item, idx) => {
                const itemText = typeof item === 'object' ? item.medicine_name : String(item)
                const isHighlighted = idx === highlightIndex
                const isSelected = String(value).trim().toLowerCase() === String(itemText).trim().toLowerCase()

                return (
                  <div
                    key={typeof item === 'object' ? item.id : `${item}-${idx}`}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelect(item)
                    }}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isHighlighted
                        ? 'rgba(16, 185, 129, 0.08)'
                        : isSelected
                        ? 'rgba(16, 185, 129, 0.04)'
                        : 'transparent',
                      transition: 'background 0.1s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 2,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#10B981' : 'var(--admin-text, #0F172A)',
                        }}
                      >
                        {itemText}
                      </div>
                      {typeof item === 'object' && (item.generic_name || item.dosage_type || item.company_name) && (
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', marginTop: 2 }}>
                          {[item.dosage_type, item.generic_name, item.strength, item.company_name]
                            .filter(Boolean)
                            .join(' • ')}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--admin-text-muted, #64748B)' }}>
              {value ? (
                <div>
                  No previous match. <strong>"{value}"</strong> will be saved as new.
                </div>
              ) : (
                <div>Type to view suggestions or enter a new value.</div>
              )}
            </div>
          )}

          {/* New entry notice */}
          {value.trim() && !isExactMatch && (
            <div
              style={{
                marginTop: 4,
                padding: '8px 12px',
                background: 'rgba(16, 185, 129, 0.06)',
                borderRadius: 8,
                fontSize: 12,
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>✨</span>
              <span>
                New value: <strong>"{value}"</strong> will be accepted
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MedicineFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission, isAdmin, loading: authLoading } = useAuth()
  const isEdit = !!id

  useEffect(() => {
    if (!authLoading) {
      const canCreate = !isEdit && (isAdmin || hasPermission('medicine.create'))
      const canUpdate = isEdit && (isAdmin || hasPermission('medicine.update'))

      if (!isAdmin && !canCreate && !canUpdate) {
        navigate('/admin/medicines')
      }
    }
  }, [authLoading, isAdmin, hasPermission, isEdit, navigate])

  const [form, setForm] = useState({
    medicine_name: '',
    generic_name: '',
    strength: '',
    dosage_type: '',
    company_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) loadMedicine()
  }, [id])

  const loadMedicine = async () => {
    setLoading(true)
    try {
      const res = await getMedicine(id)
      const med = res.data?.data || res.data
      setForm({
        medicine_name: med.medicine_name || '',
        generic_name: med.generic_name || '',
        strength: med.strength || '',
        dosage_type: med.dosage_type || '',
        company_name: med.company_name || '',
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load medicine details')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldName, val) => {
    setForm((prev) => ({ ...prev, [fieldName]: val }))
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: null }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.medicine_name || !form.medicine_name.trim()) errs.medicine_name = 'Medicine name is required'
    if (!form.dosage_type || !form.dosage_type.trim()) errs.dosage_type = 'Dosage type is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      if (isEdit) {
        await updateMedicine(id, form)
        toast.success('Medicine updated successfully')
      } else {
        await createMedicine(form)
        toast.success('Medicine created successfully')
      }
      setTimeout(() => navigate('/admin/medicines'), 500)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save medicine'))
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>

  const typeColor = dosageColors[form.dosage_type] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      {/* Page Header */}
      <div className="admin-page-header" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--admin-text-muted, #64748B)', marginBottom: 4 }}>
            <Link to="/admin/medicines" style={{ color: 'inherit', textDecoration: 'none' }}>Medicines</Link>
            <span>/</span>
            <span style={{ color: 'var(--admin-text, #0F172A)', fontWeight: 600 }}>{isEdit ? 'Edit' : 'Create'}</span>
          </div>
          <h2 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800 }}>
            <span style={{ fontSize: 24 }}>💊</span> {isEdit ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>
          <p className="admin-page-subtitle">
            {isEdit
              ? 'Update medicine details, generic formula, and manufacturer'
              : 'Add a new pharmaceutical product with smart database suggestions'}
          </p>
        </div>
        <Link
          to="/admin/medicines"
          className="admin-btn admin-btn-outline"
          style={{ height: 40, padding: '0 16px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          ← Back to List
        </Link>
      </div>

      {/* Main Form Card — Explicit overflow visible to avoid clipping */}
      <div
        className="admin-card"
        style={{
          overflow: 'visible',
          borderRadius: 16,
          border: '1px solid var(--admin-border, #E2E8F0)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          className="admin-card-body"
          style={{
            overflow: 'visible',
            padding: '32px 36px 40px',
          }}
        >
          {/* Live Preview Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 100%)',
              border: '1.5px solid #BBF7D0',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  color: '#FFFFFF',
                  boxShadow: '0 3px 8px rgba(16, 185, 129, 0.25)',
                }}
              >
                💊
              </div>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#059669',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  LIVE PREVIEW
                </span>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                    {form.medicine_name || 'Medicine Name'}
                  </span>
                  {form.strength && (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#475569',
                        background: '#F1F5F9',
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {form.strength}
                    </span>
                  )}
                  {form.dosage_type && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: typeColor.bg,
                        color: typeColor.color,
                        border: `1px solid ${typeColor.border}`,
                        padding: '2px 8px',
                        borderRadius: 6,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {getDosageDisplay(form.dosage_type)}
                    </span>
                  )}
                </div>
                {(form.generic_name || form.company_name) && (
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748B)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {form.generic_name && (
                      <span>Generic: <strong style={{ color: 'var(--admin-text, #334155)' }}>{form.generic_name}</strong></span>
                    )}
                    {form.generic_name && form.company_name && <span>•</span>}
                    {form.company_name && (
                      <span>Company: <strong style={{ color: 'var(--admin-text, #334155)' }}>{form.company_name}</strong></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} style={{ overflow: 'visible' }}>
            {/* Medicine Name with Suggestions */}
            <CreatableSuggestionInput
              label="Medicine Name"
              name="medicine_name"
              field="medicine_name"
              icon="💊"
              value={form.medicine_name}
              onChange={handleFieldChange}
              placeholder="e.g., Napa, Seclo, Ace"
              error={errors.medicine_name}
              required
              autoFocus={!isEdit}
              tooltip="Brand name of medicine"
              onSelectRichItem={(med) => {
                setForm((prev) => ({
                  ...prev,
                  medicine_name: med.medicine_name || prev.medicine_name,
                  generic_name: prev.generic_name || med.generic_name || '',
                  dosage_type: prev.dosage_type || med.dosage_type || '',
                  strength: prev.strength || med.strength || '',
                  company_name: prev.company_name || med.company_name || '',
                }))
              }}
            />

            {/* Generic Name with Suggestions */}
            <CreatableSuggestionInput
              label="Generic Name (Group / Formula)"
              name="generic_name"
              field="generic_name"
              icon="🧬"
              value={form.generic_name}
              onChange={handleFieldChange}
              placeholder="e.g., Paracetamol, Omeprazole"
              tooltip="Therapeutic chemical formula"
            />

            {/* Dosage Type & Strength Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <CreatableSuggestionInput
                label="Dosage Type"
                name="dosage_type"
                field="dosage_type"
                icon="🏷️"
                value={form.dosage_type}
                onChange={handleFieldChange}
                placeholder="e.g., Tablet, Syrup, Capsule, Injection"
                error={errors.dosage_type}
                required
                staticSuggestions={DOSAGE_TYPES}
                tooltip="Tablet, syrup, capsule etc."
              />

              <CreatableSuggestionInput
                label="Strength (Power)"
                name="strength"
                field="strength"
                icon="⚡"
                value={form.strength}
                onChange={handleFieldChange}
                placeholder="e.g., 500mg, 20mg, 100ml"
                tooltip="Unit strength / concentration"
              />
            </div>

            {/* Company Name with Suggestions */}
            <CreatableSuggestionInput
              label="Pharmaceutical Company"
              name="company_name"
              field="company_name"
              icon="🏢"
              value={form.company_name}
              onChange={handleFieldChange}
              placeholder="e.g., Beximco, Square, Incepta, Renata"
              tooltip="Manufacturer / pharma brand"
            />

            {/* Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginTop: 32,
                paddingTop: 24,
                borderTop: '1px solid var(--admin-border, #E2E8F0)',
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '0 26px',
                  height: 44,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.15s ease',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" style={{ width: 14, height: 14 }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <span>✓</span> {isEdit ? 'Update Medicine' : 'Save Medicine'}
                  </>
                )}
              </button>

              <Link
                to="/admin/medicines"
                style={{
                  height: 44,
                  padding: '0 20px',
                  borderRadius: 10,
                  border: '1.5px solid var(--admin-border, #E2E8F0)',
                  background: 'transparent',
                  color: 'var(--admin-text, #475569)',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

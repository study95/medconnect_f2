import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { useQuery } from '@tanstack/react-query'
import useLocations from '../../hooks/useLocations'
import { getSpecialties, getDoctors } from '../../api/doctorApi'
import { getHospitals } from '../../api/hospitalApi'
import {
  IconSearch,
  IconMapPin,
  IconChevronDown,
  IconChevronRight,
  IconChevronLeft,
  IconChevronsDown,
  IconUserCheck,
  IconCalendarEvent,
  IconShieldCheck,
  IconHeadset,
  IconStethoscope,
  IconBuildingHospital,
  IconWriting,
  IconX,
  IconCheck,
  IconMicrophone,
  IconAdjustmentsHorizontal,
  IconUsers,
  IconReportMedical,
  IconArrowRight,
  IconHeart,
  IconStarFilled,
  IconActivity,
  IconBroadcast,
  IconPhone,
  IconDeviceTv,
  IconClock
} from '@tabler/icons-react'
import { getContent } from '../../utils/contentService'
import { getMediaUrl } from '../../utils/mediaUtils'
import { getDoctorUrl, getBookingUrl } from '../../utils/identifierHelper'
import { useFavorites } from '../../context/FavoritesContext'
import { useAuth } from '../../context/AuthContext'
import { trackLiveSerialByPhone } from '../../api/appointmentApi'
import ScrollReveal from '../common/ScrollReveal'
import QuickLiveSerialModal from '../common/QuickLiveSerialModal'

// ── Location Popup Picker ───────────────────────────────────────────────────
function LocationPopup({ onClose, onSelect }) {
  const {
    divisions, districts, upazilas, unions,
    selectedDivision, setSelectedDivision,
    selectedDistrict, setSelectedDistrict,
    selectedUpazila, setSelectedUpazila,
    selectedUnion, setSelectedUnion,
    loadingDistricts, loadingUpazilas, loadingUnions
  } = useLocations()

  const [step, setStep] = useState('division')
  const [divisionLabel, setDivisionLabel] = useState('')
  const [districtLabel, setDistrictLabel] = useState('')
  const [upazilaLabel, setUpazilaLabel] = useState('')

  const handleDivisionClick = (div) => {
    setSelectedDivision(div.id)
    setDivisionLabel(div.name || div.bangla_name)
    setStep('district')
  }

  const handleDistrictClick = (dist) => {
    setSelectedDistrict(dist.id)
    setDistrictLabel(dist.name || dist.bangla_name)
    setStep('upazila')
  }

  const handleUpazilaClick = (upz) => {
    setSelectedUpazila(upz.id)
    setUpazilaLabel(upz.name || upz.bangla_name)
    setStep('union')
  }

  const handleUnionClick = (union) => {
    setSelectedUnion(union.id)
    const label = `${divisionLabel} > ${districtLabel} > ${upazilaLabel} > ${union.name || union.bangla_name}`
    onSelect({ division_id: selectedDivision, district_id: selectedDistrict, upazila_id: selectedUpazila, union_id: union.id, label })
    onClose()
  }

  const handleConfirmWithoutUnion = () => {
    let label = divisionLabel
    if (districtLabel) label += ` > ${districtLabel}`
    if (upazilaLabel) label += ` > ${upazilaLabel}`
    onSelect({ division_id: selectedDivision, district_id: selectedDistrict || '', upazila_id: selectedUpazila || '', union_id: '', label })
    onClose()
  }

  // ── Back navigation: go one step back, reset child selections ──
  const goBack = () => {
    if (step === 'district') {
      setSelectedDivision(''); setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('')
      setDivisionLabel(''); setDistrictLabel(''); setUpazilaLabel('')
      setStep('division')
    } else if (step === 'upazila') {
      setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('')
      setDistrictLabel(''); setUpazilaLabel('')
      setStep('district')
    } else if (step === 'union') {
      setSelectedUpazila(''); setSelectedUnion('')
      setUpazilaLabel('')
      setStep('upazila')
    }
  }

  // ── Clickable breadcrumb: jump to any previous step ──
  const goToStep = (targetStep) => {
    const order = ['division', 'district', 'upazila', 'union']
    const currentIdx = order.indexOf(step)
    const targetIdx = order.indexOf(targetStep)
    if (targetIdx >= currentIdx) return
    if (targetStep === 'division') {
      setSelectedDivision(''); setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('')
      setDivisionLabel(''); setDistrictLabel(''); setUpazilaLabel(''); setStep('division')
    } else if (targetStep === 'district') {
      setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('')
      setDistrictLabel(''); setUpazilaLabel(''); setStep('district')
    } else if (targetStep === 'upazila') {
      setSelectedUpazila(''); setSelectedUnion('')
      setUpazilaLabel(''); setStep('upazila')
    }
  }

  const stepLabels = {
    division: 'বিভাগ নির্বাচন করুন',
    district: 'জেলা নির্বাচন করুন',
    upazila: 'উপজেলা নির্বাচন করুন',
    union: 'ইউনিয়ন নির্বাচন করুন'
  }

  const getItems = () => {
    if (step === 'division') return divisions
    if (step === 'district') return districts
    if (step === 'upazila') return upazilas
    if (step === 'union') return unions
    return []
  }

  const isLoading =
    (step === 'district' && loadingDistricts) ||
    (step === 'upazila' && loadingUpazilas) ||
    (step === 'union' && loadingUnions)

  const breadcrumb = [divisionLabel, districtLabel, upazilaLabel].filter(Boolean)
  const breadcrumbSteps = ['division', 'district', 'upazila']

  return (
    <div className="loc-popup-overlay" onClick={onClose}>
      <div className="loc-popup-box" onClick={e => e.stopPropagation()}>

        {/* Header with back button */}
        <div className="loc-popup-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step !== 'division' && (
              <button className="loc-back-btn" onClick={goBack} title="পেছনে যান">
                <IconChevronLeft size={20} />
              </button>
            )}
            <div>
              <div className="loc-popup-title">{stepLabels[step]}</div>
              {breadcrumb.length > 0 && (
                <div className="loc-breadcrumb">
                  {breadcrumb.map((b, i) => (
                    <span
                      key={i}
                      className="loc-breadcrumb-item"
                      onClick={() => goToStep(breadcrumbSteps[i])}
                    >
                      {i > 0 && <IconChevronRight size={11} style={{ margin: '0 3px', opacity: 0.45 }} />}
                      <span>{b}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step !== 'division' && (
              <button className="loc-confirm-btn" onClick={handleConfirmWithoutUnion}>
                <IconCheck size={15} />
                <span>নিশ্চিত</span>
              </button>
            )}
            <button className="loc-close-btn" onClick={onClose}>
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Step tabs — clicking a done tab jumps back */}
        <div className="loc-steps">
          {['division', 'district', 'upazila', 'union'].map((s, idx) => {
            const labels = ['বিভাগ', 'জেলা', 'উপজেলা', 'ইউনিয়ন']
            const isActive = step === s
            const isDone = (
              (s === 'division' && selectedDivision && step !== 'division') ||
              (s === 'district' && selectedDistrict && step !== 'district') ||
              (s === 'upazila' && selectedUpazila && step !== 'upazila')
            )
            const isClickable = isDone
            return (
              <div
                key={s}
                className={`loc-step-tab ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isClickable ? 'clickable' : ''}`}
                onClick={isClickable ? () => goToStep(s) : undefined}
              >
                <span className="loc-step-num">{idx + 1}</span>
                <span>{labels[idx]}</span>
              </div>
            )
          })}
        </div>

        {/* List */}
        <div className="loc-list">
          {isLoading ? (
            <div className="loc-loading">লোড হচ্ছে...</div>
          ) : getItems().length === 0 ? (
            <div className="loc-empty">কোনো তথ্য পাওয়া যায়নি</div>
          ) : (
            getItems().map((item) => (
              <button
                key={item.id}
                className="loc-item"
                onClick={() => {
                  if (step === 'division') handleDivisionClick(item)
                  else if (step === 'district') handleDistrictClick(item)
                  else if (step === 'upazila') handleUpazilaClick(item)
                  else handleUnionClick(item)
                }}
              >
                <span>{item.name || item.bangla_name}</span>
                {step !== 'union' && <IconChevronRight size={16} className="loc-item-arrow" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared Searchable Popup (for Specialties, Hospitals, etc.) ──────────────
function SearchablePopup({ title, placeholder, items, getLabel, onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const inputRef = React.useRef(null)

  // Auto-focus search input when popup opens
  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  const filtered = query.trim()
    ? items.filter(item => {
        const label = getLabel(item) || ''
        return label.toLowerCase().includes(query.trim().toLowerCase())
      })
    : items

  return (
    <div className="loc-popup-overlay" onClick={onClose}>
      <div className="loc-popup-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="loc-popup-header">
          <div className="loc-popup-title">{title}</div>
          <button className="loc-close-btn" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="srch-popup-search">
          <IconSearch size={16} style={{ color: '#A0AEC0', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="srch-popup-input"
          />
          {query && (
            <button onClick={() => setQuery('')} className="srch-popup-clear">
              <IconX size={14} />
            </button>
          )}
        </div>

        {/* Results list */}
        <div className="loc-list">
          {filtered.length === 0 ? (
            <div className="loc-empty">
              {query ? `"${query}" পাওয়া যায়নি` : 'কোনো তথ্য পাওয়া যায়নি'}
            </div>
          ) : (
            filtered.map(item => (
              <button
                key={item.id}
                className="loc-item"
                onClick={() => onSelect(item)}
              >
                <span>{getLabel(item)}</span>
                <IconCheck size={15} className="srch-item-check" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Unified Location Tab ─────────────────────────────────────────────
function UnifiedLocationTab({ locationParams, setLocationParams, locationLabel, setLocationLabel }) {
  const {
    divisions, districts, upazilas,
    selectedDivision, setSelectedDivision,
    selectedDistrict, setSelectedDistrict,
    selectedUpazila, setSelectedUpazila,
    loadingDistricts, loadingUpazilas
  } = useLocations()

  const [step, setStep] = useState(() => {
    if (locationParams.district_id) return 'upazila'
    if (locationParams.division_id) return 'district'
    return 'division'
  })

  const [divName, setDivName] = useState(() => {
    if (!locationLabel) return ''
    return locationLabel.split('>')[0]?.trim() || ''
  })
  const [distName, setDistName] = useState(() => {
    if (!locationLabel) return ''
    return locationLabel.split('>')[1]?.trim() || ''
  })

  useEffect(() => {
    if (locationParams.division_id && !selectedDivision) {
      setSelectedDivision(locationParams.division_id)
    }
    if (locationParams.district_id && !selectedDistrict) {
      setSelectedDistrict(locationParams.district_id)
    }
  }, [locationParams])

  const handleDivSelect = (div) => {
    setSelectedDivision(div.id)
    const name = div.bangla_name || div.name
    setDivName(name)
    setLocationParams(prev => ({ ...prev, division_id: div.id, district_id: '', upazila_id: '' }))
    setLocationLabel(name)
    setStep('district')
  }

  const handleDistSelect = (dist) => {
    setSelectedDistrict(dist.id)
    const name = dist.bangla_name || dist.name
    setDistName(name)
    setLocationParams(prev => ({
      ...prev,
      division_id: selectedDivision || prev?.division_id,
      district_id: dist.id,
      upazila_id: ''
    }))
    setLocationLabel(`${divName} > ${name}`)
    setStep('upazila')
  }

  const handleUpzSelect = (upz) => {
    setSelectedUpazila(upz.id)
    const name = upz.bangla_name || upz.name
    setLocationParams(prev => ({
      ...prev,
      division_id: selectedDivision || prev?.division_id,
      district_id: selectedDistrict || prev?.district_id,
      upazila_id: upz.id
    }))
    setLocationLabel(`${divName} > ${distName} > ${name}`)
  }

  const handleClearLocation = () => {
    setSelectedDivision('')
    setSelectedDistrict('')
    setSelectedUpazila('')
    setDivName('')
    setDistName('')
    setLocationLabel('')
    setLocationParams({})
    setStep('division')
  }

  return (
    <div className="unified-loc-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
      {locationLabel && (
        <div className="unified-loc-selected-bar">
          <div className="d-flex align-items-center gap-2">
            <IconMapPin size={16} color="#00803D" />
            <span className="unified-loc-selected-text">
              <strong>নির্বাচিত:</strong> {locationLabel}
            </span>
          </div>
          <button type="button" onClick={handleClearLocation} className="unified-loc-clear-btn" title="মুছে ফেলুন">
            <IconX size={16} />
          </button>
        </div>
      )}

      <div className="unified-loc-nav-bar">
        {step !== 'division' && (
          <button
            type="button"
            className="unified-loc-back-btn"
            onClick={() => {
              if (step === 'upazila') setStep('district')
              else if (step === 'district') setStep('division')
            }}
          >
            <IconChevronLeft size={16} /> পূর্ববর্তী
          </button>
        )}
        <span className="unified-loc-step-title">
          {step === 'division' && 'বিভাগ নির্বাচন করুন:'}
          {step === 'district' && `${divName} এর জেলা নির্বাচন করুন:`}
          {step === 'upazila' && `${distName} এর উপজেলা নির্বাচন করুন:`}
        </span>
      </div>

      <div className="unified-loc-grid">
        {step === 'division' && (
          divisions?.map((div) => {
            const isSel = locationParams.division_id === div.id
            return (
              <button
                key={div.id}
                type="button"
                className={`unified-loc-card ${isSel ? 'active' : ''}`}
                onClick={() => handleDivSelect(div)}
              >
                <IconMapPin size={16} color={isSel ? '#00803D' : '#64748B'} />
                <span>{div.bangla_name || div.name}</span>
                {isSel && <IconCheck size={14} color="#00803D" style={{ marginLeft: 'auto' }} />}
              </button>
            )
          })
        )}

        {step === 'district' && (
          loadingDistricts ? (
            <div style={{ gridColumn: '1 / -1', padding: '24px 0', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
              জেলা লোড হচ্ছে...
            </div>
          ) : (
            districts?.map((dist) => {
              const isSel = locationParams.district_id === dist.id
              return (
                <button
                  key={dist.id}
                  type="button"
                  className={`unified-loc-card ${isSel ? 'active' : ''}`}
                  onClick={() => handleDistSelect(dist)}
                >
                  <IconMapPin size={16} color={isSel ? '#00803D' : '#64748B'} />
                  <span>{dist.bangla_name || dist.name}</span>
                  {isSel && <IconCheck size={14} color="#00803D" style={{ marginLeft: 'auto' }} />}
                </button>
              )
            })
          )
        )}

        {step === 'upazila' && (
          loadingUpazilas ? (
            <div style={{ gridColumn: '1 / -1', padding: '24px 0', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
              উপজেলা লোড হচ্ছে...
            </div>
          ) : (
            upazilas?.map((upz) => {
              const isSel = locationParams.upazila_id === upz.id
              return (
                <button
                  key={upz.id}
                  type="button"
                  className={`unified-loc-card ${isSel ? 'active' : ''}`}
                  onClick={() => handleUpzSelect(upz)}
                >
                  <IconMapPin size={16} color={isSel ? '#00803D' : '#64748B'} />
                  <span>{upz.bangla_name || upz.name}</span>
                  {isSel && <IconCheck size={14} color="#00803D" style={{ marginLeft: 'auto' }} />}
                </button>
              )
            })
          )
        )}
      </div>
    </div>
  )
}

// ── Unified Specialty Tab ──────────────────────────────────────────
function UnifiedSpecialtyTab({
  activeSpecialtiesList,
  selectedSpecialty,
  setSelectedSpecialty,
  specialtyLabel,
  setSpecialtyLabel,
  getMobileSpecialtyMeta
}) {
  const [specQuery, setSpecQuery] = useState('')

  const filtered = activeSpecialtiesList.filter(s => {
    if (!specQuery.trim()) return true
    const q = specQuery.trim().toLowerCase()
    const bn = (s.name_bn || s.title_bn || s.name || '').toLowerCase()
    const en = (s.name_en || s.title_en || s.name || '').toLowerCase()
    return bn.includes(q) || en.includes(q)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
      <div className="hero-mobile-specialties-popup-search" style={{ padding: '0 0 12px 0', background: 'transparent', flexShrink: 0 }}>
        <div className="hero-mobile-specialties-search-box">
          <IconSearch size={18} color="#00803D" />
          <input
            type="text"
            placeholder="বিভাগের নাম লিখে খুঁজুন (মেডিসিন, হৃদরোগ...)"
            value={specQuery}
            onChange={(e) => setSpecQuery(e.target.value)}
            className="hero-mobile-specialties-search-input"
          />
          {specQuery && (
            <button
              type="button"
              onClick={() => setSpecQuery('')}
              className="hero-mobile-specialties-search-clear"
            >
              <IconX size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="hero-mobile-specialties-popup-grid" style={{ padding: '0', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {filtered.map(spec => {
          const meta = getMobileSpecialtyMeta(spec)
          const isSel = String(selectedSpecialty) === String(spec.id) || specialtyLabel === (spec.name_bn || meta.name)
          return (
            <div
              key={spec.id || meta.name}
              className={`hero-mobile-specialties-popup-card unified-spec-card ${isSel ? 'active' : ''}`}
              style={{
                backgroundColor: isSel ? '#E8F8F2' : meta.bg,
                borderColor: isSel ? '#00803D' : meta.border,
                borderWidth: isSel ? '2px' : '1px',
                position: 'relative',
                boxShadow: isSel ? '0 4px 12px rgba(0, 128, 61, 0.18)' : 'none'
              }}
              onClick={() => {
                if (isSel) {
                  setSelectedSpecialty('')
                  setSpecialtyLabel('')
                } else {
                  setSelectedSpecialty(spec.id)
                  setSpecialtyLabel(spec.name_bn || spec.name || meta.name)
                }
              }}
            >
              {isSel && (
                <div className="unified-card-badge">
                  <IconCheck size={11} color="#FFFFFF" stroke={3} />
                </div>
              )}
              <div className="hero-mobile-specialty-icon">
                {meta.icon}
              </div>
              <div className="hero-mobile-specialty-name" style={{ fontWeight: isSel ? 800 : 700, color: isSel ? '#006630' : '#1E293B' }}>
                {meta.name}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="hero-mobile-specialties-empty">
            <IconSearch size={32} color="#94A3B8" />
            <div>কোনো বিশেষজ্ঞ বিভাগ পাওয়া যায়নি</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Unified Hospital Tab ───────────────────────────────────────────
function UnifiedHospitalTab({
  hospitals,
  selectedHospital,
  setSelectedHospital,
  hospitalLabel,
  setHospitalLabel
}) {
  const [hospQuery, setHospQuery] = useState('')

  const filteredHospitals = (hospitals || []).filter(h => {
    if (!hospQuery.trim()) return true
    const q = hospQuery.trim().toLowerCase()
    const bn = (h.name_bn || h.name || '').toLowerCase()
    const en = (h.name || '').toLowerCase()
    const loc = (h.address || h.city || '').toLowerCase()
    return bn.includes(q) || en.includes(q) || loc.includes(q)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
      <div className="hero-mobile-specialties-popup-search" style={{ padding: '0 0 12px 0', background: 'transparent', flexShrink: 0 }}>
        <div className="hero-mobile-specialties-search-box">
          <IconSearch size={18} color="#00803D" />
          <input
            type="text"
            placeholder="হাসপাতালের নাম লিখে খুঁজুন..."
            value={hospQuery}
            onChange={(e) => setHospQuery(e.target.value)}
            className="hero-mobile-specialties-search-input"
          />
          {hospQuery && (
            <button
              type="button"
              onClick={() => setHospQuery('')}
              className="hero-mobile-specialties-search-clear"
            >
              <IconX size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="unified-hospital-list">
        {filteredHospitals.map(h => {
          const isSel = String(selectedHospital) === String(h.id) || hospitalLabel === (h.name_bn || h.name)
          return (
            <div
              key={h.id}
              className={`unified-hospital-card ${isSel ? 'active' : ''}`}
              onClick={() => {
                if (isSel) {
                  setSelectedHospital('')
                  setHospitalLabel('')
                } else {
                  setSelectedHospital(h.id)
                  setHospitalLabel(h.name_bn || h.name)
                }
              }}
            >
              <div className="unified-hospital-icon-box">
                <IconBuildingHospital size={20} color={isSel ? '#00803D' : '#00B875'} />
              </div>
              <div className="unified-hospital-info">
                <div className="unified-hospital-name">{h.name_bn || h.name}</div>
                {(h.address || h.city) && (
                  <div className="unified-hospital-sub">{h.address || h.city}</div>
                )}
              </div>
              {isSel ? (
                <div className="unified-check-circle active">
                  <IconCheck size={14} color="#FFFFFF" stroke={3} />
                </div>
              ) : (
                <div className="unified-check-circle" />
              )}
            </div>
          )
        })}
        {filteredHospitals.length === 0 && (
          <div className="hero-mobile-specialties-empty">
            <IconBuildingHospital size={32} color="#94A3B8" />
            <div>কোনো হাসপাতাল পাওয়া যায়নি</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Hero Section ───────────────────────────────────────────────
const HeroSection = memo(function HeroSection({ stats: propStats }) {
  const navigate = useNavigate()
  const [cms, setCms] = useState(getContent())
  useEffect(() => {
    const update = () => setCms(getContent())
    window.addEventListener('cms-updated', update)
    return () => window.removeEventListener('cms-updated', update)
  }, [])
  const hero = cms.hero || {}

  const line2Text = 'ডাক্তার বুকিং, আরো সহজ'
  const [typedLine2, setTypedLine2] = useState('')

  useEffect(() => {
    let isMounted = true
    let charIndex = 0
    let isDeleting = false
    let timeoutId = null

    function typeLoop() {
      if (!isMounted) return

      if (!isDeleting) {
        setTypedLine2(line2Text.slice(0, charIndex))
        if (charIndex < line2Text.length) {
          charIndex++
          timeoutId = setTimeout(typeLoop, 85) // Smooth writing speed
        } else {
          isDeleting = true
          timeoutId = setTimeout(typeLoop, 3200) // Stay visible for 3.2s
        }
      } else {
        setTypedLine2(line2Text.slice(0, charIndex))
        if (charIndex > 0) {
          charIndex--
          timeoutId = setTimeout(typeLoop, 40)
        } else {
          isDeleting = false
          timeoutId = setTimeout(typeLoop, 500)
        }
      }
    }

    typeLoop()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [line2Text])

  const [showLocationPopup, setShowLocationPopup] = useState(false)
  const [locationLabel, setLocationLabel] = useState('')
  const [locationParams, setLocationParams] = useState({})

  const [showSpecialtyPopup, setShowSpecialtyPopup] = useState(false)
  const [specialtyLabel, setSpecialtyLabel] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')

  const [showHospitalPopup, setShowHospitalPopup] = useState(false)
  const [hospitalLabel, setHospitalLabel] = useState('')
  const [selectedHospital, setSelectedHospital] = useState('')

  const [searchText, setSearchText] = useState('')
  const [showLiveSerialModal, setShowLiveSerialModal] = useState(false)
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false)
  const [showUnifiedModal, setShowUnifiedModal] = useState(false)
  const [unifiedTab, setUnifiedTab] = useState('specialty')
  const [showAllSpecialtiesPopup, setShowAllSpecialtiesPopup] = useState(false)
  const [specialtySearchQuery, setSpecialtySearchQuery] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const [selectedDate, setSelectedDate] = useState('')
  const dateInputRef = useRef(null)

  // Unified Bottom Sheet drag-to-dismiss refs & handlers (Hardware Accelerated)
  const unifiedSheetRef = useRef(null)
  const unifiedOverlayRef = useRef(null)
  const sheetTouchStartY = useRef(0)
  const sheetCurrentY = useRef(0)
  const isSheetDragging = useRef(false)

  const closeUnifiedSheet = useCallback(() => {
    if (unifiedSheetRef.current) {
      unifiedSheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
      unifiedSheetRef.current.style.transform = 'translateY(100%)'
    }
    if (unifiedOverlayRef.current) {
      unifiedOverlayRef.current.style.transition = 'opacity 0.25s ease'
      unifiedOverlayRef.current.style.opacity = '0'
    }
    setTimeout(() => {
      setShowUnifiedModal(false)
      sheetCurrentY.current = 0
    }, 260)
  }, [])

  const handleSheetTouchStart = (e) => {
    sheetTouchStartY.current = e.touches[0].clientY
    sheetCurrentY.current = 0
    isSheetDragging.current = true
    if (unifiedSheetRef.current) {
      unifiedSheetRef.current.style.transition = 'none'
    }
    if (unifiedOverlayRef.current) {
      unifiedOverlayRef.current.style.transition = 'none'
    }
  }

  const handleSheetTouchMove = (e) => {
    if (!isSheetDragging.current) return
    const deltaY = e.touches[0].clientY - sheetTouchStartY.current
    if (deltaY > 0) {
      sheetCurrentY.current = deltaY
      if (unifiedSheetRef.current) {
        unifiedSheetRef.current.style.transform = `translateY(${deltaY}px)`
      }
      if (unifiedOverlayRef.current) {
        const opacity = Math.max(0, 1 - deltaY / 450)
        unifiedOverlayRef.current.style.opacity = opacity
      }
    }
  }

  const handleSheetTouchEnd = () => {
    if (!isSheetDragging.current) return
    isSheetDragging.current = false
    if (unifiedSheetRef.current) {
      unifiedSheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
    }
    if (unifiedOverlayRef.current) {
      unifiedOverlayRef.current.style.transition = 'opacity 0.28s ease'
    }

    if (sheetCurrentY.current > 100) {
      closeUnifiedSheet()
    } else {
      if (unifiedSheetRef.current) {
        unifiedSheetRef.current.style.transform = 'translateY(0px)'
      }
      if (unifiedOverlayRef.current) {
        unifiedOverlayRef.current.style.opacity = '1'
      }
      sheetCurrentY.current = 0
    }
  }

  // All Specialties Mobile Popup drag-to-dismiss refs & handlers (Hardware Accelerated)
  const specSheetRef = useRef(null)
  const specOverlayRef = useRef(null)
  const specSheetTouchStartY = useRef(0)
  const specSheetCurrentY = useRef(0)
  const isSpecSheetDragging = useRef(false)

  const closeSpecialtiesPopup = useCallback(() => {
    if (specSheetRef.current) {
      specSheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
      specSheetRef.current.style.transform = 'translateY(100%)'
    }
    if (specOverlayRef.current) {
      specOverlayRef.current.style.transition = 'opacity 0.25s ease'
      specOverlayRef.current.style.opacity = '0'
    }
    setTimeout(() => {
      setShowAllSpecialtiesPopup(false)
      specSheetCurrentY.current = 0
      if (specSheetRef.current) {
        specSheetRef.current.style.transform = ''
      }
    }, 260)
  }, [])

  const handleSpecSheetTouchStart = (e) => {
    specSheetTouchStartY.current = e.touches[0].clientY
    specSheetCurrentY.current = 0
    isSpecSheetDragging.current = true
    if (specSheetRef.current) {
      specSheetRef.current.style.transition = 'none'
    }
    if (specOverlayRef.current) {
      specOverlayRef.current.style.transition = 'none'
    }
  }

  const handleSpecSheetTouchMove = (e) => {
    if (!isSpecSheetDragging.current) return
    const deltaY = e.touches[0].clientY - specSheetTouchStartY.current
    if (deltaY > 0) {
      specSheetCurrentY.current = deltaY
      if (specSheetRef.current) {
        specSheetRef.current.style.transform = `translateY(${deltaY}px)`
      }
      if (specOverlayRef.current) {
        const opacity = Math.max(0, 1 - deltaY / 450)
        specOverlayRef.current.style.opacity = opacity
      }
    }
  }

  const handleSpecSheetTouchEnd = () => {
    if (!isSpecSheetDragging.current) return
    isSpecSheetDragging.current = false
    if (specSheetRef.current) {
      specSheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
    }
    if (specOverlayRef.current) {
      specOverlayRef.current.style.transition = 'opacity 0.28s ease'
    }

    if (specSheetCurrentY.current > 100) {
      closeSpecialtiesPopup()
    } else {
      if (specSheetRef.current) {
        specSheetRef.current.style.transform = 'translateY(0px)'
      }
      if (specOverlayRef.current) {
        specOverlayRef.current.style.opacity = '1'
      }
      specSheetCurrentY.current = 0
    }
  }

  // Prevent background scroll when any mobile bottom sheet is open
  useEffect(() => {
    if (showUnifiedModal || showAllSpecialtiesPopup) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showUnifiedModal, showAllSpecialtiesPopup])

  const getDateLabel = () => {
    if (!selectedDate) return 'তারিখ'
    const today = new Date().toISOString().split('T')[0]
    const tom = new Date()
    tom.setDate(tom.getDate() + 1)
    const tomorrow = tom.toISOString().split('T')[0]
    if (selectedDate === today) return 'আজ'
    if (selectedDate === tomorrow) return 'আগামীকাল'
    const parts = selectedDate.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`
    return selectedDate
  }

  const openDatePicker = (e) => {
    e.stopPropagation()
    if (dateInputRef.current) {
      if (dateInputRef.current.showPicker) {
        try {
          dateInputRef.current.showPicker()
          return
        } catch (err) {}
      }
      dateInputRef.current.focus()
      dateInputRef.current.click()
    }
  }

  const promoSlides = [
    {
      title1: 'বিশ্বস্ত ডাক্তারের',
      title2: 'সহজ অ্যাপয়েন্টমেন্ট',
      subtitle: 'আপনার ও পরিবারের স্বাস্থ্যসেবায় আমরা আছি আপনার পাশে',
      badgeNum: '10,000+',
      badgeLabel: 'বিশ্বস্ত ডাক্তার'
    },
    {
      title1: 'অনলাইন ও চেম্বার',
      title2: 'দ্রুত সিরিয়াল বুকিং',
      subtitle: 'বাংলাদেশের শীর্ষ বিশেষজ্ঞ ডাক্তার ও হাসপাতালের সাথে সরাসরি যোগাযোগ',
      badgeNum: '৫০০+',
      badgeLabel: 'টপ হাসপাতাল'
    },
    {
      title1: 'যাচাইকৃত বিশেষজ্ঞ',
      title2: 'নিরাপদ স্বাস্থ্যসেবা',
      subtitle: 'ঘরে বসেই যেকোনো রোগের বিশেষজ্ঞ ডাক্তার খুঁজে নিন নিমিষেই',
      badgeNum: '১০০%',
      badgeLabel: 'যাচাইকৃত প্রোফাইল'
    },
    {
      title1: 'জরুরি প্রয়োজনে',
      title2: '২৪/৭ সাপোর্ট',
      subtitle: 'সঠিক ডাক্তার ও চিকিৎসাসেবা নির্বাচনে আমরা সবসময় আপনার সাথে',
      badgeNum: '২৪/৭',
      badgeLabel: 'সহায়তা সেবা'
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % promoSlides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [promoSlides.length])

  useEffect(() => {
    const handleOpenLoc = () => setShowLocationPopup(true)
    window.addEventListener('open-hero-location-popup', handleOpenLoc)
    return () => window.removeEventListener('open-hero-location-popup', handleOpenLoc)
  }, [])

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = 'bn-BD'
        recognition.onresult = (event) => {
          const text = event.results?.[0]?.[0]?.transcript
          if (text) setSearchText(text)
        }
        recognition.start()
      } catch (err) {
        console.error(err)
      }
    } else {
      const el = document.querySelector('.hero-mobile-search-input')
      if (el) el.focus()
    }
  }

  // Fetch specialties — uses same cache key as useSpecialties() hook
  // → If useSpecialties() already fetched on this page, this is instant (cache hit)
  const specialtiesQuery = useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const res = await getSpecialties()
      return res.data?.data || res.data || []
    },
    staleTime: 30 * 60 * 1000
  })
  const specialties = specialtiesQuery.data || []

  // Fetch hospitals for filter popup
  const hospitalsQuery = useQuery({
    queryKey: ['hospitals-hero-list'],
    queryFn: async () => {
      const res = await getHospitals({ per_page: 50 })
      return res.data?.data || res.data || []
    },
    staleTime: 30 * 60 * 1000
  })
  const hospitals = hospitalsQuery.data || []

  const activeFiltersCount = [
    locationLabel ? 1 : 0,
    specialtyLabel ? 1 : 0,
    hospitalLabel ? 1 : 0,
    selectedDate ? 1 : 0
  ].reduce((a, b) => a + b, 0)

  const handleResetAllFilters = () => {
    setLocationLabel('')
    setLocationParams({})
    setSpecialtyLabel('')
    setSelectedSpecialty('')
    setHospitalLabel('')
    setSelectedHospital('')
    setSelectedDate('')
  }

  const { isDoctorFavorite, toggleFavoriteDoctor } = useFavorites()

  // Fetch today's doctors — uses same cache key as TodayDoctorsSection
  const todayDoctorsQuery = useQuery({
    queryKey: ['home-today-doctors'],
    queryFn: async () => {
      const res = await getDoctors({ date: 'today', per_page: 8 })
      const raw = res.data?.data || res.data || []
      return Array.isArray(raw) ? raw : []
    },
    staleTime: 5 * 60 * 1000
  })
  const todayDoctors = todayDoctorsQuery.data || []
  const loadingTodayDoctors = todayDoctorsQuery.isLoading

  // Helper converters for doctor card
  const enToBn = { '0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯' }
  const toBnNumber = (str) => (str !== null && str !== undefined && str !== '') ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

  const getDoctorSpecialtyTitle = (doc) => {
    if (doc.specialty_name) return doc.specialty_name
    if (doc.speciality_name) return doc.speciality_name
    if (doc.specialty?.name_bn || doc.specialty?.name) return doc.specialty.name_bn || doc.specialty.name
    if (Array.isArray(doc.specialties) && doc.specialties[0]) {
      const s = doc.specialties[0]
      return typeof s === 'object' ? (s.name_bn || s.name || s.title_bn || s.title) : s
    }
    if (doc.department?.name_bn || doc.department?.name) return doc.department.name_bn || doc.department.name
    if (doc.designation_bn || doc.designation) return doc.designation_bn || doc.designation
    return 'বিশেষজ্ঞ চিকিৎসক'
  }

  const getDoctorHospitalTitle = (doc) => {
    const matchedChamber = doc.matched_chamber || null
    const activeChamber = matchedChamber || doc.primary_chamber || (Array.isArray(doc.chambers) ? doc.chambers.find(c => c.is_primary && c.is_active !== false) || doc.chambers[0] : null)
    const name = activeChamber?.chamber_name_bn || activeChamber?.chamber_name || activeChamber?.hospital?.name_bn || activeChamber?.hospital?.name || doc.workplace_bn || doc.workplace || doc.hospital?.name
    const loc = activeChamber?.city || activeChamber?.district_name || activeChamber?.district?.name_bn || activeChamber?.district?.name || doc.district?.name_bn || doc.district?.name || ''
    if (name && loc) return `${name}, ${loc}`
    return name || loc || 'বিশেষজ্ঞ চেম্বার'
  }

  const getDoctorRating = (doc) => {
    const r = doc?.rating_avg ?? doc?.rating ?? doc?.average_rating ?? doc?.total_rating
    if (r !== undefined && r !== null && r !== '') {
      const num = Number(r)
      if (!isNaN(num) && num > 0) return num.toFixed(1)
    }
    return '5.0'
  }

  const getDoctorReviewsCount = (doc) => {
    const c = doc?.total_reviews ?? doc?.reviews_count ?? doc?.review_count ?? doc?.ratings_count ?? (Array.isArray(doc?.reviews) ? doc.reviews.length : null)
    if (c !== undefined && c !== null && c !== '') {
      const num = Number(c)
      if (!isNaN(num) && num > 0) return num
    }
    return 120
  }

  // Helper to get concise, clean specialty titles for mobile chips
  const cleanSpecialtyName = (rawName = '') => {
    const n = (rawName || '').trim()
    if (!n) return 'চিকিৎসা'
    const lower = n.toLowerCase()
    if (n.includes('হৃদরোগ') || n.includes('হার্ট') || lower.includes('cardio') || lower.includes('heart')) return 'হৃদরোগ'
    if (n.includes('অর্থোপেডিক') || n.includes('হাড়') || lower.includes('ortho') || lower.includes('bone')) return 'অর্থোপেডিক'
    if (n.includes('শিশু') || lower.includes('pediatric') || lower.includes('child')) return 'শিশু'
    if (n.includes('স্ত্রী') || n.includes('প্রসূতি') || n.includes('নারী') || n.includes('গাইনি') || lower.includes('gyne') || lower.includes('obs')) return 'নারী ও প্রসূতি'
    if (n.includes('ডেন্টাল') || n.includes('দাঁত') || n.includes('দন্ত') || lower.includes('dent') || lower.includes('tooth')) return 'ডেন্টাল'
    if (n.includes('চোখ') || n.includes('চক্ষু') || lower.includes('eye') || lower.includes('ophthal')) return 'চোখ'
    if (n.includes('কিডনি') || n.includes('নেফ্রোলজি') || lower.includes('nephro') || lower.includes('kidney')) return 'কিডনি'
    if (n.includes('ক্যান্সার') || n.includes('অনকোলজি') || lower.includes('cancer') || lower.includes('oncol')) return 'ক্যান্সার'
    if (n.includes('নিউরোলজি') || n.includes('স্নায়ু') || n.includes('নিউরো') || lower.includes('neuro') || lower.includes('brain')) return 'নিউরোলজি'
    if (n.includes('মেডিসিন') || lower.includes('med') || n.includes('শ্বাস') || lower.includes('pulmon') || lower.includes('lung')) return 'মেডিসিন'
    if (n.includes('লিভার') || lower.includes('hepat') || lower.includes('liver')) return 'লিভার'
    if (n.includes('পরিপাক') || n.includes('গ্যাস্ট্রো') || n.includes('পাকস্থলী') || n.includes('পেট') || lower.includes('gastro') || lower.includes('stomach')) return 'গ্যাস্ট্রো'
    if (n.includes('মানসিক') || n.includes('মনোরোগ') || lower.includes('psychiat') || lower.includes('mental')) return 'মানসিক'
    if (n.includes('চর্ম') || n.includes('ডার্মা') || n.includes('যৌন') || n.includes('ত্বক') || lower.includes('dermat') || lower.includes('skin')) return 'চর্মরোগ'
    if (n.includes('নাক') || n.includes('কান') || n.includes('গলা') || lower.includes('ent')) return 'ইএনটি'
    if (n.includes('সার্জারি') || lower.includes('surgery')) return 'সার্জারি'
    if (n.includes('ডায়াবেটিস') || n.includes('হরমোন') || lower.includes('diabet') || lower.includes('endocrin')) return 'ডায়াবেটিস'
    if (n.includes('ইউরোলজি') || n.includes('মূত্র') || lower.includes('urol')) return 'ইউরোলজি'
    
    // Clean trailing redundant words
    return n.replace(/বিশেষজ্ঞ/g, '').replace(/বিভাগ/g, '').replace(/ডাক্তার/g, '').trim() || n
  }

  // Helper function to resolve icon & pastel colors for dynamic specialties
  const getMobileSpecialtyMeta = (spec) => {
    const rawBn = spec.name_bn || spec.title_bn || ''
    const rawEn = (spec.name_en || spec.title_en || spec.name || '').toLowerCase()
    const combined = (rawBn + ' ' + rawEn).toLowerCase()
    const displayName = cleanSpecialtyName(rawBn || spec.name)

    // 1. Cardiology (হৃদরোগ)
    if (combined.includes('হৃদরোগ') || combined.includes('হার্ট') || combined.includes('cardio') || combined.includes('heart')) {
      return {
        name: displayName,
        bg: '#FFF1F2',
        border: '#FFE4E6',
        color: '#EF4444',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#EF4444" />
            <path d="M7 6.5L7.5 5.5L8 6.5L9 7L8 7.5L7.5 8.5L7 7.5L6 7Z" fill="#FFFFFF" />
            <circle cx="8" cy="7.2" r="0.7" fill="#FFFFFF" opacity="0.9" />
          </svg>
        )
      }
    }

    // 2. Orthopedics (অর্থোপেডিক)
    if (combined.includes('অর্থোপেডিক') || combined.includes('হাড়') || combined.includes('ortho') || combined.includes('bone')) {
      return {
        name: displayName,
        bg: '#EFF6FF',
        border: '#DBEAFE',
        color: '#38BDF8',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M19.4 6.8c.8-.8.8-2 0-2.8s-2-.8-2.8 0l-.6.6c-.4.4-1 .4-1.4 0l-.2-.2c-.8-.8-2-.8-2.8 0s-.8 2 0 2.8l.6.6c.4.4.4 1 0 1.4L7.4 14c-.4.4-1 .4-1.4 0l-.6-.6c-.8-.8-2-.8-2.8 0s-.8 2 0 2.8l.2.2c.4.4.4 1 0 1.4l-.6.6c-.8.8-.8 2 0 2.8s2 .8 2.8 0l.6-.6c.4-.4 1-.4 1.4 0l.2.2c.8.8 2 .8 2.8 0s.8-2 0-2.8l-.6-.6c-.4-.4-.4-1 0-1.4l4.8-4.8c.4-.4 1-.4 1.4 0l.6.6c.8.8 2 .8 2.8 0s.8-2 0-2.8l-.2-.2c-.4-.4-.4-1 0-1.4l.6-.6z" fill="#38BDF8" />
          </svg>
        )
      }
    }

    // 3. Pediatrics (শিশু)
    if (combined.includes('শিশু') || combined.includes('pediatric') || combined.includes('child')) {
      return {
        name: displayName,
        bg: '#FFF7ED',
        border: '#FFEDD5',
        color: '#F97316',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="13" r="7.5" fill="#FFF7ED" stroke="#F97316" strokeWidth="2.2" />
            <path d="M12 5.5c-.8-1.5.8-2.2 1.4-.8" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <circle cx="9.5" cy="12.5" r="1.1" fill="#F97316" />
            <circle cx="14.5" cy="12.5" r="1.1" fill="#F97316" />
            <path d="M10 15.2c.8.8 2.2.8 3 0" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="7.8" cy="14" r="0.8" fill="#FDBA74" />
            <circle cx="16.2" cy="14" r="0.8" fill="#FDBA74" />
            <path d="M4.5 11.5c-1 0-1.5 1-1.5 1.5s.5 1.5 1.5 1.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
            <path d="M19.5 11.5c1 0 1.5 1 1.5 1.5s-.5 1.5-1.5 1.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      }
    }

    // 4. Gynecology & Obs (নারী ও প্রসূতি)
    if (combined.includes('স্ত্রী') || combined.includes('প্রসূতি') || combined.includes('নারী') || combined.includes('গাইনি') || combined.includes('gyne') || combined.includes('obs')) {
      return {
        name: displayName,
        bg: '#FAF5FF',
        border: '#F3E8FF',
        color: '#9333EA',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8.5" r="5" stroke="#9333EA" strokeWidth="2.8" fill="none" />
            <path d="M12 13.5V21" stroke="#9333EA" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M8.5 17.5H15.5" stroke="#9333EA" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
        )
      }
    }

    // 5. Dental / দন্ত / দাঁত (ডেন্টাল)
    if (combined.includes('ডেন্টাল') || combined.includes('দাঁত') || combined.includes('দন্ত') || combined.includes('dent') || combined.includes('tooth')) {
      return {
        name: displayName,
        bg: '#F0FDF9',
        border: '#CCFBF1',
        color: '#06B6D4',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M7 3C4.5 3 3 5.2 3 8.2c0 3 1.5 5.2 2.5 8.2s1.5 5.1 2.5 5.1c1 0 1.5-2.1 2-4.1.5-2 1-2 2-2s1.5 0 2 2c.5 2 1 4.1 2 4.1s1.5-2.1 2.5-5.1c1-3 2.5-5.2 2.5-8.2C21 5.2 19.5 3 17 3c-2 0-3 1.5-4 1.5S10 3 7 3z" fill="#38BDF8" />
            <path d="M9 6.5c-1.5.5-2.5 2-2.5 3.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
          </svg>
        )
      }
    }

    // 6. Kidney / Nephrology (কিডনি)
    if (combined.includes('কিডনি') || combined.includes('নেফ্রোলজি') || combined.includes('nephro') || combined.includes('kidney')) {
      return {
        name: displayName,
        bg: '#F0FDFA',
        border: '#CCFBF1',
        color: '#0D9488',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M7 6c-2 0-3.5 1.8-3.5 4.5s1.5 5.5 3.5 5.5c2 0 2.5-2 2.5-3.5s-.5-2.5-1-3.5c.5-1.5 0-3-1.5-3z" fill="#0D9488" />
            <path d="M17 6c2 0 3.5 1.8 3.5 4.5s-1.5 5.5-3.5 5.5c-2 0-2.5-2-2.5-3.5s.5-2.5 1-3.5c-.5-1.5 0-3 1.5-3z" fill="#14B8A6" />
            <path d="M8.5 12.5h7" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      }
    }

    // 7. Oncology / Cancer (ক্যান্সার)
    if (combined.includes('ক্যান্সার') || combined.includes('অনকোলজি') || combined.includes('cancer') || combined.includes('oncol')) {
      return {
        name: displayName,
        bg: '#FAF5FF',
        border: '#F3E8FF',
        color: '#A855F7',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M7 20l5.5-10.5a3.5 3.5 0 1 1 5 3.5l-4.5 7" stroke="#A855F7" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 20l-5.5-10.5a3.5 3.5 0 1 0-5 3.5l4.5 7" stroke="#A855F7" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      }
    }

    // 8. Gastroenterology / Digestive / Hepatology (গ্যাস্ট্রো / পরিপাকতন্ত্র)
    if (combined.includes('পরিপাক') || combined.includes('গ্যাস্ট্রো') || combined.includes('পাকস্থলী') || combined.includes('পেট') || combined.includes('লিভার') || combined.includes('gastro') || combined.includes('stomach') || combined.includes('hepat')) {
      return {
        name: displayName,
        bg: '#ECFDF5',
        border: '#A7F3D0',
        color: '#059669',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M13 3v3.5c0 1.2-.6 2.3-1.6 3.1-2 1.5-2.6 3.2-2.6 5.2 0 3 2.2 5.5 5.2 5.5 3.2 0 5.5-2.3 5.5-5.5 0-3.2-2-5.5-4-7l-1-1" fill="#10B981" />
            <path d="M11 2v4M13.5 17.5c1.2.6 2.2 1.6 2.5 2.5" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      }
    }

    // 9. Psychiatry / Mental Health (মানসিক রোগ)
    if (combined.includes('মানসিক') || combined.includes('মনোরোগ') || combined.includes('psychiat') || combined.includes('mental')) {
      return {
        name: displayName,
        bg: '#F5F3FF',
        border: '#DDD6FE',
        color: '#7C3AED',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M6 19v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2" fill="#DDD6FE" />
            <circle cx="12" cy="9" r="5.5" fill="#8B5CF6" />
            <path d="M10 8.5c.5-.8 1.5-1 2-1s1.5.2 2 1" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="10" r="0.8" fill="#FFFFFF" />
            <circle cx="14" cy="10" r="0.8" fill="#FFFFFF" />
          </svg>
        )
      }
    }

    // 10. Neurology (নিউরোলজি)
    if (combined.includes('নিউরোলজি') || combined.includes('স্নায়ু') || combined.includes('নিউরো') || combined.includes('neuro') || combined.includes('brain')) {
      return {
        name: displayName,
        bg: '#FFF1F5',
        border: '#FFE4E8',
        color: '#F43F5E',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 4C9.5 4 7.5 5.5 7.5 7.5c-1.8 0-3.5 1.4-3.5 3.5 0 .8.3 1.6.8 2.2C4.3 13.8 4 14.6 4 15.5 4 17.4 5.6 19 7.5 19h4.5V4z" fill="#FB7185" />
            <path d="M12 4c2.5 0 4.5 1.5 4.5 3.5 1.8 0 3.5 1.4 3.5 3.5 0 .8-.3 1.6-.8 2.2.5.6.8 1.4.8 2.3 0 1.9-1.6 3.5-3.5 3.5H12V4z" fill="#F43F5E" />
            <path d="M9 8.5c.5.8 1.5 1 2 1M8 13c1 0 1.5.8 1.5 1.5M15 8.5c-.5.8-1.5 1-2 1M16 13c-1 0-1.5.8-1.5 1.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          </svg>
        )
      }
    }

    // 11. Ophthalmology (চোখ)
    if (combined.includes('চোখ') || combined.includes('চক্ষু') || combined.includes('eye') || combined.includes('ophthal')) {
      return {
        name: displayName,
        bg: '#F0F9FF',
        border: '#E0F2FE',
        color: '#0284C7',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 4.5C6.5 4.5 2 12 2 12s4.5 7.5 10 7.5 10-7.5 10-7.5-4.5-7.5-10-7.5z" fill="#0284C7" />
            <circle cx="12" cy="12" r="4.2" fill="#FFFFFF" />
            <circle cx="12" cy="12" r="2.2" fill="#0369A1" />
            <circle cx="13" cy="11" r="0.7" fill="#FFFFFF" />
          </svg>
        )
      }
    }

    // 12. Medicine / Pulmonology (মেডিসিন)
    if (combined.includes('মেডিসিন') || combined.includes('med') || combined.includes('শ্বাস') || combined.includes('pulmon') || combined.includes('lung')) {
      return {
        name: displayName,
        bg: '#FFF1F2',
        border: '#FFE4E6',
        color: '#E11D48',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v7M10 8l2 2 2-2" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.5 10.5c-2.8-.5-5.5 1.5-6 4.5-.5 3.5 1.2 6.5 4.5 6.5 1.5 0 2-1 2-2.5v-8.5z" fill="#FB7185" />
            <path d="M13.5 10.5c2.8-.5 5.5 1.5 6 4.5.5 3.5-1.2 6.5-4.5 6.5-1.5 0-2-1-2-2.5v-8.5z" fill="#F43F5E" />
          </svg>
        )
      }
    }

    // 13. ENT (ইএনটি)
    if (combined.includes('নাক') || combined.includes('কান') || combined.includes('গলা') || combined.includes('ent')) {
      return {
        name: displayName,
        bg: '#EEF2FF',
        border: '#C7D2FE',
        color: '#6366F1',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M14 3.5c3 1.5 4 4.5 4 7.5c0 4.5-2.5 7.5-6 8.5c-2.5.7-4 .2-5-1.5" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M10 7.5a3.5 3.5 0 0 0-3.5 3.5c0 2.5 1.5 4.5 3.5 5.5" stroke="#818CF8" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="10" cy="11" r="1.5" fill="#6366F1" />
          </svg>
        )
      }
    }

    // 14. Dermatology (চর্মরোগ)
    if (combined.includes('চর্ম') || combined.includes('ডার্মা') || combined.includes('যৌন') || combined.includes('ত্বক') || combined.includes('dermat') || combined.includes('skin')) {
      return {
        name: displayName,
        bg: '#FFF7ED',
        border: '#FED7AA',
        color: '#EA580C',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" fill="#FFF7ED" stroke="#EA580C" strokeWidth="2" />
            <path d="M12 7v5l3 2" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8" cy="9" r="1.5" fill="#EA580C" />
            <circle cx="15" cy="8" r="1" fill="#EA580C" />
          </svg>
        )
      }
    }

    // 15. Diabetes / Endocrinology (ডায়াবেটিস)
    if (combined.includes('ডায়াবেটিস') || combined.includes('হরমোন') || combined.includes('diabet') || combined.includes('endocrin')) {
      return {
        name: displayName,
        bg: '#FEF2F2',
        border: '#FECDD3',
        color: '#E11D48',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l4.5 7.5C18 13 18 15 16.5 17.5A6 6 0 0 1 12 20a6 6 0 0 1-4.5-2.5C6 15 6 13 7.5 10.5L12 3z" fill="#F43F5E" />
            <circle cx="12" cy="14" r="2" fill="#FFFFFF" />
          </svg>
        )
      }
    }

    // 16. Surgery (সার্জারি)
    if (combined.includes('সার্জারি') || combined.includes('surgery')) {
      return {
        name: displayName,
        bg: '#F0FDFA',
        border: '#99F6E4',
        color: '#0D9488',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="7" r="3" />
            <circle cx="6" cy="17" r="3" />
            <line x1="8.6" y1="8.6" x2="19" y2="19" />
            <line x1="8.6" y1="15.4" x2="19" y2="5" />
          </svg>
        )
      }
    }

    // 17. Urology (ইউরোলজি)
    if (combined.includes('ইউরোলজি') || combined.includes('মূত্র') || combined.includes('urol')) {
      return {
        name: displayName,
        bg: '#EFF6FF',
        border: '#BFDBFE',
        color: '#2563EB',
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="7" r="3" fill="#3B82F6" />
            <path d="M12 10v3c-3 0-5 2-5 5 0 2 2 3 5 3s5-1 5-3c0-3-2-5-5-5" fill="#60A5FA" />
          </svg>
        )
      }
    }

    // Default Clean Medical Fallback (Stethoscope badge)
    return {
      name: displayName,
      bg: '#F0FDF4',
      border: '#DCFCE7',
      color: '#16A34A',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9.5" fill="#DCFCE7" />
          <path d="M8 8a2 2 0 1 1 4 0v4a2 2 0 1 0 4 0V8" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="16" cy="8" r="1.5" fill="#16A34A" />
        </svg>
      )
    }
  }

  // Fallback Specialties (10 top departments) in case backend data is loading
  const fallbackSpecialties = [
    { id: '1', name_bn: 'হৃদরোগ', name_en: 'Cardiology' },
    { id: '2', name_bn: 'অর্থোপেডিক', name_en: 'Orthopedics' },
    { id: '3', name_bn: 'শিশু', name_en: 'Pediatrics' },
    { id: '4', name_bn: 'নারী ও প্রসূতি', name_en: 'Gynecology' },
    { id: '5', name_bn: 'নিউরোলজি', name_en: 'Neurology' },
    { id: '6', name_bn: 'চোখ', name_en: 'Ophthalmology' },
    { id: '7', name_bn: 'ডেন্টাল', name_en: 'Dental' },
    { id: '8', name_bn: 'মেডিসিন', name_en: 'Medicine' },
    { id: '9', name_bn: 'চর্ম ও যৌন', name_en: 'Dermatology' },
    { id: '10', name_bn: 'ইএনটি', name_en: 'ENT' }
  ]

  // Dynamic specialties list from database with fallback
  const activeSpecialtiesList = (specialties && specialties.length > 0) ? specialties : fallbackSpecialties
  // 10 items shown horizontally
  const top10Specialties = activeSpecialtiesList.slice(0, 10)

  // Filtered list for the All Specialties popup
  const filteredPopupSpecialties = activeSpecialtiesList.filter(s => {
    if (!specialtySearchQuery.trim()) return true
    const q = specialtySearchQuery.trim().toLowerCase()
    const bn = (s.name_bn || s.title_bn || s.name || '').toLowerCase()
    const en = (s.name_en || s.title_en || s.name || '').toLowerCase()
    return bn.includes(q) || en.includes(q)
  })

  // Handle specialty click: filter doctors and close popup
  const handleSpecialtyClick = (spec) => {
    setShowAllSpecialtiesPopup(false)
    if (spec.id && !isNaN(spec.id)) {
      navigate(`/doctors?specialty_id=${spec.id}`)
      return
    }

    const nameBn = spec.name_bn || spec.title_bn || spec.name || ''
    const nameEn = (spec.name_en || spec.title_en || spec.name || '').toLowerCase()

    const matched = specialties?.find(s => {
      const sBn = s.name_bn || s.title_bn || ''
      const sEn = (s.name_en || s.title_en || s.name || '').toLowerCase()
      return (
        (nameBn && sBn.includes(nameBn)) ||
        (sBn && nameBn.includes(sBn)) ||
        (nameEn && sEn.includes(nameEn))
      )
    })

    if (matched?.id) {
      navigate(`/doctors?specialty_id=${matched.id}`)
    } else if (nameBn) {
      navigate(`/doctors?search=${encodeURIComponent(nameBn)}`)
    } else {
      navigate('/doctors')
    }
  }

  const handleLocationSelect = (data) => {
    setLocationLabel(data.label)
    setLocationParams({
      division_id: data.division_id,
      district_id: data.district_id,
      upazila_id: data.upazila_id,
      union_id: data.union_id
    })
    const shortName = (data.label || '').split('>')[0].trim()
    if (shortName) {
      localStorage.setItem('user_location_name', shortName)
      window.dispatchEvent(new CustomEvent('location-selected', { detail: { name: shortName } }))
    }
  }

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const params = new URLSearchParams()
    if (locationParams.division_id) params.set('division_id', locationParams.division_id)
    if (locationParams.district_id) params.set('district_id', locationParams.district_id)
    if (locationParams.upazila_id) params.set('upazila_id', locationParams.upazila_id)
    if (locationParams.union_id) params.set('union_id', locationParams.union_id)
    if (selectedSpecialty) {
      params.set('specialty_id', selectedSpecialty)
      if (specialtyLabel) params.set('specialty_name', specialtyLabel)
    }
    if (selectedHospital) {
      params.set('hospital_id', selectedHospital)
      if (hospitalLabel) params.set('hospital_name', hospitalLabel)
    }
    if (selectedDate) params.set('date', selectedDate)
    if (searchText.trim()) params.set('search', searchText.trim())

    navigate(`/doctors?${params.toString()}`)
  }

  const handleScrollDown = () => {
    const heroSec = document.querySelector('.hero-section-main')
    if (heroSec) {
      const topbar = document.querySelector('.db-topbar')
      const mainHeader = document.querySelector('.db-main-header') || document.querySelector('.navbar')
      let totalHeaderHeight = 0
      if (topbar) totalHeaderHeight += topbar.offsetHeight
      if (mainHeader) totalHeaderHeight += mainHeader.offsetHeight
      if (totalHeaderHeight === 0) totalHeaderHeight = 90
      
      const targetTop = heroSec.offsetTop + heroSec.offsetHeight - totalHeaderHeight
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    } else {
      window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' })
    }
  }

  const featureCards = [
    { icon: <IconUserCheck size={26} color="#15803D" />, title: 'যাচাইকৃত ডাক্তার', desc: '১০০% যাচাইকৃত ও অভিজ্ঞ স্বাস্থ্যসেবা বিশেষজ্ঞ' },
    { icon: <IconCalendarEvent size={26} color="#15803D" />, title: 'সহজ অ্যাপয়েন্টমেন্ট', desc: 'মাত্র কয়েক ক্লিকেই অ্যাপয়েন্টমেন্ট বুক করুন' },
    { icon: <IconShieldCheck size={26} color="#15803D" />, title: 'নিরাপদ ও নির্ভরযোগ্য', desc: 'আপনার স্বাস্থ্য তথ্য আমাদের কাছে সম্পূর্ণ নিরাপদ' },
    { icon: <IconHeadset size={26} color="#15803D" />, title: '২৪/৭ সহায়তা', desc: 'যেকোনো প্রয়োজনে যেকোনো সময় পাশে আছি' }
  ]

  const heroBgImage = hero.bg_image_url || '/images/city_hero_bg.jpg'

  return (
    <section
      className="hero-section-main"
      style={{
        paddingTop: 'calc(var(--header-height, 90px) + 16px)',
        paddingBottom: '20px',
        position: 'relative',
        zIndex: 1,
        color: '#FFFFFF',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Background Layer */}
      <div className="hero-bg-dynamic" style={{
        position: 'absolute',
        inset: -14,
        backgroundImage: `url('${heroBgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 36%',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(2.5px) brightness(0.88) contrast(1.05)',
        transform: 'scale(1.05)',
        zIndex: -2,
        pointerEvents: 'none',
        transition: 'background-image 0.5s ease'
      }} />
      {/* Dark overlay */}
      <div className="hero-bg-dark-overlay" style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.75) 45%, rgba(11, 25, 44, 0.82) 100%)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />
      {/* Location Popup */}
      {showLocationPopup && (
        <LocationPopup
          onClose={() => setShowLocationPopup(false)}
          onSelect={handleLocationSelect}
        />
      )}

      {/* Specialty Popup */}
      {showSpecialtyPopup && (
        <SearchablePopup
          title="বিশেষজ্ঞতা নির্বাচন করুন"
          placeholder="বিশেষজ্ঞতার নাম লিখুন..."
          items={specialties}
          getLabel={(s) => s.name || s.name_bn || s.title}
          onClose={() => setShowSpecialtyPopup(false)}
          onSelect={(item) => {
            setSelectedSpecialty(item.id)
            setSpecialtyLabel(item.name || item.name_bn || item.title)
            setShowSpecialtyPopup(false)
          }}
        />
      )}

      {/* Hospital Popup */}
      {showHospitalPopup && (
        <SearchablePopup
          title="হাসপাতাল নির্বাচন করুন"
          placeholder="হাসপাতালের নাম লিখুন..."
          items={hospitals}
          getLabel={(h) => h.name || h.name_bn}
          onClose={() => setShowHospitalPopup(false)}
          onSelect={(item) => {
            setSelectedHospital(item.id)
            setHospitalLabel(item.name || item.name_bn)
            setShowHospitalPopup(false)
          }}
        />
      )}

      {/* Live Serial Tracking Modal */}
      <QuickLiveSerialModal
        isOpen={showLiveSerialModal}
        onClose={() => setShowLiveSerialModal(false)}
      />

      {/* DESKTOP HERO VIEW (>= 992px) */}
      <div className="hero-desktop-wrapper">
        <Container style={{ maxWidth: 1240 }}>
          {/* Hero Title */}
        <ScrollReveal direction="up" distance={20} duration={600}>
          <div className="text-center mx-auto hero-title-wrapper" style={{ maxWidth: 980, marginBottom: 36 }}>
            <h1 className="hero-title-h1" style={{ fontSize: 'clamp(22px, 3.6vw, 44px)', fontWeight: 900, color: '#00B875', lineHeight: 1.35, letterSpacing: '-0.01em', marginBottom: 16, textShadow: '0 2px 14px rgba(0, 0, 0, 0.6)', fontFamily: "'Hind Siliguri', sans-serif" }}>
              <div style={{ display: 'block', color: '#00B875', whiteSpace: 'nowrap' }}>স্বাগত ডক্টর বুকলেটে</div>
              <div className="hero-typed-wrapper" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', minHeight: '1.35em', lineHeight: 1.35, marginTop: 4 }}>
                <span style={{ color: '#FFFFFF', whiteSpace: 'nowrap' }}>{typedLine2 || ' '}</span>
                <span style={{ display: 'inline-block', color: '#00B875', fontWeight: 300, animation: 'cursorBlink 0.8s infinite', marginLeft: 2, lineHeight: 1 }}>|</span>
              </div>
            </h1>
            <p className="hero-subtitle-p" style={{ fontSize: 'clamp(14px, 1.6vw, 18px)', color: 'rgba(241, 245, 249, 0.94)', fontWeight: 400, lineHeight: 1.65, margin: '0 auto', maxWidth: 880 }}>
              {hero.subtitle || 'বাংলাদেশের অভিজ্ঞ ও যাচাইকৃত বিশেষজ্ঞ ডাক্তার, হাসপাতাল এবং চেম্বার খুঁজে মাত্র কয়েক ক্লিকেই অ্যাপয়েন্টমেন্ট বুক করুন—দ্রুত, নিরাপদ এবং সম্পূর্ণ ঝামেলামুক্তভাবে।'}
            </p>
          </div>
        </ScrollReveal>

        {/* Search Bar */}
        <ScrollReveal direction="up" distance={25} duration={700}>
          <form onSubmit={handleSearch} className="hero-search-form" style={{ marginBottom: 44 }}>
            <div className="hero-search-bar">

              {/* 1. Location Popup Trigger */}
              <div
                className="hero-field-col hero-field-location"
                onClick={() => setShowLocationPopup(true)}
                title="লোকেশন নির্বাচন করুন"
              >
                <div className="hero-field-icon-bg">
                  <IconMapPin size={18} style={{ color: '#00B875', flexShrink: 0 }} />
                </div>
                <span className="hero-field-text" style={{ color: locationLabel ? '#1E293B' : '#64748B', fontWeight: locationLabel ? 700 : 500 }}>
                  {locationLabel || 'লোকেশন নির্বাচন করুন'}
                </span>
                {locationLabel ? (
                  <IconX
                    size={16}
                    style={{ color: '#64748B', marginLeft: 'auto', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setLocationLabel(''); setLocationParams({}) }}
                  />
                ) : (
                  <IconChevronDown size={16} style={{ color: '#94A3B8', marginLeft: 'auto' }} />
                )}
              </div>

              {/* 2. বিশেষজ্ঞতা Popup Trigger */}
              <div
                className="hero-field-col hero-field-location"
                onClick={() => setShowSpecialtyPopup(true)}
                title="বিশেষজ্ঞতা নির্বাচন করুন"
              >
                <div className="hero-field-icon-bg">
                  <IconStethoscope size={18} style={{ color: '#00B875', flexShrink: 0 }} />
                </div>
                <span className="hero-field-text" style={{ color: specialtyLabel ? '#1E293B' : '#64748B', fontWeight: specialtyLabel ? 700 : 500 }}>
                  {specialtyLabel || 'বিশেষজ্ঞতা নির্বাচন করুন'}
                </span>
                {specialtyLabel ? (
                  <IconX size={16} style={{ color: '#64748B', marginLeft: 'auto', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setSpecialtyLabel(''); setSelectedSpecialty('') }} />
                ) : (
                  <IconChevronDown size={16} style={{ color: '#94A3B8', marginLeft: 'auto' }} />
                )}
              </div>

              {/* 3. হাসপাতাল Popup Trigger */}
              <div
                className="hero-field-col hero-field-location"
                onClick={() => setShowHospitalPopup(true)}
                title="হাসপাতাল নির্বাচন করুন"
              >
                <div className="hero-field-icon-bg">
                  <IconBuildingHospital size={18} style={{ color: '#00B875', flexShrink: 0 }} />
                </div>
                <span className="hero-field-text" style={{ color: hospitalLabel ? '#1E293B' : '#64748B', fontWeight: hospitalLabel ? 700 : 500 }}>
                  {hospitalLabel || 'হাসপাতাল নির্বাচন করুন'}
                </span>
                {hospitalLabel ? (
                  <IconX size={16} style={{ color: '#64748B', marginLeft: 'auto', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setHospitalLabel(''); setSelectedHospital('') }} />
                ) : (
                  <IconChevronDown size={16} style={{ color: '#94A3B8', marginLeft: 'auto' }} />
                )}
              </div>

              {/* 4. Keyword */}
              <div className="hero-field-col">
                <div className="hero-field-icon-bg">
                  <IconWriting size={18} style={{ color: '#00B875', flexShrink: 0 }} />
                </div>
                <input
                  type="text"
                  placeholder="ডাক্তার / হাসপাতাল / বিশেষজ্ঞতা লিখুন"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="hero-text-input"
                />
              </div>

              {/* 5. Search Button */}
              <button type="submit" className="hero-search-btn">
                <IconSearch size={20} stroke={2.8} />
                <span>খুঁজুন</span>
              </button>
            </div>
          </form>
        </ScrollReveal>

        {/* Feature Badges */}
        <ScrollReveal direction="up" distance={30} duration={800}>
          <div className="hero-features-row">
            {featureCards.map((card, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)' }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.25, marginBottom: 3 }}>{card.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.35 }}>{card.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Scroll Down */}
        <div onClick={handleScrollDown} className="hero-scroll-down-btn" title="Scroll Down">
          <div className="hero-scroll-icon">
            <IconChevronsDown size={26} stroke={2.5} />
          </div>
        </div>
        </Container>
      </div>

      {/* MOBILE APP HERO VIEW (< 992px) - Matching Image 1 Reference */}
      <div className="hero-mobile-wrapper">
        <div className="hero-mobile-container">
          {/* 1. Mint Green / Modern Promo Card */}
          <div
            className={`hero-mobile-promo-card ${
              activeSlide === 0
                ? 'hero-mobile-promo-card-banner-1'
                : activeSlide === 1
                ? 'hero-mobile-promo-card-banner-2'
                : activeSlide === 2
                ? 'hero-mobile-promo-card-banner-3'
                : 'hero-mobile-promo-card-banner-4'
            }`}
          >
            {/* Banner Background Image for Slides 1, 2, 3, and 4 */}
            {activeSlide === 0 && (
              <div className="hero-mobile-promo-bg-img hero-mobile-promo-bg-1" />
            )}
            {activeSlide === 1 && (
              <div className="hero-mobile-promo-bg-img hero-mobile-promo-bg-2" />
            )}
            {activeSlide === 2 && (
              <div className="hero-mobile-promo-bg-img hero-mobile-promo-bg-3" />
            )}
            {activeSlide === 3 && (
              <div className="hero-mobile-promo-bg-img hero-mobile-promo-bg-4" />
            )}

            {/* Left Column: Text & Slider Dots */}
            <div
              className={`hero-mobile-card-left ${
                activeSlide === 1
                  ? 'hero-mobile-card-left-slide2'
                  : activeSlide === 2
                  ? 'hero-mobile-card-left-slide3'
                  : activeSlide === 3
                  ? 'hero-mobile-card-left-slide4'
                  : ''
              }`}
            >
              <h2
                className={`hero-mobile-promo-title-1 ${
                  activeSlide === 1
                    ? 'slide2-title-1'
                    : activeSlide === 2
                    ? 'slide3-title-1'
                    : activeSlide === 3
                    ? 'slide4-title-1'
                    : ''
                }`}
              >
                {promoSlides[activeSlide]?.title1 || 'বিশ্বস্ত ডাক্তারের'}
              </h2>
              <h3
                className={`hero-mobile-promo-title-2 ${
                  activeSlide === 1
                    ? 'slide2-title-2'
                    : activeSlide === 2
                    ? 'slide3-title-2'
                    : activeSlide === 3
                    ? 'slide4-title-2'
                    : ''
                }`}
              >
                {promoSlides[activeSlide]?.title2 || 'সহজ অ্যাপয়েন্টমেন্ট'}
              </h3>
              <p
                className={`hero-mobile-promo-sub ${
                  activeSlide === 1
                    ? 'slide2-sub'
                    : activeSlide === 2
                    ? 'slide3-sub'
                    : activeSlide === 3
                    ? 'slide4-sub'
                    : ''
                }`}
              >
                {promoSlides[activeSlide]?.subtitle || 'আপনার ও পরিবারের স্বাস্থ্যসেবায় আমরা আছি আপনার পাশে'}
              </p>
              
              {/* Slider Dots */}
              <div className="hero-mobile-dots">
                {promoSlides.map((_, idx) => (
                  <span
                    key={idx}
                    className={`hero-mobile-dot ${activeSlide === idx ? 'active' : ''} ${
                      activeSlide === 1
                        ? 'slide2-dot'
                        : activeSlide === 2
                        ? 'slide3-dot'
                        : activeSlide === 3
                        ? 'slide4-dot'
                        : ''
                    }`}
                    onClick={() => setActiveSlide(idx)}
                  />
                ))}
              </div>
            </div>

            {/* Spacer to give room for the right side hero illustration */}
            <div className="hero-mobile-card-banner-spacer" />
          </div>

          {/* 2. Search & Filter Bar */}
          <form onSubmit={handleSearch} className="hero-mobile-search-row">
            <div className="hero-mobile-search-pill">
              <IconSearch size={20} className="hero-mobile-search-icon" />
              <input
                type="text"
                placeholder="ডাক্তার, বিশেষজ্ঞতা বা হাসপাতাল খুঁজুন..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="hero-mobile-search-input"
              />
              <button
                type="button"
                onClick={handleVoiceSearch}
                className="hero-mobile-mic-btn"
                title="ভয়েস সার্চ"
              >
                <IconMicrophone size={19} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setUnifiedTab('specialty')
                setShowUnifiedModal(true)
              }}
              className={`hero-mobile-filter-btn ${locationLabel || specialtyLabel || hospitalLabel ? 'active' : ''}`}
              title="ফিল্টার ও অনুসন্ধান"
            >
              <IconAdjustmentsHorizontal size={22} />
              {(locationLabel || specialtyLabel || hospitalLabel) && (
                <span className="hero-mobile-filter-active-dot" />
              )}
            </button>
          </form>

          {/* 3. 4-Pill Filter Bar (Matching user image) */}
          <div className="hero-mobile-filter-pills-row">
            {/* Pill 1: অবস্থান */}
            <button
              type="button"
              onClick={() => {
                setUnifiedTab('location')
                setShowUnifiedModal(true)
              }}
              className={`hero-mobile-filter-pill ${locationLabel ? 'active' : ''}`}
            >
              <IconMapPin size={14} color="#00803D" stroke={2.2} />
              <span>{locationLabel ? locationLabel.split('>')[0].trim() : 'অবস্থান'}</span>
              {locationLabel ? (
                <span
                  className="hero-mobile-filter-pill-clear"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLocationLabel('')
                    setLocationParams({})
                  }}
                >
                  <IconX size={13} />
                </span>
              ) : (
                <IconChevronDown size={13} color="#64748B" />
              )}
            </button>

            {/* Pill 2: বিশেষজ্ঞতা */}
            <button
              type="button"
              onClick={() => {
                setUnifiedTab('specialty')
                setShowUnifiedModal(true)
              }}
              className={`hero-mobile-filter-pill ${specialtyLabel ? 'active' : ''}`}
            >
              <IconStethoscope size={14} color="#00803D" stroke={2.2} />
              <span>{specialtyLabel || 'বিশেষজ্ঞতা'}</span>
              {specialtyLabel ? (
                <span
                  className="hero-mobile-filter-pill-clear"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSpecialtyLabel('')
                    setSelectedSpecialty('')
                  }}
                >
                  <IconX size={13} />
                </span>
              ) : (
                <IconChevronDown size={13} color="#64748B" />
              )}
            </button>

            {/* Pill 3: হাসপাতাল */}
            <button
              type="button"
              onClick={() => {
                setUnifiedTab('hospital')
                setShowUnifiedModal(true)
              }}
              className={`hero-mobile-filter-pill ${hospitalLabel ? 'active' : ''}`}
            >
              <IconBuildingHospital size={14} color="#00803D" stroke={2.2} />
              <span>{hospitalLabel || 'হাসপাতাল'}</span>
              {hospitalLabel ? (
                <span
                  className="hero-mobile-filter-pill-clear"
                  onClick={(e) => {
                    e.stopPropagation()
                    setHospitalLabel('')
                    setSelectedHospital('')
                  }}
                >
                  <IconX size={14} />
                </span>
              ) : (
                <IconChevronDown size={14} color="#64748B" />
              )}
            </button>
          </div>

          {/* 4. Quick Action Cards (4-Grid) */}
          <div className="hero-mobile-quick-actions">
            {/* Action 1: অ্যাপয়েন্টমেন্ট বুক করুন */}
            <div
              className="hero-mobile-action-card hero-mobile-action-mint"
              onClick={() => navigate('/quick-appointment')}
            >
              <div className="hero-mobile-action-icon-wrapper">
                <IconCalendarEvent size={24} color="#00803D" stroke={2.2} />
              </div>
              <div className="hero-mobile-action-text">
                <div>অ্যাপয়েন্টমেন্ট</div>
                <div>বুক করুন</div>
              </div>
            </div>

            {/* Action 2: লাইভ সিরিয়াল ট্র্যাকিং */}
            <div
              className="hero-mobile-action-card hero-mobile-action-cyan"
              onClick={() => setShowLiveSerialModal(true)}
              style={{ position: 'relative' }}
            >
              <div className="hero-mobile-live-badge">
                <span className="hero-mobile-live-pulse-dot" />
                LIVE
              </div>
              <div className="hero-mobile-action-icon-wrapper hero-mobile-cyan-icon-wrap">
                <IconActivity size={24} color="#0284C7" stroke={2.3} />
              </div>
              <div className="hero-mobile-action-text hero-mobile-cyan-text">
                <div>লাইভ সিরিয়াল</div>
                <div>ট্র্যাকিং</div>
              </div>
            </div>

            {/* Action 3: বিশেষজ্ঞ ডাক্তার */}
            <div
              className="hero-mobile-action-card hero-mobile-action-orange"
              onClick={() => navigate('/doctors')}
            >
              <div className="hero-mobile-action-icon-wrapper">
                <IconUserCheck size={24} color="#EA580C" stroke={2.2} />
              </div>
              <div className="hero-mobile-action-text">
                <div>বিশেষজ্ঞ</div>
                <div>ডাক্তার</div>
              </div>
            </div>
          </div>

          {/* 5. Emergency Red Banner */}
          <div
            className="hero-mobile-emergency-banner"
            onClick={() => navigate('/hospitals?emergency=1')}
          >
            {/* 3D-Style Vector Ambulance Graphic */}
            <div className="hero-mobile-emergency-img-box">
              <svg width="42" height="28" viewBox="0 0 72 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-mobile-ambulance-svg">
                {/* Siren glow & lights */}
                <ellipse cx="38" cy="8" rx="8" ry="3" fill="#60A5FA" opacity="0.4" />
                <rect x="36" y="6" width="5" height="4" rx="1.5" fill="#3B82F6" />
                <rect x="42" y="6" width="5" height="4" rx="1.5" fill="#EF4444" />
                {/* Main body white */}
                <path d="M6 14C6 11.79 7.79 10 10 10H46C47.3 10 48.5 10.6 49.3 11.6L57.5 21.2C58.5 22.3 59 23.7 59 25.2V35C59 36.65 57.65 38 56 38H6C4.35 38 3 36.65 3 35V17C3 15.35 4.35 14 6 14Z" fill="#FFFFFF" />
                {/* Cab front bumper */}
                <path d="M59 28H62C63.1 28 64 28.9 64 30V34C64 36.2 62.2 38 60 38H59V28Z" fill="#F1F5F9" />
                {/* Front Window */}
                <path d="M48 13.5H46V22H56.5L49.5 14C49.1 13.7 48.6 13.5 48 13.5Z" fill="#38BDF8" />
                {/* Side window */}
                <rect x="34" y="13.5" width="9.5" height="8.5" rx="1.5" fill="#BAE6FD" />
                {/* Red Cross on side */}
                <rect x="18" y="16" width="4" height="12" rx="1" fill="#EF4444" />
                <rect x="14" y="20" width="12" height="4" rx="1" fill="#EF4444" />
                {/* Red stripe across bottom */}
                <path d="M3 31H59V35C59 36.65 57.65 38 56 38H6C4.35 38 3 36.65 3 35V31Z" fill="#EF4444" />
                {/* Wheels */}
                <circle cx="16" cy="38" r="7" fill="#1E293B" />
                <circle cx="16" cy="38" r="3.5" fill="#94A3B8" />
                <circle cx="16" cy="38" r="1.5" fill="#F8FAFC" />
                <circle cx="48" cy="38" r="7" fill="#1E293B" />
                <circle cx="48" cy="38" r="3.5" fill="#94A3B8" />
                <circle cx="48" cy="38" r="1.5" fill="#F8FAFC" />
                {/* Headlight */}
                <rect x="61" y="29" width="3" height="3" rx="1" fill="#FBBF24" />
              </svg>
            </div>

            {/* Emergency text info */}
            <div className="hero-mobile-emergency-info">
              <div className="hero-mobile-emergency-title">জরুরি সেবা প্রয়োজন?</div>
              <div className="hero-mobile-emergency-desc">অ্যাম্বুলেন্স, ব্লাড ব্যাংক ও ২৪/৭ হাসপাতাল খুঁজুন</div>
            </div>

            {/* Action Arrow Button */}
            <div className="hero-mobile-emergency-arrow">
              <IconArrowRight size={14} stroke={2.6} />
            </div>
          </div>

          {/* 6. Popular Specialties Section (জনপ্রিয় বিশেষজ্ঞতা - 10 Dynamic + সব দেখুন) */}
          <div className="hero-mobile-specialties-section">
            <div className="hero-mobile-section-header">
              <h3 className="hero-mobile-section-title">জনপ্রিয় বিশেষজ্ঞতা</h3>
              <button
                type="button"
                className="hero-mobile-section-all-link"
                onClick={() => setShowAllSpecialtiesPopup(true)}
              >
                সব দেখুন
              </button>
            </div>

            <div className="hero-mobile-specialties-scroll">
              {top10Specialties.map((spec) => {
                const meta = getMobileSpecialtyMeta(spec)
                return (
                  <div
                    key={spec.id || meta.name}
                    className="hero-mobile-specialty-card"
                    style={{ backgroundColor: meta.bg, borderColor: meta.border }}
                    onClick={() => handleSpecialtyClick(spec)}
                  >
                    <div className="hero-mobile-specialty-icon">
                      {meta.icon}
                    </div>
                    <div className="hero-mobile-specialty-name">
                      {meta.name}
                    </div>
                  </div>
                )
              })}

              {/* 11th Card: সব দেখুন (Opens All Specialties Popup) */}
              <div
                className="hero-mobile-specialty-card hero-mobile-specialty-all-card"
                onClick={() => setShowAllSpecialtiesPopup(true)}
              >
                <div className="hero-mobile-specialty-icon hero-mobile-all-icon-box">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00803D" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="6" height="6" rx="2" fill="rgba(0, 128, 61, 0.15)" />
                    <rect x="14" y="4" width="6" height="6" rx="2" fill="rgba(0, 128, 61, 0.15)" />
                    <rect x="4" y="14" width="6" height="6" rx="2" fill="rgba(0, 128, 61, 0.15)" />
                    <rect x="14" y="14" width="6" height="6" rx="2" fill="rgba(0, 128, 61, 0.15)" />
                  </svg>
                </div>
                <div className="hero-mobile-specialty-name" style={{ color: '#00803D', fontWeight: 800 }}>
                  সব দেখুন
                </div>
              </div>
            </div>
          </div>

          {/* 7. Today Doctors Section (আজ যেসব ডাক্তার বসবেন - Matching Reference Design) */}
          {(loadingTodayDoctors || todayDoctors.length > 0) && (
            <div className="hero-mobile-today-doctors-section">
              <div className="hero-mobile-section-header">
                <h3 className="hero-mobile-section-title">আজ যেসব ডাক্তার বসবেন</h3>
                <button
                  type="button"
                  className="hero-mobile-section-all-link"
                  onClick={() => navigate('/doctors?date=today')}
                >
                  সব দেখুন
                </button>
              </div>

              {loadingTodayDoctors ? (
                <div className="hero-mobile-today-scroll">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="hero-mobile-today-card hero-mobile-today-skeleton">
                      <div className="hero-mobile-today-skeleton-img" />
                      <div className="hero-mobile-today-skeleton-line short" />
                      <div className="hero-mobile-today-skeleton-line" />
                      <div className="hero-mobile-today-skeleton-line shorter" />
                      <div className="hero-mobile-today-skeleton-btn" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="hero-mobile-today-scroll">
                  {todayDoctors.map((doc) => {
                    const isFav = isDoctorFavorite(doc.id)
                    const photo = doc.photo || doc.photo_url || doc.image || doc.avatar || doc.profile_image
                    const docImg = photo ? getMediaUrl(photo) : 'https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-crossed_1291-63.jpg'
                    const docName = doc.name_bn || doc.name || doc.doctor_name || 'ডা. বিশেষজ্ঞ'
                    const specialty = getDoctorSpecialtyTitle(doc)
                    const hospital = getDoctorHospitalTitle(doc)
                    const rating = getDoctorRating(doc)
                    const reviewsCount = getDoctorReviewsCount(doc)

                    return (
                      <div
                        key={doc.id}
                        className="hero-mobile-today-card"
                        onClick={() => navigate(getDoctorUrl(doc))}
                      >
                        {/* Wishlist Heart Button */}
                        <button
                          type="button"
                          className={`hero-mobile-today-fav-btn ${isFav ? 'active' : ''}`}
                          aria-label="Wishlist"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavoriteDoctor(doc)
                          }}
                        >
                          <IconHeart size={18} fill={isFav ? '#EF4444' : 'none'} color={isFav ? '#EF4444' : '#94A3B8'} stroke={1.8} />
                        </button>

                        {/* Doctor Avatar Circle */}
                        <div className="hero-mobile-today-avatar-wrap">
                          <img
                            src={docImg}
                            alt={docName}
                            className="hero-mobile-today-avatar-img"
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = 'https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-crossed_1291-63.jpg'
                            }}
                          />
                        </div>

                        {/* Doctor Name */}
                        <h4 className="hero-mobile-today-name" title={docName}>
                          {docName}
                        </h4>

                        {/* Specialty */}
                        <div className="hero-mobile-today-specialty" title={specialty}>
                          {specialty}
                        </div>

                        {/* Hospital & Location */}
                        <div className="hero-mobile-today-hospital" title={hospital}>
                          {hospital}
                        </div>

                        {/* Star Rating & Review Count */}
                        <div className="hero-mobile-today-rating">
                          <IconStarFilled size={15} color="#F59E0B" />
                          <span className="hero-mobile-today-rating-val">{toBnNumber(rating)}</span>
                          <span className="hero-mobile-today-rating-count">({toBnNumber(reviewsCount)})</span>
                        </div>

                        {/* Action Button: অ্যাপয়েন্টমেন্ট নিন */}
                        <button
                          type="button"
                          className="hero-mobile-today-book-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(getBookingUrl(doc, doc.matched_chamber?.id || null, 'today'))
                          }}
                        >
                          অ্যাপয়েন্টমেন্ট নিন
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Smart Unified Search Bottom Sheet Modal (Portal to body for top z-index) */}
      {showUnifiedModal && typeof document !== 'undefined' && createPortal(
        <div
          ref={unifiedOverlayRef}
          className="hero-mobile-unified-overlay"
          onClick={closeUnifiedSheet}
        >
          <div
            ref={unifiedSheetRef}
            className="hero-mobile-unified-popup"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Indicator Handle Bar (Swipe down to dismiss) */}
            <div
              className="hero-mobile-sheet-drag-zone"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              <div className="hero-mobile-sheet-drag-bar" />
            </div>

            {/* Header (swipe-enabled, no close button) */}
            <div
              className="hero-mobile-unified-header"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              <div>
                <div className="hero-mobile-unified-title">
                  ডাক্তার ও সেবা অনুসন্ধান
                  {activeFiltersCount > 0 && (
                    <span className="hero-mobile-unified-badge">
                      {toBnNumber(activeFiltersCount)}টি ফিল্টার সক্রিয়
                    </span>
                  )}
                </div>
                <div className="hero-mobile-unified-sub">
                  পছন্দের বিভাগ, অবস্থান বা হাসপাতাল বেছে নিন
                </div>
              </div>
            </div>

            {/* Segmented Tab Bar */}
            <div className="hero-mobile-unified-tabs">
              <button
                type="button"
                className={`hero-mobile-unified-tab ${unifiedTab === 'specialty' ? 'active' : ''}`}
                onClick={() => setUnifiedTab('specialty')}
              >
                <IconStethoscope size={16} stroke={2.2} />
                <span>বিশেষজ্ঞতা</span>
                {specialtyLabel && <span className="unified-tab-dot" />}
              </button>

              <button
                type="button"
                className={`hero-mobile-unified-tab ${unifiedTab === 'location' ? 'active' : ''}`}
                onClick={() => setUnifiedTab('location')}
              >
                <IconMapPin size={16} stroke={2.2} />
                <span>অবস্থান</span>
                {locationLabel && <span className="unified-tab-dot" />}
              </button>

              <button
                type="button"
                className={`hero-mobile-unified-tab ${unifiedTab === 'hospital' ? 'active' : ''}`}
                onClick={() => setUnifiedTab('hospital')}
              >
                <IconBuildingHospital size={16} stroke={2.2} />
                <span>হাসপাতাল</span>
                {hospitalLabel && <span className="unified-tab-dot" />}
              </button>
            </div>

            {/* Content Body */}
            <div className="hero-mobile-unified-content">
              {unifiedTab === 'specialty' && (
                <UnifiedSpecialtyTab
                  activeSpecialtiesList={activeSpecialtiesList}
                  selectedSpecialty={selectedSpecialty}
                  setSelectedSpecialty={setSelectedSpecialty}
                  specialtyLabel={specialtyLabel}
                  setSpecialtyLabel={setSpecialtyLabel}
                  getMobileSpecialtyMeta={getMobileSpecialtyMeta}
                />
              )}

              {unifiedTab === 'location' && (
                <UnifiedLocationTab
                  locationParams={locationParams}
                  setLocationParams={setLocationParams}
                  locationLabel={locationLabel}
                  setLocationLabel={setLocationLabel}
                />
              )}

              {unifiedTab === 'hospital' && (
                <UnifiedHospitalTab
                  hospitals={hospitals}
                  selectedHospital={selectedHospital}
                  setSelectedHospital={setSelectedHospital}
                  hospitalLabel={hospitalLabel}
                  setHospitalLabel={setHospitalLabel}
                />
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="hero-mobile-unified-footer">
              <button
                type="button"
                className="hero-mobile-unified-reset-btn"
                onClick={handleResetAllFilters}
              >
                রিসেট
              </button>
              <button
                type="button"
                className="hero-mobile-unified-search-btn"
                onClick={(e) => {
                  closeUnifiedSheet()
                  handleSearch(e)
                }}
              >
                <IconSearch size={18} stroke={2.5} />
                <span>ডাক্তার অনুসন্ধান করুন</span>
                <IconArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 5. All Specialties Mobile Popup / Modal (Rendered into document.body to ensure top z-index over bottom nav) */}
      {showAllSpecialtiesPopup && typeof document !== 'undefined' && createPortal(
        <div
          ref={specOverlayRef}
          className="hero-mobile-specialties-overlay"
          onClick={closeSpecialtiesPopup}
        >
          <div
            ref={specSheetRef}
            className="hero-mobile-specialties-popup"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Indicator Handle Bar (Swipe down to dismiss) */}
            <div
              className="hero-mobile-sheet-drag-zone"
              onTouchStart={handleSpecSheetTouchStart}
              onTouchMove={handleSpecSheetTouchMove}
              onTouchEnd={handleSpecSheetTouchEnd}
            >
              <div className="hero-mobile-sheet-drag-bar" />
            </div>

            {/* Header (Swipeable) */}
            <div
              className="hero-mobile-specialties-popup-header"
              onTouchStart={handleSpecSheetTouchStart}
              onTouchMove={handleSpecSheetTouchMove}
              onTouchEnd={handleSpecSheetTouchEnd}
            >
              <div>
                <div className="hero-mobile-specialties-popup-title">
                  সকল বিশেষজ্ঞতা
                  <span className="hero-mobile-specialties-count-badge">
                    {activeSpecialtiesList.length} টি বিভাগ
                  </span>
                </div>
                <div className="hero-mobile-specialties-popup-sub">
                  যেকোনো বিভাগ নির্বাচন করে সরাসরি ডাক্তারের তালিকা দেখুন
                </div>
              </div>
              <button
                type="button"
                className="loc-close-btn"
                onClick={closeSpecialtiesPopup}
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="hero-mobile-specialties-popup-search">
              <div className="hero-mobile-specialties-search-box">
                <IconSearch size={18} color="#00803D" />
                <input
                  type="text"
                  placeholder="বিভাগের নাম লিখে খুঁজুন (মেডিসিন, হৃদরোগ...)"
                  value={specialtySearchQuery}
                  onChange={(e) => setSpecialtySearchQuery(e.target.value)}
                  className="hero-mobile-specialties-search-input"
                />
                {specialtySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSpecialtySearchQuery('')}
                    className="hero-mobile-specialties-search-clear"
                  >
                    <IconX size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Specialties */}
            <div className="hero-mobile-specialties-popup-grid">
              {filteredPopupSpecialties.map((spec) => {
                const meta = getMobileSpecialtyMeta(spec)
                return (
                  <div
                    key={spec.id || meta.name}
                    className="hero-mobile-specialties-popup-card"
                    style={{ backgroundColor: meta.bg, borderColor: meta.border }}
                    onClick={() => handleSpecialtyClick(spec)}
                  >
                    <div className="hero-mobile-specialty-icon">
                      {meta.icon}
                    </div>
                    <div className="hero-mobile-specialty-name">
                      {meta.name}
                    </div>
                  </div>
                )
              })}
              {filteredPopupSpecialties.length === 0 && (
                <div className="hero-mobile-specialties-empty">
                  <IconSearch size={32} color="#94A3B8" />
                  <div>কোনো বিশেষজ্ঞ বিভাগ পাওয়া যায়নি</div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        /* ── Stable Typewriter Container (Zero Layout Shift) ──── */
        .hero-typed-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          min-height: 1.35em;
          line-height: 1.35;
        }

        /* ── Hero Section Background Layers ──── */
        .hero-section-main {
          position: relative;
          overflow: hidden;
        }




        /* ── Search Bar ───────────────────────── */
        .hero-search-bar {
          background: #FFFFFF;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 45px rgba(0,0,0,0.22);
          display: flex;
          align-items: stretch;
          width: 100%;
          max-width: 1160px;
          margin: 0 auto;
          height: 60px;
        }

        .hero-field-icon-bg {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #E8F8F2;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .hero-field-col {
          flex: 1 1 22%;
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          border-right: 1px solid #E2E8F0;
          overflow: hidden;
          transition: background 0.2s ease;
        }

        .hero-field-location {
          cursor: pointer;
          user-select: none;
        }
        .hero-field-location:hover {
          background: #F8FAFC;
        }
        .hero-field-location:hover .hero-field-icon-bg {
          transform: scale(1.05);
        }

        .hero-field-text {
          font-size: 13.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .hero-text-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13.5px;
          font-weight: 700;
          color: #1E293B;
        }
        .hero-text-input::placeholder { color: #64748B; opacity: 1; font-weight: 500; }

        .hero-search-btn {
          background: linear-gradient(135deg, #00B875 0%, #008A58 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 0;
          padding: 0 32px;
          font-size: 15px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          height: 100%;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .hero-search-btn:hover {
          background: linear-gradient(135deg, #00A368 0%, #00774C 100%);
        }

        /* ── Location Popup ─────────────────── */
        .loc-popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          z-index: 9999;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 130px;
          backdrop-filter: blur(4px);
          animation: locFadeIn 0.18s ease;
        }

        @keyframes locFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .loc-popup-box {
          background: #FFFFFF;
          width: 100%;
          max-width: 560px;
          border-radius: 0;
          box-shadow: 0 24px 64px rgba(0,0,0,0.35);
          overflow: hidden;
          animation: locSlideUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes locSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .loc-popup-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid #EDF2F7;
          background: #F8FAFC;
        }

        .loc-popup-title {
          font-size: 16px;
          font-weight: 700;
          color: #1A202C;
        }

        .loc-breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 2px;
          margin-top: 4px;
          font-size: 12px;
          color: #718096;
        }

        .loc-confirm-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #00803D;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .loc-confirm-btn:hover { background: #006630; }

        .loc-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #A0AEC0;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .loc-close-btn:hover { color: #E53E3E; }

        /* Step tabs */
        .loc-steps {
          display: flex;
          border-bottom: 1px solid #EDF2F7;
          background: #FFFFFF;
        }

        .loc-step-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 4px;
          font-size: 12px;
          font-weight: 600;
          color: #CBD5E0;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .loc-step-tab.active {
          color: #00803D;
          border-bottom-color: #00803D;
        }

        .loc-step-tab.done {
          color: #48BB78;
        }

        .loc-step-num {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #EDF2F7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }

        .loc-step-tab.active .loc-step-num { background: #00803D; color: #fff; }
        .loc-step-tab.done .loc-step-num { background: #48BB78; color: #fff; }
        .loc-step-tab.clickable { cursor: pointer; }
        .loc-step-tab.clickable:hover { background: #F0FFF4; color: #00803D; }

        /* Back button */
        .loc-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #F0FFF4;
          border: 1.5px solid #C6F6D5;
          color: #00803D;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.18s;
        }
        .loc-back-btn:hover {
          background: #00803D;
          border-color: #00803D;
          color: #FFFFFF;
        }

        /* Clickable breadcrumb items */
        .loc-breadcrumb-item {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          transition: color 0.15s;
        }
        .loc-breadcrumb-item:hover span { color: #00803D; text-decoration: underline; }

        /* List */
        .loc-list {
          max-height: 340px;
          overflow-y: auto;
          padding: 8px 0;
        }

        .loc-list::-webkit-scrollbar { width: 5px; }
        .loc-list::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 99px; }

        .loc-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: none;
          border: none;
          text-align: left;
          font-size: 14px;
          font-weight: 500;
          color: #2D3748;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid #F7FAFC;
        }

        .loc-item:hover {
          background: #F0FFF4;
          color: #00803D;
        }

        .loc-item-arrow { color: #CBD5E0; transition: color 0.15s; }
        .loc-item:hover .loc-item-arrow { color: #00803D; }

        .loc-loading, .loc-empty {
          text-align: center;
          padding: 32px;
          color: #A0AEC0;
          font-size: 14px;
        }

        /* Search popup search bar */
        .srch-popup-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border-bottom: 1px solid #EDF2F7;
          background: #F8FAFC;
        }

        .srch-popup-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          color: #2D3748;
        }
        .srch-popup-input::placeholder { color: #A0AEC0; }

        .srch-popup-clear {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #A0AEC0;
          padding: 2px;
        }
        .srch-popup-clear:hover { color: #E53E3E; }

        .srch-item-check {
          color: #E2E8F0;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .loc-item:hover .srch-item-check { color: #00803D; }

        /* ── Feature row & Scroll icon ──────── */
        .hero-features-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          max-width: 1180px;
          margin: 0 auto 36px;
        }

        .hero-scroll-down-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 36px auto 10px;
          cursor: pointer;
          width: fit-content;
          user-select: none;
        }

        .hero-scroll-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1.5px solid rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          animation: heroScrollBounce 2.2s infinite ease-in-out;
          transition: all 0.3s ease;
        }

        @keyframes heroScrollBounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(12px); }
          60% { transform: translateY(6px); }
        }

        .hero-scroll-down-btn:hover .hero-scroll-icon {
          background: rgba(22,163,74,0.9);
          border-color: #22C55E;
          transform: scale(1.1);
        }

        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @media (min-width: 992px) {
          .hero-desktop-wrapper {
            display: block !important;
          }
          .hero-mobile-wrapper {
            display: none !important;
          }
          .hero-section-main {
            min-height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            padding-top: calc(var(--header-height, 100px) + 45px) !important;
            padding-bottom: 45px !important;
          }
          .hero-title-wrapper {
            margin-top: 12px !important;
          }
        }

        @media (max-width: 991px) {
          .hero-desktop-wrapper {
            display: none !important;
          }
          .hero-mobile-wrapper {
            display: block !important;
          }
          .hero-bg-dynamic,
          .hero-bg-dark-overlay {
            display: none !important;
          }
          .hero-section-main {
            background: #F8FAFC !important;
            color: #0F172A !important;
            min-height: auto !important;
            display: block !important;
            padding-top: calc(var(--header-height, 68px) + 14px) !important;
            padding-bottom: 4px !important;
          }

          /* ── Mobile Container ── */
          .hero-mobile-container {
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
            padding: 0 14px;
          }

          /* ── 1. Mint Green Promo Card ── */
          .hero-mobile-promo-card {
            background: linear-gradient(135deg, #E6F7F0 0%, #D8F5E5 50%, #E8F8F2 100%);
            border-radius: 10px;
            padding: 18px 14px 14px 18px;
            display: flex;
            align-items: stretch;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(16, 185, 129, 0.18);
            box-shadow: 0 6px 20px rgba(0, 184, 117, 0.08);
            min-height: 156px;
          }

          /* Banner 1: Green Doctor Graphic */
          .hero-mobile-promo-card-banner-1 {
            border: 1px solid rgba(16, 185, 129, 0.25);
            background: #E8F8F2;
          }

          .hero-mobile-promo-bg-1 {
            background-image: url('/mobile-hero-banner.png');
            background-size: cover;
            background-position: right center;
            background-repeat: no-repeat;
          }

          .hero-mobile-promo-card-banner-1::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
              90deg,
              rgba(235, 252, 244, 0.98) 0%,
              rgba(235, 252, 244, 0.92) 48%,
              rgba(235, 252, 244, 0.65) 65%,
              rgba(235, 252, 244, 0.0) 100%
            );
            z-index: 1;
            pointer-events: none;
          }

          /* Banner 2: Modern Clinical Blue Doctor Graphic */
          .hero-mobile-promo-card-banner-2 {
            border: 1px solid rgba(56, 189, 248, 0.35);
            background: #EFF6FF;
            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.12);
          }

          .hero-mobile-promo-bg-2 {
            background-image: url('/mobile-hero-banner-02.png');
            background-size: cover;
            background-position: right 18%;
            background-repeat: no-repeat;
          }

          .hero-mobile-promo-card-banner-2::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
              90deg,
              rgba(240, 249, 255, 0.98) 0%,
              rgba(240, 249, 255, 0.94) 50%,
              rgba(240, 249, 255, 0.68) 66%,
              rgba(240, 249, 255, 0.0) 100%
            );
            z-index: 1;
            pointer-events: none;
          }

          /* Banner 3: Friendly Pediatric / Verified Healthcare Cartoon Graphic */
          .hero-mobile-promo-card-banner-3 {
            border: 1px solid rgba(16, 185, 129, 0.28);
            background: #ECFDF5;
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.1);
          }

          .hero-mobile-promo-bg-3 {
            background-image: url('/mobile-hero-banner-03.png');
            background-size: cover;
            background-position: right 15%;
            background-repeat: no-repeat;
          }

          .hero-mobile-promo-card-banner-3::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
              90deg,
              rgba(236, 253, 245, 0.98) 0%,
              rgba(236, 253, 245, 0.93) 48%,
              rgba(236, 253, 245, 0.65) 65%,
              rgba(236, 253, 245, 0.0) 100%
            );
            z-index: 1;
            pointer-events: none;
          }

          /* Banner 4: 24/7 Dedicated Support Center Graphic */
          .hero-mobile-promo-card-banner-4 {
            border: 1px solid rgba(20, 184, 166, 0.32);
            background: #F0FDFA;
            box-shadow: 0 6px 20px rgba(13, 148, 136, 0.12);
          }

          .hero-mobile-promo-bg-4 {
            background-image: url('/mobile-hero-banner-04.png');
            background-size: cover;
            background-position: right 14%;
            background-repeat: no-repeat;
          }

          .hero-mobile-promo-card-banner-4::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
              90deg,
              rgba(240, 253, 250, 0.98) 0%,
              rgba(240, 253, 250, 0.93) 50%,
              rgba(240, 253, 250, 0.68) 66%,
              rgba(240, 253, 250, 0.0) 100%
            );
            z-index: 1;
            pointer-events: none;
          }

          .hero-mobile-promo-bg-img {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
          }

          .hero-mobile-card-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            z-index: 2;
            padding-right: 4px;
            max-width: 65%;
          }

          .hero-mobile-card-left-slide2 {
            max-width: 63%;
          }

          .hero-mobile-card-left-slide3 {
            max-width: 60%;
          }

          .hero-mobile-card-left-slide4 {
            max-width: 62%;
          }

          .hero-mobile-card-banner-spacer {
            width: 35%;
            flex-shrink: 0;
            z-index: 2;
          }

          .hero-mobile-promo-title-1 {
            font-size: 19px;
            font-weight: 900;
            color: #0F2942;
            line-height: 1.25;
            margin: 0;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
          }

          .hero-mobile-promo-title-2 {
            font-size: 21px;
            font-weight: 900;
            color: #00803D;
            line-height: 1.25;
            margin: 2px 0 6px 0;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
          }

          /* Slide 2 Specific Accent Styling */
          .slide2-title-1 {
            color: #0F172A;
          }

          .slide2-title-2 {
            color: #0284C7; /* High-trust medical sky blue */
          }

          /* Slide 3 Specific Accent Styling */
          .slide3-title-1 {
            color: #064E3B; /* Deep emerald */
          }

          .slide3-title-2 {
            color: #059669; /* Warm green */
          }

          /* Slide 4 Specific Accent Styling */
          .slide4-title-1 {
            color: #0F172A;
          }

          .slide4-title-2 {
            color: #0D9488; /* Fresh teal cyan */
          }

          .hero-mobile-promo-sub {
            font-size: 11.5px;
            font-weight: 600;
            color: #334155;
            line-height: 1.45;
            margin: 0 0 14px 0;
            max-width: 200px;
            font-family: 'Hind Siliguri', sans-serif;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7);
          }

          .slide2-sub {
            color: #1E293B;
          }

          .slide3-sub {
            color: #065F46;
          }

          .slide4-sub {
            color: #134E4A;
          }

          .hero-mobile-dots {
            display: flex;
            align-items: center;
            gap: 5px;
            z-index: 2;
          }

          .hero-mobile-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(0, 128, 61, 0.28);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          }

          .hero-mobile-dot.active {
            width: 20px;
            border-radius: 99px;
            background: #00803D;
          }

          .hero-mobile-dot.slide2-dot {
            background: rgba(2, 132, 199, 0.25);
          }

          .hero-mobile-dot.slide2-dot.active {
            background: #0284C7;
          }

          .hero-mobile-dot.slide3-dot {
            background: rgba(5, 150, 105, 0.25);
          }

          .hero-mobile-dot.slide3-dot.active {
            background: #059669;
          }

          .hero-mobile-dot.slide4-dot {
            background: rgba(13, 148, 136, 0.25);
          }

          .hero-mobile-dot.slide4-dot.active {
            background: #0D9488;
          }

          .hero-mobile-card-right {
            position: relative;
            width: 135px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            flex-shrink: 0;
          }

          .hero-mobile-doctor-glow {
            position: absolute;
            width: 130px;
            height: 130px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.26) 0%, rgba(255,255,255,0) 70%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 0;
            pointer-events: none;
          }

          .hero-mobile-doctor-img {
            height: 142px;
            width: auto;
            object-fit: contain;
            position: relative;
            z-index: 1;
            mix-blend-mode: multiply;
            pointer-events: none;
            margin-bottom: -4px;
          }

          .hero-mobile-floating-badge {
            position: absolute;
            right: -6px;
            bottom: 12px;
            background: #FFFFFF;
            border-radius: 12px;
            padding: 5px 8px;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(226, 232, 240, 0.9);
            display: flex;
            align-items: center;
            gap: 6px;
            z-index: 3;
            white-space: nowrap;
          }

          .hero-mobile-badge-icon {
            width: 24px;
            height: 24px;
            border-radius: 7px;
            background: #E8F8F2;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #00B875;
            flex-shrink: 0;
          }

          .hero-mobile-badge-num {
            font-size: 11px;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.1;
          }

          .hero-mobile-badge-label {
            font-size: 9px;
            font-weight: 600;
            color: #64748B;
            line-height: 1.1;
          }

          /* ── 2. Search & Filter Bar ── */
          .hero-mobile-search-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 14px;
            width: 100%;
          }

          .hero-mobile-search-pill {
            flex: 1;
            height: 50px;
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            border-radius: 16px;
            padding: 0 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            transition: all 0.2s ease;
          }

          .hero-mobile-search-pill:focus-within {
            border-color: #00B875;
            box-shadow: 0 2px 12px rgba(0, 184, 117, 0.14);
          }

          .hero-mobile-search-icon {
            color: #00B875;
            flex-shrink: 0;
          }

          .hero-mobile-search-input {
            border: none;
            background: transparent;
            outline: none;
            width: 100%;
            font-size: 13.5px;
            font-weight: 600;
            color: #1E293B;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .hero-mobile-search-input::placeholder {
            color: #64748B;
            font-weight: 500;
            opacity: 1;
          }

          .hero-mobile-mic-btn {
            background: none;
            border: none;
            padding: 0;
            color: #00B875;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            flex-shrink: 0;
            transition: transform 0.15s ease;
          }

          .hero-mobile-mic-btn:active {
            transform: scale(0.9);
          }

          .hero-mobile-filter-btn {
            width: 50px;
            height: 50px;
            border-radius: 16px;
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1E293B;
            flex-shrink: 0;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            position: relative;
            transition: all 0.2s ease;
          }

          .hero-mobile-filter-btn:active {
            transform: scale(0.96);
            background: #F8FAFC;
          }

          .hero-mobile-filter-btn.active {
            border-color: #00B875;
            background: #E8F8F2;
            color: #008A58;
          }

          .hero-mobile-filter-active-dot {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00B875;
            box-shadow: 0 0 0 2px #FFFFFF;
          }

          /* ── 3. 4-Pill Filter Bar (Matching user image) ── */
          .hero-mobile-filter-pills-row {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 10px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
            padding: 2px 2px 0 2px;
            width: 100%;
          }

          .hero-mobile-filter-pills-row::-webkit-scrollbar {
            display: none;
          }

          .hero-mobile-filter-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            border-radius: 999px;
            padding: 5px 11px;
            font-size: 12px;
            font-weight: 700;
            color: #1E293B;
            white-space: nowrap;
            flex-shrink: 0;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
            transition: all 0.2s ease;
            user-select: none;
            font-family: 'Hind Siliguri', sans-serif;
            line-height: 1.2;
          }

          .hero-mobile-filter-pill:active {
            transform: scale(0.97);
            background: #F8FAFC;
          }

          .hero-mobile-filter-pill.active {
            background: #E8F8F2;
            border-color: #00803D;
            color: #00803D;
            box-shadow: 0 2px 8px rgba(0, 128, 61, 0.12);
          }

          .hero-mobile-filter-pill-clear {
            color: #64748B;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 2px;
            transition: color 0.15s;
          }

          .hero-mobile-filter-pill-clear:hover {
            color: #E53E3E;
          }

          /* ── 4. Quick Action Cards (3-Grid) ── */
          .hero-mobile-quick-actions {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 11px;
            width: 100%;
          }

          .hero-mobile-action-card {
            border-radius: 12px;
            padding: 9px 4px 8px 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
            text-align: center;
            min-height: 68px;
          }

          .hero-mobile-action-card:active {
            transform: scale(0.96);
          }

          .hero-mobile-action-mint {
            background: #E8F8F0;
            border: 1px solid rgba(0, 184, 117, 0.22);
          }

          .hero-mobile-action-blue {
            background: #EBF5FF;
            border: 1px solid rgba(59, 130, 246, 0.22);
          }

          .hero-mobile-action-orange {
            background: #FFF4E6;
            border: 1px solid rgba(249, 115, 22, 0.22);
          }

          .hero-mobile-action-purple {
            background: #F4F0FF;
            border: 1px solid rgba(139, 92, 246, 0.22);
          }

          .hero-mobile-action-cyan {
            background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
            border: 1.5px solid #0284C7;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);
            position: relative;
            overflow: visible;
          }

          .hero-mobile-live-badge {
            position: absolute;
            top: -6px;
            right: 4px;
            background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
            color: #FFFFFF;
            font-size: 8px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            gap: 3px;
            letter-spacing: 0.04em;
            box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
            border: 1px solid #BAE6FD;
            line-height: 1.2;
            z-index: 3;
          }

          .hero-mobile-live-pulse-dot {
            width: 5px;
            height: 5px;
            background-color: #38BDF8;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 6px #38BDF8;
            animation: qlsPulseDot 1.4s infinite ease-in-out;
          }

          .hero-mobile-action-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 4px;
            height: 26px;
            transition: transform 0.2s ease;
          }

          .hero-mobile-action-card:hover .hero-mobile-action-icon-wrapper {
            transform: translateY(-2px);
          }

          .hero-mobile-action-text {
            font-size: 11.5px;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.25;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
          }

          /* ── 5. Emergency Banner (Option 2: Modern Vibrant Coral-Red Look) ── */
          .hero-mobile-emergency-banner {
            margin-top: 11px;
            background: linear-gradient(135deg, #FF5252 0%, #E53935 55%, #D32F2F 100%);
            border-radius: 13px;
            padding: 7px 11px 7px 9px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(229, 57, 53, 0.16);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
            position: relative;
            overflow: hidden;
          }

          /* Ambient shine effect on the top-right corner */
          .hero-mobile-emergency-banner::after {
            content: '';
            position: absolute;
            top: -20px;
            right: -20px;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%);
            pointer-events: none;
          }

          .hero-mobile-emergency-banner:active {
            transform: scale(0.98);
            box-shadow: 0 2px 8px rgba(229, 57, 53, 0.18);
          }

          .hero-mobile-emergency-img-box {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
          }

          .hero-mobile-ambulance-svg {
            filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
            display: block;
          }

          .hero-mobile-emergency-info {
            flex: 1;
            min-width: 0;
            z-index: 2;
          }

          .hero-mobile-emergency-title {
            font-size: 13.5px;
            font-weight: 900;
            color: #FFFFFF;
            line-height: 1.2;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
          }

          .hero-mobile-emergency-desc {
            font-size: 10px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.95);
            line-height: 1.25;
            margin-top: 1px;
            font-family: 'Hind Siliguri', sans-serif;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
          }

          .hero-mobile-emergency-arrow {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
            color: #E53935;
            transition: transform 0.2s ease, background-color 0.2s ease;
            z-index: 2;
          }

          .hero-mobile-emergency-banner:hover .hero-mobile-emergency-arrow,
          .hero-mobile-emergency-banner:active .hero-mobile-emergency-arrow {
            transform: translateX(2px);
          }

          /* ── 6. Popular Specialties Section (Matching Reference Design) ── */
          .hero-mobile-specialties-section {
            margin-top: 14px;
            width: 100%;
          }

          .hero-mobile-section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 0 3px;
          }

          .hero-mobile-section-title {
            font-size: 17px;
            font-weight: 800;
            color: #0F172A;
            margin: 0;
            line-height: 1.2;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
          }

          .hero-mobile-section-all-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            font-weight: 700;
            color: #00803D;
            background: none;
            border: none;
            padding: 2px 4px;
            cursor: pointer;
            font-family: 'Hind Siliguri', sans-serif;
            transition: all 0.2s ease;
            text-decoration: none;
            border-radius: 6px;
          }

          .hero-mobile-section-all-link:hover,
          .hero-mobile-section-all-link:active {
            color: #00602D;
            background: rgba(0, 128, 61, 0.08);
          }

          .hero-mobile-section-all-arrow {
            font-size: 15px;
            line-height: 1;
            font-weight: 800;
            transition: transform 0.2s ease;
          }

          .hero-mobile-section-all-link:hover .hero-mobile-section-all-arrow {
            transform: translateX(3px);
          }

          .hero-mobile-specialties-scroll {
            display: flex;
            align-items: stretch;
            gap: 10px;
            overflow-x: auto;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            padding: 8px 3px 10px 3px;
            scrollbar-width: none;
          }

          .hero-mobile-specialties-scroll::-webkit-scrollbar {
            display: none;
          }

          .hero-mobile-specialty-card {
            flex: 0 0 76px;
            width: 76px;
            min-width: 76px;
            max-width: 76px;
            min-height: 84px;
            border-radius: 16px;
            border: 1px solid transparent;
            padding: 9px 3px 7px 3px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
            text-align: center;
            overflow: hidden;
            box-sizing: border-box;
          }

          .hero-mobile-specialty-card:active {
            transform: scale(0.93);
          }

          .hero-mobile-specialty-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 34px;
            margin-bottom: 5px;
            transition: transform 0.2s ease;
            flex-shrink: 0;
          }

          .hero-mobile-specialty-card:hover .hero-mobile-specialty-icon {
            transform: translateY(-2px);
          }

          .hero-mobile-specialty-name {
            font-size: 11px;
            font-weight: 700;
            color: #0F172A;
            line-height: 1.2;
            font-family: 'Hind Siliguri', sans-serif;
            text-align: center;
            width: 100%;
            max-width: 100%;
            padding: 0 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            letter-spacing: -0.01em;
            box-sizing: border-box;
          }

          /* 11th "সব দেখুন" card special styling */
          .hero-mobile-specialty-all-card {
            background: #E8F8F0 !important;
            border: 1px dashed #00B875 !important;
            box-shadow: 0 2px 8px rgba(0, 184, 117, 0.08) !important;
          }

          .hero-mobile-specialty-all-card:active {
            background: #D4F4E4 !important;
          }

          .hero-mobile-all-icon-box {
            background: #FFFFFF;
            width: 38px;
            height: 38px;
            border-radius: 12px;
            box-shadow: 0 2px 6px rgba(0, 184, 117, 0.12);
          }

          /* ── 6.2 Today Doctors Section (Matching Reference Design) ── */
          .hero-mobile-today-doctors-section {
            margin-top: 20px;
            width: 100%;
          }

          .hero-mobile-today-scroll {
            display: flex;
            align-items: stretch;
            gap: 12px;
            overflow-x: auto;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            padding: 4px 2px 6px 2px;
            scrollbar-width: none;
          }

          .hero-mobile-today-scroll::-webkit-scrollbar {
            display: none;
          }

          .hero-mobile-today-card {
            flex: 0 0 178px;
            width: 178px;
            min-width: 178px;
            max-width: 178px;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 18px;
            padding: 16px 12px 14px 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            position: relative;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            box-sizing: border-box;
            user-select: none;
          }

          .hero-mobile-today-card:active {
            transform: scale(0.98);
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
          }

          .hero-mobile-today-fav-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: transparent;
            border: none;
            padding: 4px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #94A3B8;
            transition: transform 0.2s ease;
            z-index: 2;
          }

          .hero-mobile-today-fav-btn:active {
            transform: scale(1.2);
          }

          .hero-mobile-today-fav-btn.active {
            color: #EF4444;
          }

          .hero-mobile-today-avatar-wrap {
            width: 76px;
            height: 76px;
            border-radius: 50%;
            overflow: hidden;
            margin-bottom: 12px;
            background: #F1F5F9;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .hero-mobile-today-avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top center;
            display: block;
          }

          .hero-mobile-today-name {
            font-size: 14px;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.25;
            margin: 0 0 4px 0;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            width: 100%;
          }

          .hero-mobile-today-specialty {
            font-size: 11.5px;
            font-weight: 600;
            color: #64748B;
            line-height: 1.25;
            margin-bottom: 2px;
            font-family: 'Hind Siliguri', sans-serif;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            width: 100%;
          }

          .hero-mobile-today-hospital {
            font-size: 11px;
            font-weight: 500;
            color: #94A3B8;
            line-height: 1.25;
            margin-bottom: 8px;
            font-family: 'Hind Siliguri', sans-serif;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            width: 100%;
          }

          .hero-mobile-today-rating {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            margin-bottom: 12px;
            line-height: 1;
          }

          .hero-mobile-today-rating-val {
            font-size: 13px;
            font-weight: 800;
            color: #0F172A;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .hero-mobile-today-rating-count {
            font-size: 11.5px;
            font-weight: 600;
            color: #64748B;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .hero-mobile-today-book-btn {
            width: 100%;
            height: 38px;
            border-radius: 999px;
            background: #00803D;
            color: #FFFFFF;
            border: none;
            font-size: 13px;
            font-weight: 700;
            font-family: 'Hind Siliguri', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(0, 128, 61, 0.22);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            margin-top: auto;
          }

          .hero-mobile-today-book-btn:active {
            transform: scale(0.96);
            background: #006832;
            box-shadow: 0 1px 4px rgba(0, 128, 61, 0.15);
          }

          /* Skeleton Loading for Today Doctors */
          .hero-mobile-today-skeleton {
            background: #FFFFFF;
            pointer-events: none;
          }

          .hero-mobile-today-skeleton-img {
            width: 76px;
            height: 76px;
            border-radius: 50%;
            background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
            background-size: 200% 100%;
            animation: heroShimmer 1.5s infinite;
            margin-bottom: 12px;
          }

          .hero-mobile-today-skeleton-line {
            height: 12px;
            width: 80%;
            border-radius: 6px;
            background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
            background-size: 200% 100%;
            animation: heroShimmer 1.5s infinite;
            margin-bottom: 6px;
          }

          .hero-mobile-today-skeleton-line.short { width: 65%; }
          .hero-mobile-today-skeleton-line.shorter { width: 45%; margin-bottom: 12px; }

          .hero-mobile-today-skeleton-btn {
            height: 36px;
            width: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
            background-size: 200% 100%;
            animation: heroShimmer 1.5s infinite;
            margin-top: auto;
          }

          @keyframes heroShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          /* ── 6.1 All Specialties Mobile Popup / Bottom Sheet ── */
          .hero-mobile-specialties-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.65);
            z-index: 999999;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            animation: locFadeIn 0.2s ease;
          }

          .hero-mobile-specialties-popup {
            background: #FFFFFF;
            width: 100%;
            max-width: 480px;
            max-height: 85vh;
            border-radius: 24px 24px 0 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.25);
            animation: mobileFilterSlideUp 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
            will-change: transform;
          }

          .hero-mobile-specialties-popup-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding: 4px 20px 14px 20px;
            border-bottom: 1px solid #F1F5F9;
            flex-shrink: 0;
            cursor: grab;
            touch-action: none;
            user-select: none;
          }

          .hero-mobile-specialties-popup-title {
            font-size: 17px;
            font-weight: 800;
            color: #0F172A;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .hero-mobile-specialties-count-badge {
            font-size: 11.5px;
            font-weight: 700;
            color: #00803D;
            background: #E8F8F0;
            padding: 2px 8px;
            border-radius: 20px;
            border: 1px solid rgba(0, 184, 117, 0.2);
          }

          .hero-mobile-specialties-popup-sub {
            font-size: 12px;
            color: #64748B;
            margin-top: 3px;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .hero-mobile-specialties-popup-search {
            padding: 12px 18px;
            background: #F8FAFC;
            border-bottom: 1px solid #F1F5F9;
            flex-shrink: 0;
          }

          .hero-mobile-specialties-search-box {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #FFFFFF;
            border: 1px solid #CBD5E1;
            border-radius: 12px;
            padding: 8px 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
            transition: border-color 0.15s ease;
          }

          .hero-mobile-specialties-search-box:focus-within {
            border-color: #00B875;
            box-shadow: 0 0 0 3px rgba(0, 184, 117, 0.12);
          }

          .hero-mobile-specialties-search-input {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-size: 13.5px;
            color: #0F172A;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .hero-mobile-specialties-search-input::placeholder {
            color: #94A3B8;
          }

          .hero-mobile-specialties-search-clear {
            background: none;
            border: none;
            padding: 0;
            color: #94A3B8;
            cursor: pointer;
            display: flex;
            align-items: center;
          }

          .hero-mobile-specialties-popup-grid {
            padding: 16px 16px calc(36px + env(safe-area-inset-bottom, 0px)) 16px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            overflow-y: auto;
            flex: 1;
            max-height: calc(85vh - 160px);
            scrollbar-width: thin;
            -webkit-overflow-scrolling: touch;
          }

          @media (max-width: 360px) {
            .hero-mobile-specialties-popup-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          .hero-mobile-specialties-popup-card {
            border-radius: 14px;
            border: 1px solid transparent;
            padding: 9px 3px 7px 3px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
            text-align: center;
            min-height: 80px;
            overflow: hidden;
            box-sizing: border-box;
          }

          .hero-mobile-specialties-popup-card:active {
            transform: scale(0.93);
          }

          .hero-mobile-specialties-empty {
            grid-column: 1 / -1;
            padding: 40px 10px;
            text-align: center;
            color: #94A3B8;
            font-size: 13px;
            font-family: 'Hind Siliguri', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }

          /* ── 7. Mobile Filter Bottom Sheet ── */
          .hero-mobile-filter-sheet {
            background: #FFFFFF;
            width: 100%;
            max-width: 480px;
            border-radius: 24px 24px 0 0;
            padding: 20px 20px calc(24px + env(safe-area-inset-bottom, 0px));
            box-shadow: 0 -10px 40px rgba(0,0,0,0.18);
            animation: mobileFilterSlideUp 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
          }

          @keyframes mobileFilterSlideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }

          .hero-mobile-filter-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #EDF2F7;
          }

          .hero-mobile-filter-title {
            font-size: 17px;
            font-weight: 800;
            color: #0F172A;
            font-family: "'Hind Siliguri', sans-serif";
          }

          .hero-mobile-filter-body {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
          }

          .hero-mobile-filter-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 14px;
            border-radius: 14px;
            background: #F8FAFC;
            border: 1.5px solid #E2E8F0;
            cursor: pointer;
            transition: all 0.18s ease;
          }

          .hero-mobile-filter-item:active {
            background: #E8F8F2;
            border-color: #00B875;
          }

          .hero-mobile-filter-icon-box {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: #E8F8F2;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .hero-mobile-filter-item-info {
            flex: 1;
            overflow: hidden;
          }

          .hero-mobile-filter-item-label {
            font-size: 11px;
            color: #64748B;
            font-weight: 600;
            display: block;
          }

          .hero-mobile-filter-item-val {
            font-size: 13.5px;
            color: #1E293B;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
            margin-top: 2px;
          }

          .hero-mobile-filter-footer {
            display: flex;
            gap: 10px;
          }

          .hero-mobile-filter-reset-btn {
            flex: 1;
            height: 48px;
            border-radius: 14px;
            background: #F1F5F9;
            border: none;
            color: #475569;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
          }

          .hero-mobile-filter-apply-btn {
            flex: 2;
            height: 48px;
            border-radius: 14px;
            background: linear-gradient(135deg, #00B875 0%, #008A58 100%);
            border: none;
            color: #FFFFFF;
            font-weight: 800;
            font-size: 15px;
            box-shadow: 0 4px 14px rgba(0, 184, 117, 0.3);
            cursor: pointer;
          }

          /* ── 8. Smart Unified Search Bottom Sheet Modal ── */
          .hero-mobile-unified-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(4px);
            z-index: 99999;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            animation: locFadeIn 0.28s ease;
            touch-action: none;
          }

          .hero-mobile-unified-popup {
            background: #FFFFFF;
            width: 100%;
            max-width: 480px;
            height: 82vh;
            height: 82dvh;
            max-height: 85vh;
            border-radius: 24px 24px 0 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.28);
            animation: mobileFilterSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1);
            will-change: transform;
            touch-action: pan-y;
          }

          /* Top Drag Handle Indicator Bar */
          .hero-mobile-sheet-drag-zone {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px 0 6px 0;
            cursor: grab;
            touch-action: none;
            user-select: none;
            background: #FFFFFF;
          }

          .hero-mobile-sheet-drag-zone:active {
            cursor: grabbing;
          }

          .hero-mobile-sheet-drag-bar {
            width: 44px;
            height: 4.5px;
            border-radius: 999px;
            background: #CBD5E1;
            transition: background 0.2s ease, transform 0.2s ease;
          }

          .hero-mobile-sheet-drag-zone:hover .hero-mobile-sheet-drag-bar,
          .hero-mobile-sheet-drag-zone:active .hero-mobile-sheet-drag-bar {
            background: #94A3B8;
            transform: scaleY(1.2);
          }

          .hero-mobile-unified-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding: 4px 20px 12px 20px;
            border-bottom: 1px solid #F1F5F9;
            flex-shrink: 0;
            touch-action: none;
            cursor: grab;
            user-select: none;
          }

          .hero-mobile-unified-title {
            font-size: 17px;
            font-weight: 800;
            color: #0F172A;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .hero-mobile-unified-badge {
            background: #E8F8F0;
            color: #00803D;
            font-size: 11.5px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            border: 1px solid rgba(0, 184, 117, 0.2);
          }

          .hero-mobile-unified-sub {
            font-size: 12px;
            color: #64748B;
            margin-top: 3px;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .hero-mobile-unified-tabs {
            display: flex;
            background: #F8FAFC;
            padding: 8px 16px;
            gap: 8px;
            border-bottom: 1px solid #E2E8F0;
            flex-shrink: 0;
          }

          .hero-mobile-unified-tab {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 8px 10px;
            border-radius: 10px;
            border: 1px solid #E2E8F0;
            background: #FFFFFF;
            color: #64748B;
            font-size: 13px;
            font-weight: 700;
            font-family: 'Hind Siliguri', sans-serif;
            cursor: pointer;
            transition: all 0.15s ease;
            position: relative;
          }

          .hero-mobile-unified-tab.active {
            background: #00803D;
            border-color: #00803D;
            color: #FFFFFF;
            box-shadow: 0 2px 8px rgba(0, 128, 61, 0.25);
          }

          .unified-tab-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #FF5252;
            position: absolute;
            top: 6px;
            right: 6px;
          }
          .hero-mobile-unified-tab.active .unified-tab-dot {
            background: #FFD54F;
          }

          .hero-mobile-unified-content {
            flex: 1;
            overflow-y: auto;
            padding: 14px 16px;
            scrollbar-width: thin;
            -webkit-overflow-scrolling: touch;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }

          .hero-mobile-unified-footer {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px calc(14px + env(safe-area-inset-bottom, 0px)) 16px;
            background: #FFFFFF;
            border-top: 1px solid #F1F5F9;
            flex-shrink: 0;
          }

          .hero-mobile-unified-reset-btn {
            flex: 1;
            height: 48px;
            border-radius: 12px;
            background: #F1F5F9;
            border: 1px solid #E2E8F0;
            color: #475569;
            font-weight: 700;
            font-size: 13.5px;
            cursor: pointer;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .hero-mobile-unified-search-btn {
            flex: 2.2;
            height: 48px;
            border-radius: 12px;
            background: linear-gradient(135deg, #00B875 0%, #00803D 100%);
            border: none;
            color: #FFFFFF;
            font-weight: 800;
            font-size: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 14px rgba(0, 184, 117, 0.35);
            cursor: pointer;
            font-family: 'Hind Siliguri', sans-serif;
            transition: transform 0.15s ease;
          }

          .hero-mobile-unified-search-btn:active {
            transform: scale(0.98);
          }

          /* Location styles inside unified sheet */
          .unified-loc-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .unified-loc-selected-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: #E8F8F2;
            border: 1px solid #A7F3D0;
            border-radius: 10px;
            font-size: 12.5px;
            color: #065F46;
            font-family: 'Hind Siliguri', sans-serif;
          }
          .unified-loc-clear-btn {
            background: none;
            border: none;
            color: #EF4444;
            padding: 2px;
            cursor: pointer;
            display: flex;
            align-items: center;
          }
          .unified-loc-nav-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 2px;
          }
          .unified-loc-back-btn {
            background: #F1F5F9;
            border: 1px solid #CBD5E1;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            color: #334155;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            font-family: 'Hind Siliguri', sans-serif;
          }
          .unified-loc-step-title {
            font-size: 13px;
            font-weight: 700;
            color: #0F172A;
            font-family: 'Hind Siliguri', sans-serif;
          }
          .unified-loc-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 4px;
          }
          .unified-loc-card {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 700;
            color: #1E293B;
            font-family: 'Hind Siliguri', sans-serif;
            cursor: pointer;
            text-align: left;
            transition: all 0.15s ease;
          }
          .unified-loc-card:active {
            background: #F8FAFC;
          }
          .unified-loc-card.active {
            background: #E8F8F2;
            border-color: #00B875;
            color: #00803D;
          }

          /* Hospital styles inside unified sheet */
          .unified-hospital-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
          }
          .unified-hospital-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .unified-hospital-card.active {
            background: #F0FDF4;
            border-color: #00B875;
          }
          .unified-hospital-icon-box {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: #E8F8F2;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .unified-hospital-info {
            flex: 1;
            overflow: hidden;
          }
          .unified-hospital-name {
            font-size: 13.5px;
            font-weight: 700;
            color: #0F172A;
            font-family: 'Hind Siliguri', sans-serif;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .unified-hospital-sub {
            font-size: 11.5px;
            color: #64748B;
            font-family: 'Hind Siliguri', sans-serif;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 1px;
          }
          .unified-check-circle {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 1.5px solid #CBD5E1;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .unified-check-circle.active {
            background: #00B875;
            border-color: #00B875;
          }
          .unified-card-badge {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #00803D;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .loc-popup-box { max-width: 96vw; margin: 0 8px; }
          .loc-popup-overlay { padding-top: 80px; }
        }

        /* ── Quick Live Serial Modal (QLS) ── */
        .qls-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: qlsOverlayFade 0.2s ease-out;
        }

        @keyframes qlsOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .qls-modal-content {
          background: #FFFFFF;
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.28);
          animation: qlsModalSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Hind Siliguri', sans-serif;
        }

        @keyframes qlsModalSlideUp {
          from { transform: translateY(20px) scale(0.97); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .qls-drag-indicator {
          display: none;
        }

        .qls-modal-header {
          padding: 16px 20px 14px 20px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid #F1F5F9;
          background: #FFFFFF;
        }

        .qls-header-title-box {
          flex: 1;
        }

        .qls-live-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #E0F2FE;
          color: #0284C7;
          font-size: 11px;
          font-weight: 700;
          padding: 2.5px 8px;
          border-radius: 999px;
          margin-bottom: 6px;
          border: 1px solid #BAE6FD;
        }

        .qls-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0284C7;
          box-shadow: 0 0 6px #0284C7;
          animation: qlsPulseDot 1.4s infinite ease-in-out;
        }

        .qls-title {
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 3px 0;
          line-height: 1.3;
        }

        .qls-subtitle {
          font-size: 12px;
          color: #64748B;
          margin: 0;
          line-height: 1.4;
        }

        .qls-close-btn {
          background: #F1F5F9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          transition: all 0.18s;
          flex-shrink: 0;
          margin-left: 12px;
        }

        .qls-close-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        .qls-search-form {
          padding: 12px 18px;
          background: #F8FAFC;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .qls-input-wrap {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .qls-input-icon {
          position: absolute;
          left: 11px;
          color: #0284C7;
          pointer-events: none;
        }

        .qls-input {
          width: 100%;
          height: 42px;
          padding: 0 30px 0 36px;
          border: 1.5px solid #CBD5E1;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 700;
          color: #0F172A;
          outline: none;
          background: #FFFFFF;
          transition: border-color 0.2s, box-shadow 0.2s;
          letter-spacing: 0.04em;
        }

        .qls-input:focus {
          border-color: #0284C7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.16);
        }

        .qls-clear-input {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qls-clear-input:hover {
          color: #E11D48;
        }

        .qls-submit-btn {
          height: 42px;
          padding: 0 16px;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 10px rgba(2, 132, 199, 0.3);
          transition: transform 0.18s, box-shadow 0.18s;
        }

        .qls-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .qls-submit-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 14px rgba(2, 132, 199, 0.4);
        }

        .qls-error-box {
          margin: 10px 18px 0 18px;
          padding: 8px 12px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          color: #DC2626;
          font-size: 12px;
          font-weight: 600;
        }

        .qls-results-container {
          flex: 1;
          overflow-y: auto;
          padding: 14px 18px;
          min-height: 160px;
          max-height: 380px;
        }

        .qls-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 16px;
          color: #64748B;
          gap: 12px;
          text-align: center;
          font-size: 13px;
        }

        .qls-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          text-align: center;
        }

        .qls-empty-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #E0F2FE;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .qls-empty-state h4 {
          font-size: 15px;
          font-weight: 800;
          color: #1E293B;
          margin: 0 0 6px 0;
        }

        .qls-empty-state p {
          font-size: 12px;
          color: #64748B;
          max-width: 290px;
          margin: 0 0 14px 0;
          line-height: 1.5;
        }

        .qls-book-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          background: #00B875;
          color: #FFFFFF;
          border: none;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 184, 117, 0.28);
        }

        .qls-appointments-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .qls-appointment-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 13px 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          transition: border-color 0.2s;
        }

        .qls-appointment-card:hover {
          border-color: #BAE6FD;
        }

        .qls-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 11px;
        }

        .qls-doc-specialty {
          font-size: 11px;
          font-weight: 700;
          color: #0284C7;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .qls-doc-name {
          font-size: 14.5px;
          font-weight: 800;
          color: #0F172A;
          margin: 2px 0;
        }

        .qls-chamber-name {
          font-size: 12px;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .qls-today-badge {
          background: #DCFCE7;
          color: #15803D;
          font-size: 10.5px;
          font-weight: 700;
          padding: 2.5px 8px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          border: 1px solid #BBF7D0;
        }

        .qls-counters-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        .qls-counter-box {
          padding: 8px 4px;
          border-radius: 10px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .qls-box-your {
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
        }

        .qls-box-serving {
          background: #E0F2FE;
          border: 1.5px solid #7DD3FC;
        }

        .qls-box-ahead {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
        }

        .qls-counter-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748B;
          margin-bottom: 2px;
          white-space: nowrap;
        }

        .qls-counter-value {
          font-size: 16px;
          font-weight: 900;
          color: #0F172A;
        }

        .qls-box-serving .qls-counter-value {
          color: #0369A1;
        }

        .qls-card-actions {
          display: flex;
          gap: 8px;
        }

        .qls-tv-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s;
        }

        .qls-tv-btn:active {
          transform: scale(0.97);
        }

        .qls-ticket-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 12px;
          background: #F1F5F9;
          color: #334155;
          border: 1px solid #CBD5E1;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .qls-modal-footer {
          padding: 10px 16px;
          background: #F8FAFC;
          border-top: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          color: #64748B;
          text-align: center;
        }

        @media (max-width: 576px) {
          .hero-section-main {
            padding-top: calc(var(--header-height, 68px) + 10px) !important;
            padding-bottom: 4px !important;
          }
          .qls-modal-overlay {
            align-items: flex-end;
            padding: 0;
          }
          .qls-modal-content {
            border-radius: 22px 22px 0 0;
            max-height: 88vh;
            animation: qlsBottomSheetSlide 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes qlsBottomSheetSlide {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .qls-drag-indicator {
            display: block;
            width: 38px;
            height: 4px;
            background: #CBD5E1;
            border-radius: 999px;
            margin: 8px auto 2px auto;
          }
        }
      `}</style>
    </section>
  )
})

export default HeroSection

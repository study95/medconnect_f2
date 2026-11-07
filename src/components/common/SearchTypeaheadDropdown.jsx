import React, { useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  IconSearch,
  IconBuildingHospital,
  IconLoader2,
  IconArrowRight,
  IconAlertCircle
} from '@tabler/icons-react'
import useDebounce from '../../hooks/useDebounce'
import { getSearchSuggestions } from '../../api/searchApi'
import { getDoctorUrl, getHospitalUrl } from '../../utils/identifierHelper'

// Deterministic pastel palette generator for avatar initials
const AVATAR_PALETTES = [
  { bg: '#F3E8FF', text: '#7E22CE' }, // Purple
  { bg: '#DCFCE7', text: '#15803D' }, // Green
  { bg: '#FEF3C7', text: '#B45309' }, // Amber
  { bg: '#E0E7FF', text: '#4338CA' }, // Indigo
  { bg: '#FCE7F3', text: '#BE185D' }, // Pink
  { bg: '#E0F2FE', text: '#0369A1' }, // Sky
  { bg: '#CCFBF1', text: '#0F766E' }, // Teal
]

function getAvatarPalette(name = '') {
  if (!name) return AVATAR_PALETTES[0]
  let sum = 0
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i)
  }
  return AVATAR_PALETTES[sum % AVATAR_PALETTES.length]
}

function getInitialLetter(name = '') {
  const clean = name.replace(/^(Dr\.|Prof\.|Md\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim()
  return (clean[0] || name[0] || 'D').toUpperCase()
}

export default function SearchTypeaheadDropdown({
  query = '',
  isOpen = false,
  onClose,
  onSelectSearchAll,
  type = 'all', // 'all' | 'doctor' | 'hospital'
  anchorRef = null,
  className = '',
}) {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  const cleanQuery = query.trim()
  const debouncedQuery = useDebounce(cleanQuery, 250)
  const isQueryLongEnough = debouncedQuery.length >= 2

  // Fetch suggestions via TanStack React Query with instant in-memory cache
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['live-search-suggestions', debouncedQuery, type],
    queryFn: async () => {
      const res = await getSearchSuggestions(debouncedQuery, 5, type)
      return res.data?.data || { doctors: [], hospitals: [], specialties: [] }
    },
    enabled: isOpen && isQueryLongEnough,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const doctors = useMemo(() => data?.doctors || [], [data])
  const hospitals = useMemo(() => data?.hospitals || [], [data])
  const hasResults = doctors.length > 0 || hospitals.length > 0

  // Outside click and ESC listener
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target))
      ) {
        onClose?.()
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, anchorRef])

  if (!isOpen || !isQueryLongEnough) {
    return null
  }

  // Single Action Header Click (Whatever user typed, search with that text)
  const handleTopActionClick = () => {
    if (onSelectSearchAll) {
      onSelectSearchAll(cleanQuery, type)
    } else {
      if (type === 'hospital') {
        navigate(`/hospitals?search=${encodeURIComponent(cleanQuery)}`)
      } else {
        navigate(`/doctors?search=${encodeURIComponent(cleanQuery)}`)
      }
    }
    onClose?.()
  }

  const handleDoctorClick = (doctor) => {
    const url = doctor.canonical_url || getDoctorUrl(doctor)
    navigate(url)
    onClose?.()
  }

  const handleHospitalClick = (hospital) => {
    const url = hospital.canonical_url || getHospitalUrl(hospital)
    navigate(url)
    onClose?.()
  }

  // Dynamic header text based on page context
  const headerActionLabel = (() => {
    if (type === 'doctor') return `Search all doctors with "${cleanQuery}"`
    if (type === 'hospital') return `Search all hospitals with "${cleanQuery}"`
    return `Search for "${cleanQuery}"`
  })()

  return (
    <div
      ref={dropdownRef}
      className={`bbl-typeahead-container ${className}`}
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        width: '100%',
        maxWidth: '560px',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 16px 36px -6px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.06)',
        zIndex: 99999,
        overflow: 'hidden',
        textAlign: 'left',
        maxHeight: '440px',
      }}
    >
      <div className="bbl-typeahead-scroll" style={{ maxHeight: '440px', overflowY: 'auto' }}>
        {/* ===================== ONLY 1 TOP SEARCH ACTION HEADER ===================== */}
        <div
          onClick={handleTopActionClick}
          className="bbl-typeahead-header-action"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid #F1F5F9',
            backgroundColor: '#FAFAFA',
            transition: 'background-color 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <IconSearch size={17} color="#64748B" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: '14px',
                color: '#334155',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {headerActionLabel.slice(0, headerActionLabel.indexOf(`"${cleanQuery}"`))}
              <strong style={{ color: '#0F172A', fontWeight: 600 }}>&ldquo;{cleanQuery}&rdquo;</strong>
            </span>
          </div>
          <IconArrowRight size={15} color="#94A3B8" style={{ flexShrink: 0 }} />
        </div>

        {/* Loading Indicator */}
        {(isLoading || isFetching) && !hasResults && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '20px 16px',
              color: '#64748B',
              fontSize: '14px',
            }}
          >
            <IconLoader2 size={18} className="animate-spin" style={{ color: '#00B875' }} />
            <span>খোঁজা হচ্ছে...</span>
          </div>
        )}

        {/* ===================== DOCTORS LIST ===================== */}
        {(type === 'all' || type === 'doctor') && doctors.length > 0 && (
          <div>
            {doctors.map((doctor) => {
              const palette = getAvatarPalette(doctor.name)
              const initial = getInitialLetter(doctor.name)

              return (
                <div
                  key={`doc-${doctor.id}`}
                  onClick={() => handleDoctorClick(doctor)}
                  className="bbl-typeahead-item"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '11px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #F8FAFC',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Left: Avatar / Photo */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      minWidth: '42px',
                      minHeight: '42px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: palette.bg,
                      color: palette.text,
                      fontWeight: 700,
                      fontSize: '16px',
                      flexShrink: 0,
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {doctor.photo_url ? (
                      <img
                        src={doctor.photo_url}
                        alt={doctor.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <span style={{ display: doctor.photo_url ? 'none' : 'inline' }}>
                      {initial}
                    </span>
                  </div>

                  {/* Right: Info */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '3px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14.5px',
                        fontWeight: 600,
                        color: '#0F172A',
                        lineHeight: '1.25',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
                      }}
                    >
                      {doctor.name}
                    </div>

                    {doctor.specialty && (
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: '#00B875',
                          fontWeight: 600,
                          lineHeight: '1.2',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
                        }}
                      >
                        {doctor.specialty}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ===================== HOSPITALS LIST ===================== */}
        {(type === 'all' || type === 'hospital') && hospitals.length > 0 && (
          <div>
            {type === 'all' && doctors.length > 0 && (
              <div
                style={{
                  padding: '8px 16px 4px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  backgroundColor: '#F8FAFC',
                  borderTop: '1px solid #F1F5F9',
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                হাসপাতাল ও প্রতিষ্ঠান
              </div>
            )}

            {hospitals.map((hospital) => {
              const locationText = hospital.location || hospital.address || hospital.hospital_type

              return (
                <div
                  key={`hosp-${hospital.id}`}
                  onClick={() => handleHospitalClick(hospital)}
                  className="bbl-typeahead-item"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '11px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #F8FAFC',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Left: Hospital Logo / Icon */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      minWidth: '42px',
                      minHeight: '42px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#F0FDFA',
                      color: '#0D9488',
                      flexShrink: 0,
                      border: '1px solid #CCFBF1',
                    }}
                  >
                    {hospital.photo_url ? (
                      <img
                        src={hospital.photo_url}
                        alt={hospital.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div style={{ display: hospital.photo_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconBuildingHospital size={21} />
                    </div>
                  </div>

                  {/* Right: Hospital Info */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '3px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14.5px',
                        fontWeight: 600,
                        color: '#0F172A',
                        lineHeight: '1.25',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
                      }}
                    >
                      {hospital.name}
                    </div>

                    {locationText && (
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: '#64748B',
                          lineHeight: '1.2',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
                        }}
                      >
                        {hospital.hospital_type && (
                          <span style={{ color: '#0D9488', fontWeight: 600 }}>{hospital.hospital_type}</span>
                        )}
                        {hospital.hospital_type && (hospital.location || hospital.address) && (
                          <span style={{ color: '#CBD5E1' }}>•</span>
                        )}
                        <span>{hospital.location || hospital.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty Not Found State */}
        {!isLoading && !isFetching && !hasResults && isQueryLongEnough && (
          <div
            style={{
              padding: '28px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                marginBottom: '4px',
              }}
            >
              <IconAlertCircle size={22} />
            </div>
            <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#334155' }}>
              &ldquo;{cleanQuery}&rdquo; দিয়ে কোনো {type === 'hospital' ? 'হাসপাতাল' : 'ডাক্তার'} পাওয়া যায়নি
            </div>
            <div style={{ fontSize: '12.5px', color: '#94A3B8' }}>
              সঠিক বানান লিখে আবার চেষ্টা করুন অথবা উপরের বাটনে ক্লিক করুন
            </div>
          </div>
        )}
      </div>

      <style>{`
        .bbl-typeahead-header-action:hover {
          background-color: #F1F5F9 !important;
        }
        .bbl-typeahead-item:hover {
          background-color: #F0FDF4 !important;
        }
        .bbl-typeahead-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .bbl-typeahead-scroll::-webkit-scrollbar-track {
          background: #F8FAFC;
        }
        .bbl-typeahead-scroll::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 9999px;
        }
        .bbl-typeahead-scroll::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>
    </div>
  )
}

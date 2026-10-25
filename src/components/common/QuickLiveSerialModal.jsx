import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { trackLiveSerialByPhone } from '../../api/appointmentApi'
import {
  IconPhone,
  IconX,
  IconBroadcast,
  IconActivity,
  IconArrowRight,
  IconBuildingHospital,
  IconDeviceTv,
  IconReportMedical,
  IconHeadset,
  IconCalendar,
  IconClock,
  IconInfoCircle,
  IconCalendarEvent,
  IconTicket,
  IconSearch
} from '@tabler/icons-react'

// Convert numbers to Bengali digits
const toBn = (num) => {
  if (num === null || num === undefined || num === '') return ''
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num).replace(/\d/g, d => bnDigits[Number(d)])
}

// Format YYYY-MM-DD to Bengali readable date (e.g. ২৮ অক্টোবর, ২০২৬ (বুধবার))
const formatBanglaDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const cleanStr = String(dateStr).substring(0, 10)
    const [y, m, d] = cleanStr.split('-').map(Number)
    if (!y || !m || !d) return dateStr

    const monthsBn = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ]
    const dayNameBnMap = {
      0: 'রবিবার',
      1: 'সোমবার',
      2: 'মঙ্গলবার',
      3: 'বুধবার',
      4: 'বৃহস্পতিবার',
      5: 'শুক্রবার',
      6: 'শনিবার'
    }
    const dateObj = new Date(y, m - 1, d, 12, 0, 0)
    const dayOfWeek = dayNameBnMap[dateObj.getDay()] || ''
    const monthName = monthsBn[m - 1] || ''
    const dayBn = toBn(d)
    const yearBn = toBn(y)

    return `${dayBn} ${monthName}, ${yearBn}${dayOfWeek ? ` (${dayOfWeek})` : ''}`
  } catch {
    return toBn(dateStr)
  }
}

// Format 24h / time string to 12-hour Bengali time (e.g. বিকেল ৫:৩০ টা)
const formatTime12h = (timeStr) => {
  if (!timeStr) return null
  const cleaned = String(timeStr).trim()
  if (!cleaned || cleaned === 'null' || cleaned === 'undefined') return null

  if (cleaned.includes('-')) {
    const parts = cleaned.split('-').map(p => formatTime12h(p.trim())).filter(Boolean)
    if (parts.length === 2) return `${parts[0]} - ${parts[1]}`
  }

  const m = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?$/i)
  if (m) {
    let hours = parseInt(m[1], 10)
    const minutes = m[2]
    const meridiem = (m[3] || '').toUpperCase()

    if (meridiem === 'PM' && hours < 12) hours += 12
    if (meridiem === 'AM' && hours === 12) hours = 0

    let period = 'সকাল'
    if (hours >= 12 && hours < 16) {
      period = 'দুপুর'
    } else if (hours >= 16 && hours < 18) {
      period = 'বিকেল'
    } else if (hours >= 18 && hours < 20) {
      period = 'সন্ধ্যা'
    } else if (hours >= 20 || hours < 5) {
      period = 'রাত'
    }
    const h12 = hours % 12 || 12
    return `${period} ${toBn(h12)}:${toBn(minutes)}`
  }
  return toBn(cleaned)
}

export default function QuickLiveSerialModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const initialPhone = user?.phone || user?.mobile || ''
      if (initialPhone) {
        setSearchQuery(initialPhone)
        handleSearchSubmit(null, initialPhone)
      } else {
        setTimeout(() => inputRef.current?.focus(), 120)
      }
    } else {
      document.body.style.overflow = ''
      setSearched(false)
      setResults([])
      setErrorMsg('')
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSearchSubmit = async (e, directQuery = null) => {
    if (e && e.preventDefault) e.preventDefault()
    const target = (directQuery !== null ? directQuery : searchQuery).trim()
    if (!target) {
      setErrorMsg('অনুগ্রহ করে মোবাইল নম্বর অথবা অ্যাপয়েন্টমেন্ট আইডি দিন')
      return
    }

    const cleanDigits = target.replace(/[^\d]/g, '')
    // If the input starts with 01 and looks like a phone number, validate 11 digits
    if (/^01[3-9]/.test(target) && cleanDigits.length < 11) {
      setErrorMsg('অনুগ্রহ করে সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)')
      return
    }

    if (target.length < 3) {
      setErrorMsg('অনুগ্রহ করে সঠিক নম্বর বা আইডি দিন (কমপক্ষে ৩ অক্ষর)')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const res = await trackLiveSerialByPhone(target)
      if (res.data?.success) {
        setResults(res.data.data || [])
        setSearched(true)
      } else {
        setErrorMsg(res.data?.message || 'কোনো সক্রিয় সিরিয়াল পাওয়া যায়নি')
        setSearched(true)
      }
    } catch {
      setErrorMsg('সার্ভারে সাময়িক সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।')
    } finally {
      setLoading(false)
    }
  }

  // Detect pattern for dynamic icon helper
  const isPhonePattern = /^01[3-9]/.test(searchQuery.trim())
  const isIdPattern = /^AP/i.test(searchQuery.trim()) || /[a-zA-Z]/.test(searchQuery.trim())

  // Sort results so today's appointment comes first, then upcoming dates
  const sortedResults = [...results].sort((a, b) => {
    if (a.is_today && !b.is_today) return -1
    if (!a.is_today && b.is_today) return 1
    const dateA = a.appointment_date || ''
    const dateB = b.appointment_date || ''
    return dateA.localeCompare(dateB)
  })

  if (!isOpen) return null

  return createPortal(
    <div className="qls-modal-overlay" onClick={onClose}>
      <div className="qls-modal-content" onClick={e => e.stopPropagation()}>
        {/* Mobile Swipe handle */}
        <div className="qls-drag-indicator" />

        {/* Modal Header */}
        <div className="qls-modal-header">
          <div className="qls-header-title-box">
            <div className="qls-live-pill-badge">
              <span className="qls-pulse-dot" />
              <span>রিয়েল-টাইম মনিটর</span>
            </div>
            <h3 className="qls-title">লাইভ সিরিয়াল ট্র্যাকিং</h3>
            <p className="qls-subtitle">মোবাইল নম্বর বা অ্যাপয়েন্টমেন্ট আইডি দিয়ে বর্তমান সিরিয়াল জানুন</p>
          </div>
          <button className="qls-close-btn" onClick={onClose} aria-label="Close">
            <IconX size={20} />
          </button>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="qls-search-form">
          <div className="qls-input-wrap">
            {isIdPattern ? (
              <IconTicket size={18} className="qls-input-icon text-amber-600" />
            ) : isPhonePattern ? (
              <IconPhone size={18} className="qls-input-icon text-sky-600" />
            ) : (
              <IconSearch size={18} className="qls-input-icon text-slate-400" />
            )}
            <input
              ref={inputRef}
              type="text"
              placeholder="মোবাইল নং বা অ্যাপয়েন্টমেন্ট আইডি"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                if (errorMsg) setErrorMsg('')
              }}
              className="qls-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="qls-clear-input"
                onClick={() => {
                  setSearchQuery('')
                  setResults([])
                  setSearched(false)
                  setErrorMsg('')
                  inputRef.current?.focus()
                }}
              >
                <IconX size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || searchQuery.trim().length < 3}
            className="qls-submit-btn"
          >
            <IconBroadcast size={17} />
            <span>{loading ? 'অনুসন্ধান হচ্ছে...' : 'সিরিয়াল দেখুন'}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="qls-error-box">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results Body */}
        <div className="qls-results-container">
          {loading && (
            <div className="qls-skeleton-container" aria-busy="true" aria-live="polite">
              <div className="qls-skeleton-card">
                <div className="qls-skeleton-top">
                  <div style={{ flex: 1 }}>
                    <div className="qls-shimmer-box" style={{ width: '38%', height: 11, marginBottom: 8 }} />
                    <div className="qls-shimmer-box" style={{ width: '62%', height: 17, marginBottom: 8 }} />
                    <div className="qls-shimmer-box" style={{ width: '48%', height: 13 }} />
                  </div>
                  <div className="qls-shimmer-box" style={{ width: 84, height: 24, borderRadius: 999 }} />
                </div>

                <div className="qls-skeleton-counters">
                  <div className="qls-shimmer-box" style={{ height: 58, borderRadius: 10 }} />
                  <div className="qls-shimmer-box" style={{ height: 58, borderRadius: 10 }} />
                  <div className="qls-shimmer-box" style={{ height: 58, borderRadius: 10 }} />
                </div>

                <div className="qls-skeleton-actions">
                  <div className="qls-shimmer-box" style={{ flex: 1, height: 38, borderRadius: 9 }} />
                  <div className="qls-shimmer-box" style={{ width: 88, height: 38, borderRadius: 9 }} />
                </div>
              </div>
              <div className="qls-skeleton-hint">
                <span className="qls-pulse-dot" />
                <span>লাইভ চেম্বার সার্ভার থেকে তথ্য সংগ্রহ করা হচ্ছে...</span>
              </div>
            </div>
          )}

          {!loading && searched && sortedResults.length === 0 && (
            <div className="qls-empty-state">
              <div className="qls-empty-icon-box">
                <IconActivity size={32} color="#0EA5E9" />
              </div>
              <h4>কোনো সক্রিয় সিরিয়াল নেই</h4>
              <p>এই মোবাইল নম্বর বা অ্যাপয়েন্টমেন্ট আইডিতে আজকের বা আসন্ন কোনো সক্রিয় সিরিয়াল পাওয়া যায়নি। আপনি কি নতুন কোনো ডাক্তারের সিরিয়াল বুক করতে চান?</p>
              <button
                type="button"
                className="qls-book-cta-btn"
                onClick={() => {
                  onClose()
                  navigate('/quick-appointment')
                }}
              >
                <span>নতুন সিরিয়াল বুক করুন</span>
                <IconArrowRight size={16} />
              </button>
            </div>
          )}

          {!loading && sortedResults.length > 0 && (
            <div className="qls-appointments-list">
              {sortedResults.length > 1 && (
                <div className="qls-multi-count-pill">
                  <IconCalendarEvent size={15} />
                  <span>আপনার মোট <strong>{toBn(sortedResults.length)}টি</strong> সিরিয়াল পাওয়া গেছে:</span>
                </div>
              )}

              {sortedResults.map((item, idx) => {
                const isToday = Boolean(item.is_today)
                const startTimeStr = formatTime12h(item.appointment_time || item.chamber_start_time)

                return (
                  <div
                    key={item.id || idx}
                    className={`qls-appointment-card ${isToday ? 'is-today-card' : 'is-upcoming-card'}`}
                  >
                    {/* Doctor & Chamber Header */}
                    <div className="qls-card-top">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="qls-doc-specialty">{item.doctor_specialty || 'বিশেষজ্ঞ'}</div>
                        <h4 className="qls-doc-name">{item.doctor_name}</h4>
                        <div className="qls-chamber-name">
                          <IconBuildingHospital size={14} />
                          <span>{item.chamber_name} {item.hospital_name ? `(${item.hospital_name})` : ''}</span>
                        </div>
                      </div>

                      {isToday ? (
                        <div className="qls-today-badge">
                          <span className="qls-pulse-dot" />
                          <span>আজকের সেশন</span>
                        </div>
                      ) : (
                        <div className="qls-upcoming-badge">
                          <IconCalendar size={13} />
                          <span>আসন্ন সিরিয়াল</span>
                        </div>
                      )}
                    </div>

                    {isToday ? (
                      /* ── CASE 1: TODAY'S APPOINTMENT (REAL-TIME QUEUE) ── */
                      <>
                        {/* Session Status / Starting Time Banner */}
                        <div className="qls-session-time-banner">
                          <IconClock size={14} className="qls-time-icon" />
                          <span>
                            {item.current_serving
                              ? `চেম্বার লাইভ চলছে • আপনার সিরিয়াল #${toBn(item.serial_number)}`
                              : startTimeStr
                                ? `চেম্বার শুরুর নির্ধারিত সময়: ${startTimeStr}`
                                : 'চেম্বার আজ নির্ধারিত সময়ে শুরু হবে'}
                          </span>
                        </div>

                        {/* 3-Box Live Serial Counters */}
                        <div className="qls-counters-row">
                          <div className="qls-counter-box qls-box-your">
                            <span className="qls-counter-label">আপনার সিরিয়াল</span>
                            <span className="qls-counter-value">#{toBn(item.serial_number) || '—'}</span>
                          </div>

                          <div className="qls-counter-box qls-box-serving">
                            <span className="qls-counter-label">বর্তমানে চলছে</span>
                            <span className="qls-counter-value">
                              {item.current_serving ? `#${toBn(item.current_serving)}` : 'শুরু হয়নি'}
                            </span>
                          </div>

                          <div className="qls-counter-box qls-box-ahead">
                            <span className="qls-counter-label">অপেক্ষমাণ রোগী</span>
                            <span className="qls-counter-value">
                              {item.patients_ahead !== null && item.patients_ahead !== undefined 
                                ? `${toBn(item.patients_ahead)} জন` 
                                : 'অপেক্ষমাণ'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="qls-card-actions">
                          {item.display_token ? (
                            <button
                              type="button"
                              className="qls-tv-btn"
                              onClick={() => {
                                onClose()
                                navigate(`/display/${item.display_token}`)
                              }}
                            >
                              <IconDeviceTv size={16} />
                              <span>চেম্বারের লাইভ ডিসপ্লে দেখুন</span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            className="qls-ticket-btn"
                            onClick={() => {
                              onClose()
                              navigate(`/appointment-ticket/${item.id}`)
                            }}
                          >
                            <IconReportMedical size={15} />
                            <span>ফুল টিকিট</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      /* ── CASE 2: UPCOMING APPOINTMENT ON FUTURE DATE ── */
                      <>
                        <div className="qls-upcoming-box">
                          <div className="qls-upcoming-grid">
                            <div className="qls-upcoming-field">
                              <span className="qls-field-label">
                                <IconCalendar size={13} />
                                তারিখ
                              </span>
                              <span className="qls-field-value qls-date-highlight">
                                {formatBanglaDate(item.appointment_date)}
                              </span>
                            </div>

                            <div className="qls-upcoming-field">
                              <span className="qls-field-label">
                                <IconClock size={13} />
                                নির্ধারিত সময়
                              </span>
                              <span className="qls-field-value">
                                {startTimeStr || 'শিডিউল অনুযায়ী'}
                              </span>
                            </div>
                          </div>

                          <div className="qls-upcoming-footer-row">
                            <div className="qls-upcoming-serial-pill">
                              <span>আপনার সিরিয়াল নম্বর:</span>
                              <strong>#{toBn(item.serial_number) || '—'}</strong>
                            </div>
                            {item.room_number ? (
                              <div className="qls-room-pill">
                                <span>রুম নং:</span>
                                <strong>{toBn(item.room_number)}</strong>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="qls-upcoming-hint">
                          <IconInfoCircle size={14} className="flex-shrink-0" />
                          <span>অ্যাপয়েন্টমেন্টের দিন এই নম্বরে লাইভ সিরিয়াল মনিটরিং চালু হবে।</span>
                        </div>

                        <div className="qls-card-actions">
                          <button
                            type="button"
                            className="qls-details-primary-btn"
                            onClick={() => {
                              onClose()
                              navigate(`/appointment-ticket/${item.id}`)
                            }}
                          >
                            <IconReportMedical size={16} />
                            <span>বিস্তারিত অ্যাপয়েন্টমেন্ট দেখুন</span>
                            <IconArrowRight size={15} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Helpline Note */}
        <div className="qls-modal-footer">
          <IconHeadset size={15} />
          <span>প্রয়োজনে সরাসরি সহায়তা পেতে কল করুন: <strong>09613868438</strong></span>
        </div>
      </div>

      <style>{`
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

        @keyframes qlsPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.75); }
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
          font-size: 14px;
          font-weight: 700;
          color: #0F172A;
          outline: none;
          background: #FFFFFF;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .qls-input::placeholder {
          font-size: 12.5px;
          font-weight: 500;
          color: #94A3B8;
          letter-spacing: 0;
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
          max-height: 420px;
        }

        /* ── Skeleton Shimmer Loader (Option 2) ── */
        .qls-shimmer-box {
          background: linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%);
          background-size: 200% 100%;
          animation: qlsShimmerAnim 1.4s infinite linear;
          border-radius: 6px;
        }

        @keyframes qlsShimmerAnim {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .qls-skeleton-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 4px;
          animation: qlsFadeIn 0.2s ease-out;
        }

        @keyframes qlsFadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .qls-skeleton-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        .qls-skeleton-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
          gap: 10px;
        }

        .qls-skeleton-counters {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }

        .qls-skeleton-actions {
          display: flex;
          gap: 8px;
        }

        .qls-skeleton-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 11.5px;
          color: #64748B;
          padding: 2px 0 6px 0;
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

        .qls-multi-count-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          padding: 6px 11px;
          border-radius: 8px;
          font-size: 12px;
          color: #334155;
          margin-bottom: 11px;
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
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .qls-appointment-card.is-today-card {
          border-color: #BAE6FD;
          background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%);
        }

        .qls-appointment-card.is-upcoming-card {
          border-color: #E2E8F0;
          background: #FFFFFF;
        }

        .qls-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
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
          flex-shrink: 0;
        }

        .qls-upcoming-badge {
          background: #FEF3C7;
          color: #B45309;
          font-size: 10.5px;
          font-weight: 700;
          padding: 2.5px 8px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          border: 1px solid #FDE68A;
          flex-shrink: 0;
        }

        .qls-session-time-banner {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #E0F2FE;
          border: 1px solid #BAE6FD;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 11.5px;
          font-weight: 700;
          color: #0369A1;
          margin-bottom: 10px;
        }

        .qls-time-icon {
          color: #0284C7;
          flex-shrink: 0;
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

        /* ── Upcoming Appointment Card Specifics ── */
        .qls-upcoming-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 9px;
        }

        .qls-upcoming-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 8px;
        }

        .qls-upcoming-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .qls-field-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 700;
          color: #64748B;
        }

        .qls-field-value {
          font-size: 12.5px;
          font-weight: 700;
          color: #1E293B;
          line-height: 1.35;
        }

        .qls-date-highlight {
          color: #0F172A;
        }

        .qls-upcoming-footer-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px dashed #E2E8F0;
        }

        .qls-upcoming-serial-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #EFF6FF;
          border: 1px solid #DBEAFE;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 11.5px;
          color: #1D4ED8;
        }

        .qls-upcoming-serial-pill strong {
          font-size: 12.5px;
          font-weight: 800;
        }

        .qls-room-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 11px;
          color: #475569;
        }

        .qls-upcoming-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #64748B;
          margin-bottom: 11px;
          line-height: 1.4;
        }

        .qls-details-primary-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 14px;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(2, 132, 199, 0.28);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .qls-details-primary-btn:hover {
          box-shadow: 0 5px 14px rgba(2, 132, 199, 0.38);
        }

        .qls-details-primary-btn:active {
          transform: scale(0.98);
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
    </div>,
    document.body
  )
}

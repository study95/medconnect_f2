import { useRef } from 'react'
import {
  IconCalendar,
  IconCalendarEvent,
  IconCalendarStats,
  IconCheck,
  IconX
} from '@tabler/icons-react'

const enToBn = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
}

const bnMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
]

const bnMonthsShort = [
  'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
]

const toBnNum = (str) => {
  if (str === null || str === undefined || str === '') return ''
  return String(str).replace(/\d/g, d => enToBn[d] || d)
}

const formatCustomDateBn = (dateStr) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  try {
    const [year, month, day] = dateStr.split('-')
    const monthIdx = parseInt(month, 10) - 1
    const monthName = bnMonths[monthIdx] || month
    const dayBn = toBnNum(parseInt(day, 10))
    return `${dayBn} ${monthName}`
  } catch {
    return dateStr
  }
}

/**
 * AvailabilityDateFilter Component (Polished)
 *
 * @param {string} value - Selected preset or YYYY-MM-DD date string ('today' | 'tomorrow' | 'next_7_days' | 'YYYY-MM-DD' | '')
 * @param {function} onChange - Callback receiving the new value or empty string if cleared
 */
export default function AvailabilityDateFilter({ value = '', onChange, inline = false }) {
  const dateInputRef = useRef(null)

  const isPreset = ['today', 'tomorrow', 'next_7_days'].includes(value)
  const isCustomDate = Boolean(value && !isPreset && /^\d{4}-\d{2}-\d{2}$/.test(value))

  const todayIso = new Date().toISOString().split('T')[0]

  const todayDateLabel = (() => {
    try {
      const d = new Date()
      const day = toBnNum(d.getDate())
      const month = bnMonthsShort[d.getMonth()] || bnMonths[d.getMonth()]
      return `${day} ${month}`
    } catch {
      return ''
    }
  })()

  const tomorrowDateLabel = (() => {
    try {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      const day = toBnNum(d.getDate())
      const month = bnMonthsShort[d.getMonth()] || bnMonths[d.getMonth()]
      return `${day} ${month}`
    } catch {
      return ''
    }
  })()

  const handlePillClick = (presetKey) => {
    if (value === presetKey) {
      onChange?.('')
    } else {
      onChange?.(presetKey)
    }
  }

  const handleCustomDateClick = () => {
    if (!dateInputRef.current) return
    try {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker()
      } else {
        dateInputRef.current.focus()
        dateInputRef.current.click()
      }
    } catch {
      // Safe fallback for older browsers or restricted iframe contexts
      try {
        dateInputRef.current.focus()
        dateInputRef.current.click()
      } catch {
        // graceful degrade
      }
    }
  }

  const handleDateInputChange = (e) => {
    const selectedDate = e.target.value
    if (selectedDate) {
      onChange?.(selectedDate)
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange?.('')
  }

  if (inline) {
    return (
      <div className="avail-date-inline-bar">
        <style>{`
          .avail-date-inline-bar {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 14px;
            padding: 6px 10px 6px 14px;
            box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
            flex-wrap: nowrap;
            max-width: 100%;
          }
          .avail-date-inline-label {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding-right: 10px;
            border-right: 1px solid #E2E8F0;
            white-space: nowrap;
            flex-shrink: 0;
          }
          .avail-date-inline-icon {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: #ECFDF5;
            border: 1px solid #A7F3D0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #00B875;
            flex-shrink: 0;
          }
          .avail-date-inline-chips {
            display: flex;
            align-items: center;
            gap: 7px;
            flex-wrap: nowrap;
          }
          .avail-date-inline-chip {
            height: 34px;
            padding: 0 13px;
            border-radius: 99px;
            font-size: 12.5px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            white-space: nowrap;
            flex-shrink: 0;
            font-family: 'Hind Siliguri', sans-serif;
            transition: all 0.18s ease;
            outline: none;
          }
          .avail-date-inline-chip:hover {
            border-color: #00B875 !important;
            background: #F0FDF4;
          }
          .avail-date-inline-chip.is-selected:hover {
            background: #059669 !important;
          }
        `}</style>

        {/* Left Label with Calendar Badge */}
        <div className="avail-date-inline-label">
          <span className="avail-date-inline-icon">
            <IconCalendar size={16} stroke={2.2} />
          </span>
          <span style={{
            fontSize: 13.5,
            fontWeight: 800,
            color: '#0F172A',
            fontFamily: "'Hind Siliguri', sans-serif"
          }}>
            কবে ডাক্তার দেখাতে চান?
          </span>
        </div>

        {/* Right 4 Single-Row Chips */}
        <div className="avail-date-inline-chips">
          {/* 1. আজ (Today) */}
          <button
            type="button"
            className={`avail-date-inline-chip ${value === 'today' ? 'is-selected' : ''}`}
            onClick={() => handlePillClick('today')}
            aria-pressed={value === 'today'}
            style={{
              border: value === 'today' ? '1.5px solid #00B875' : '1px solid #E2E8F0',
              background: value === 'today' ? '#00B875' : '#F8FAFC',
              color: value === 'today' ? '#FFFFFF' : '#334155',
              fontWeight: value === 'today' ? 800 : 600,
              boxShadow: value === 'today' ? '0 3px 10px rgba(0, 184, 117, 0.25)' : 'none'
            }}
          >
            {value === 'today' ? <IconCheck size={14} /> : <IconCalendarEvent size={14} color="#64748B" />}
            <span>আজ {todayDateLabel ? `(${todayDateLabel})` : ''}</span>
          </button>

          {/* 2. আগামীকাল (Tomorrow) */}
          <button
            type="button"
            className={`avail-date-inline-chip ${value === 'tomorrow' ? 'is-selected' : ''}`}
            onClick={() => handlePillClick('tomorrow')}
            aria-pressed={value === 'tomorrow'}
            style={{
              border: value === 'tomorrow' ? '1.5px solid #00B875' : '1px solid #E2E8F0',
              background: value === 'tomorrow' ? '#00B875' : '#F8FAFC',
              color: value === 'tomorrow' ? '#FFFFFF' : '#334155',
              fontWeight: value === 'tomorrow' ? 800 : 600,
              boxShadow: value === 'tomorrow' ? '0 3px 10px rgba(0, 184, 117, 0.25)' : 'none'
            }}
          >
            {value === 'tomorrow' ? <IconCheck size={14} /> : <IconCalendarStats size={14} color="#64748B" />}
            <span>আগামীকাল {tomorrowDateLabel ? `(${tomorrowDateLabel})` : ''}</span>
          </button>

          {/* 3. পরবর্তী ৭ দিন (Next 7 Days) */}
          <button
            type="button"
            className={`avail-date-inline-chip ${value === 'next_7_days' ? 'is-selected' : ''}`}
            onClick={() => handlePillClick('next_7_days')}
            aria-pressed={value === 'next_7_days'}
            style={{
              border: value === 'next_7_days' ? '1.5px solid #00B875' : '1px solid #E2E8F0',
              background: value === 'next_7_days' ? '#00B875' : '#F8FAFC',
              color: value === 'next_7_days' ? '#FFFFFF' : '#334155',
              fontWeight: value === 'next_7_days' ? 800 : 600,
              boxShadow: value === 'next_7_days' ? '0 3px 10px rgba(0, 184, 117, 0.25)' : 'none'
            }}
          >
            {value === 'next_7_days' ? <IconCheck size={14} /> : <IconCalendar size={14} color="#64748B" />}
            <span>পরবর্তী ৭ দিন</span>
          </button>

          {/* 4. তারিখ দিন (Custom Date Picker) */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              className={`avail-date-inline-chip ${isCustomDate ? 'is-selected' : ''}`}
              onClick={handleCustomDateClick}
              aria-pressed={isCustomDate}
              style={{
                border: isCustomDate ? '1.5px solid #00B875' : '1px solid #E2E8F0',
                background: isCustomDate ? '#00B875' : '#F8FAFC',
                color: isCustomDate ? '#FFFFFF' : '#334155',
                fontWeight: isCustomDate ? 800 : 600,
                boxShadow: isCustomDate ? '0 3px 10px rgba(0, 184, 117, 0.25)' : 'none'
              }}
            >
              {isCustomDate ? <IconCheck size={14} /> : <IconCalendarEvent size={14} color="#00B875" />}
              <span>{isCustomDate ? formatCustomDateBn(value) : 'তারিখ দিন'}</span>
            </button>

            <input
              ref={dateInputRef}
              type="date"
              min={todayIso}
              value={isCustomDate ? value : ''}
              onChange={handleDateInputChange}
              aria-label="তারিখ নির্বাচন ক্যালেন্ডার"
              tabIndex={-1}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                pointerEvents: 'none',
                visibility: 'hidden'
              }}
            />
          </div>

          {/* Inline Reset Button when a date is selected */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              title="তারিখ ফিল্টার রিসেট করুন"
              style={{
                height: 30,
                padding: '0 9px',
                borderRadius: 99,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#EF4444',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontFamily: "'Hind Siliguri', sans-serif",
                flexShrink: 0
              }}
            >
              <span>রিসেট</span>
              <IconX size={12} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="avail-date-container">
      {/* ── Scoped Responsive Styles for Single Row Horizontal Scroll & Desktop Card ── */}
      <style>{`
        .avail-date-container {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
        }
        @media (max-width: 767px) {
          .avail-date-container {
            background: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin-bottom: 16px !important;
            box-shadow: none !important;
          }
        }
        .avail-date-scroll-row {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          flex-wrap: nowrap !important;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
        }
        .avail-date-scroll-row::-webkit-scrollbar {
          display: none;
        }
        .avail-date-chip {
          height: 38px;
          padding: 0 14px;
          border-radius: 20px;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: 'Hind Siliguri', sans-serif;
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }
        .avail-date-chip:focus-visible {
          box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #00B875 !important;
        }
        @media (max-width: 767px) {
          .avail-date-chip {
            height: 38px !important;
            padding: 0 14px !important;
            font-size: 13px !important;
          }
        }
      `}</style>

      {/* ── Heading Row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          gap: 6
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconCalendar size={17} color="#00B875" />
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 800,
              color: '#0F172A',
              fontFamily: "'Hind Siliguri', sans-serif",
              letterSpacing: '-0.2px'
            }}
          >
            কবে ডাক্তার দেখাতে চান?
          </span>
        </div>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="তারিখ ফিল্টার রিসেট করুন"
            style={{
              background: 'none',
              border: 'none',
              color: '#EF4444',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontFamily: "'Hind Siliguri', sans-serif",
              padding: '2px 6px',
              borderRadius: 4
            }}
          >
            <span>রিসেট</span>
            <IconX size={13} />
          </button>
        )}
      </div>

      {/* ── Single Row Horizontal Scroll Chips Strip ── */}
      <div className="avail-date-scroll-row">
        {/* 1. আজ (Today) */}
        <button
          type="button"
          className="avail-date-chip"
          onClick={() => handlePillClick('today')}
          aria-pressed={value === 'today'}
          style={{
            border: value === 'today' ? '1.5px solid #00B875' : '1px solid #E2E8F0',
            background: value === 'today' ? '#00B875' : '#FFFFFF',
            color: value === 'today' ? '#FFFFFF' : '#334155',
            fontWeight: value === 'today' ? 800 : 600,
            boxShadow: value === 'today' ? '0 3px 10px rgba(0, 184, 117, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)'
          }}
        >
          {value === 'today' ? <IconCheck size={15} /> : <IconCalendarEvent size={15} color="#64748B" />}
          <span>আজ {todayDateLabel ? `(${todayDateLabel})` : ''}</span>
        </button>

        {/* 2. আগামীকাল (Tomorrow) */}
        <button
          type="button"
          className="avail-date-chip"
          onClick={() => handlePillClick('tomorrow')}
          aria-pressed={value === 'tomorrow'}
          style={{
            border: value === 'tomorrow' ? '1.5px solid #00B875' : '1px solid #E2E8F0',
            background: value === 'tomorrow' ? '#00B875' : '#FFFFFF',
            color: value === 'tomorrow' ? '#FFFFFF' : '#334155',
            fontWeight: value === 'tomorrow' ? 800 : 600,
            boxShadow: value === 'tomorrow' ? '0 3px 10px rgba(0, 184, 117, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)'
          }}
        >
          {value === 'tomorrow' ? <IconCheck size={15} /> : <IconCalendarStats size={15} color="#64748B" />}
          <span>আগামীকাল {tomorrowDateLabel ? `(${tomorrowDateLabel})` : ''}</span>
        </button>

        {/* 3. পরবর্তী ৭ দিন (Next 7 Days) */}
        <button
          type="button"
          className="avail-date-chip"
          onClick={() => handlePillClick('next_7_days')}
          aria-pressed={value === 'next_7_days'}
          style={{
            border: value === 'next_7_days' ? '1.5px solid #00B875' : '1px solid #E2E8F0',
            background: value === 'next_7_days' ? '#00B875' : '#FFFFFF',
            color: value === 'next_7_days' ? '#FFFFFF' : '#334155',
            fontWeight: value === 'next_7_days' ? 800 : 600,
            boxShadow: value === 'next_7_days' ? '0 3px 10px rgba(0, 184, 117, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)'
          }}
        >
          {value === 'next_7_days' ? <IconCheck size={15} /> : <IconCalendar size={15} color="#64748B" />}
          <span>পরবর্তী ৭ দিন</span>
        </button>

        {/* 4. তারিখ দিন (Custom Date Picker) */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            type="button"
            className="avail-date-chip"
            onClick={handleCustomDateClick}
            aria-pressed={isCustomDate}
            aria-label={isCustomDate ? `নির্বাচিত তারিখ: ${formatCustomDateBn(value)}` : 'নির্দিষ্ট তারিখ নির্বাচন করুন'}
            style={{
              border: isCustomDate ? '1.5px solid #00B875' : '1px solid #E2E8F0',
              background: isCustomDate ? '#00B875' : '#FFFFFF',
              color: isCustomDate ? '#FFFFFF' : '#334155',
              fontWeight: isCustomDate ? 800 : 600,
              boxShadow: isCustomDate ? '0 3px 10px rgba(0, 184, 117, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)'
            }}
          >
            {isCustomDate ? <IconCheck size={15} /> : <IconCalendarEvent size={15} color="#00B875" />}
            <span>{isCustomDate ? formatCustomDateBn(value) : 'তারিখ দিন'}</span>
          </button>

          {/* Native HTML5 date input with safe fallbacks and accessibility */}
          <input
            ref={dateInputRef}
            type="date"
            min={todayIso}
            value={isCustomDate ? value : ''}
            onChange={handleDateInputChange}
            aria-label="তারিখ নির্বাচন ক্যালেন্ডার"
            tabIndex={-1}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              pointerEvents: 'none',
              visibility: 'hidden'
            }}
          />
        </div>
      </div>
    </div>
  )
}

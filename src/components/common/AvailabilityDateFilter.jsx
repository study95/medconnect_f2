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
export default function AvailabilityDateFilter({ value = '', onChange }) {
  const dateInputRef = useRef(null)

  const isPreset = ['today', 'tomorrow', 'next_7_days'].includes(value)
  const isCustomDate = Boolean(value && !isPreset && /^\d{4}-\d{2}-\d{2}$/.test(value))

  const todayIso = new Date().toISOString().split('T')[0]

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

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        padding: '12px 16px',
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* ── Scoped Responsive Styles for Mobile Ergonomics ── */}
      <style>{`
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
            height: 42px !important;
            padding: 0 16px !important;
            font-size: 13.5px !important;
          }
        }
      `}</style>

      {/* ── Heading Row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          flexWrap: 'wrap',
          gap: 6
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconCalendar size={18} color="#00B875" />
          <span
            style={{
              fontSize: 14.5,
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
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontFamily: "'Hind Siliguri', sans-serif",
              padding: 0
            }}
          >
            <span>রিসেট করুন</span>
            <IconX size={13} />
          </button>
        )}
      </div>

      {/* ── Option Chips Strip ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap'
        }}
      >
        {/* 1. আজ (Today) */}
        <button
          type="button"
          className="avail-date-chip"
          onClick={() => handlePillClick('today')}
          aria-pressed={value === 'today'}
          style={{
            border: value === 'today' ? '1.5px solid #00B875' : '1px solid #CBD5E1',
            background: value === 'today' ? '#00B875' : '#F8FAFC',
            color: value === 'today' ? '#FFFFFF' : '#334155',
            fontWeight: value === 'today' ? 800 : 600,
            boxShadow: value === 'today' ? '0 3px 10px rgba(0, 184, 117, 0.25)' : 'none'
          }}
        >
          {value === 'today' ? <IconCheck size={15} /> : <IconCalendarEvent size={15} color="#64748B" />}
          <span>আজ</span>
        </button>

        {/* 2. আগামীকাল (Tomorrow) */}
        <button
          type="button"
          className="avail-date-chip"
          onClick={() => handlePillClick('tomorrow')}
          aria-pressed={value === 'tomorrow'}
          style={{
            border: value === 'tomorrow' ? '1.5px solid #00B875' : '1px solid #CBD5E1',
            background: value === 'tomorrow' ? '#00B875' : '#F8FAFC',
            color: value === 'tomorrow' ? '#FFFFFF' : '#334155',
            fontWeight: value === 'tomorrow' ? 800 : 600,
            boxShadow: value === 'tomorrow' ? '0 3px 10px rgba(0, 184, 117, 0.25)' : 'none'
          }}
        >
          {value === 'tomorrow' ? <IconCheck size={15} /> : <IconCalendarStats size={15} color="#64748B" />}
          <span>আগামীকাল</span>
        </button>

        {/* 3. পরবর্তী ৭ দিন (Next 7 Days) */}
        <button
          type="button"
          className="avail-date-chip"
          onClick={() => handlePillClick('next_7_days')}
          aria-pressed={value === 'next_7_days'}
          style={{
            border: value === 'next_7_days' ? '1.5px solid #00B875' : '1px solid #CBD5E1',
            background: value === 'next_7_days' ? '#00B875' : '#F8FAFC',
            color: value === 'next_7_days' ? '#FFFFFF' : '#334155',
            fontWeight: value === 'next_7_days' ? 800 : 600,
            boxShadow: value === 'next_7_days' ? '0 3px 10px rgba(0, 184, 117, 0.25)' : 'none'
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
              border: isCustomDate ? '1.5px solid #00B875' : '1px solid #CBD5E1',
              background: isCustomDate ? '#00B875' : '#F8FAFC',
              color: isCustomDate ? '#FFFFFF' : '#334155',
              fontWeight: isCustomDate ? 800 : 600,
              boxShadow: isCustomDate ? '0 3px 10px rgba(0, 184, 117, 0.25)' : 'none'
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

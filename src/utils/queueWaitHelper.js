// src/utils/queueWaitHelper.js

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
export const toBn = (str) => (str !== null && str !== undefined ? String(str).replace(/\d/g, (d) => enToBn[d] || d) : '—')

/**
 * Format a Date object to 12-hour Bangla time string.
 * Example: 17:45 -> "বিকেল ৫:৪৫"
 */
export const formatTimeFromDate = (dateObj) => {
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return null

  let hours = dateObj.getHours()
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')

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

/**
 * Parse any time string into a Date object on today's local date.
 * Supports: "17:00:00", "17:40", "05:40 PM", "5:00 pm"
 */
export const parseTimeToTodayDate = (timeStr) => {
  if (!timeStr) return null
  const cleaned = String(timeStr).trim()
  if (!cleaned || cleaned === 'null' || cleaned === 'undefined') return null

  const m = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?$/i)
  if (!m) return null

  let hours = parseInt(m[1], 10)
  const minutes = parseInt(m[2], 10)
  const meridiem = (m[3] || '').toUpperCase()

  if (meridiem === 'PM' && hours < 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0

  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d
}

/**
 * Calculate remaining break minutes from breakResumeTime string.
 */
export const calculateRemainingBreakMinutes = (breakResumeTime) => {
  if (!breakResumeTime) return 10
  const target = parseTimeToTodayDate(breakResumeTime)
  if (!target) return 10

  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  const diffMins = Math.round(diffMs / (60 * 1000))
  return Math.max(1, diffMins)
}

/**
 * Calculate dynamic estimated wait time and time window considering chamber status.
 *
 * @param {Object} params
 * @param {number} params.patientsAhead - Patients ahead
 * @param {number} params.slotDurationMinutes - Nominal consultation duration (default 10)
 * @param {boolean} params.isOnBreak - Doctor break status
 * @param {string} params.breakResumeTime - Break resume time string
 * @param {boolean} params.isServingNow - Currently serving this patient
 * @param {boolean} params.isNextInLine - Immediately next
 * @param {number|null} params.currentServing - Current serving serial number (null if not started)
 * @param {string} params.bookingTimeRaw - Raw booking time (e.g. "17:40:00")
 * @param {string} params.chamberStartTimeRaw - Chamber start time (e.g. "17:00:00")
 * @returns {Object}
 */
export const calculateDynamicWaitTime = ({
  patientsAhead = 0,
  slotDurationMinutes = 10,
  isOnBreak = false,
  breakResumeTime = null,
  isServingNow = false,
  isNextInLine = false,
  isNoShow = false,
  currentServing = null,
  bookingTimeRaw = null,
  chamberStartTimeRaw = null,
}) => {
  if (isNoShow) {
    return {
      isChamberActive: Boolean(currentServing !== null && Number(currentServing) > 0),
      waitRangeText: 'অনুপস্থিত চিহ্নিত',
      estTimeWindowText: 'সিরিয়াল স্থগিত রয়েছে',
      highWaitMinutes: 0,
      highWaitText: 'অনুপস্থিত',
      isImmediate: false,
      remainingBreakMinutes: 0,
      badgeType: 'no_show',
      statusNotice: 'আপনার সিরিয়াল ডাকা হয়েছিল, কিন্তু সময়মতো উপস্থিত না থাকায় ডাক্তার আপনাকে অনুপস্থিত করেছেন। অনুগ্রহ করে রিসেপশনে যোগাযোগ করুন।',
    }
  }

  const slotMinutes = Math.max(5, Number(slotDurationMinutes) || 10)
  const isChamberActive = currentServing !== null && Number(currentServing) > 0

  // -------------------------------------------------------------
  // PHASE 1: Chamber has NOT started serving yet
  // -------------------------------------------------------------
  if (!isChamberActive) {
    const bookedDate = parseTimeToTodayDate(bookingTimeRaw)
    const chamberStartDate = parseTimeToTodayDate(chamberStartTimeRaw)
    const now = new Date()

    let estWindow = ''
    if (bookedDate) {
      const bookedEndDate = new Date(bookedDate.getTime() + slotMinutes * 60 * 1000)
      estWindow = `${formatTimeFromDate(bookedDate)} – ${formatTimeFromDate(bookedEndDate)}`
    }

    const isBeforeChamber = chamberStartDate && now.getTime() < chamberStartDate.getTime()

    let diffText = 'চেম্বার শুরুর অপেক্ষায়'
    if (isBeforeChamber) {
      const minsUntilChamber = Math.round((chamberStartDate.getTime() - now.getTime()) / (60 * 1000))
      if (minsUntilChamber > 60) {
        const hrs = Math.floor(minsUntilChamber / 60)
        const mins = minsUntilChamber % 60
        diffText = mins > 0 ? `${toBn(hrs)} ঘণ্টা ${toBn(mins)} মিনিট পর শুরু` : `${toBn(hrs)} ঘণ্টা পর শুরু`
      } else {
        diffText = `${toBn(minsUntilChamber)} মিনিট পর শুরু`
      }
    } else {
      diffText = 'খুব শীঘ্রই শুরু হবে'
    }

    let preWaitMinutes = 0
    let preWaitDisplay = 'খুব শীঘ্রই'

    if (bookedDate && bookedDate.getTime() > now.getTime()) {
      preWaitMinutes = Math.round((bookedDate.getTime() - now.getTime()) / (60 * 1000))
    } else if (chamberStartDate && chamberStartDate.getTime() > now.getTime()) {
      preWaitMinutes = Math.round((chamberStartDate.getTime() - now.getTime()) / (60 * 1000))
    }

    if (preWaitMinutes > 60) {
      const hrs = Math.floor(preWaitMinutes / 60)
      const mins = preWaitMinutes % 60
      preWaitDisplay = mins > 0 ? `~${toBn(hrs)} ঘণ্টা ${toBn(mins)} মি.` : `~${toBn(hrs)} ঘণ্টা`
    } else if (preWaitMinutes > 0) {
      preWaitDisplay = `~${toBn(preWaitMinutes)} মিনিট`
    }

    return {
      isChamberActive: false,
      waitRangeText: diffText,
      estTimeWindowText: estWindow || (bookedDate ? formatTimeFromDate(bookedDate) : 'নির্ধারিত শিডিউল অনুযায়ী'),
      highWaitMinutes: preWaitMinutes,
      highWaitText: preWaitDisplay,
      isImmediate: false,
      remainingBreakMinutes: 0,
      badgeType: 'waiting_start',
      statusNotice: chamberStartDate
        ? `আজ ${formatTimeFromDate(chamberStartDate)} টায় চেম্বার শুরু হবে। ডাক্তার রোগী ডাকা শুরু করলে লাইভ কাউন্টিং চালু হবে।`
        : 'ডাক্তার চেম্বারে রোগী ডাকা শুরু করলে লাইভ কাউন্টিং চালু হবে।',
    }
  }

  // -------------------------------------------------------------
  // PHASE 2: Chamber is ACTIVE & LIVE
  // -------------------------------------------------------------
  const remainingBreak = isOnBreak ? calculateRemainingBreakMinutes(breakResumeTime) : 0

  if (isServingNow) {
    return {
      isChamberActive: true,
      waitRangeText: 'এখন আপনার পালা',
      estTimeWindowText: 'রুমে প্রবেশ করুন',
      highWaitMinutes: 0,
      highWaitText: 'এখনই ডাকছে',
      isImmediate: true,
      remainingBreakMinutes: 0,
      badgeType: 'serving',
      statusNotice: 'আপনার সিরিয়াল নম্বর চেম্বারে ডাকা হয়েছে।',
    }
  }

  if (isNextInLine || patientsAhead === 0) {
    const minMins = isOnBreak ? remainingBreak : 2
    const maxMins = isOnBreak ? remainingBreak + slotMinutes : Math.max(5, slotMinutes)

    const now = new Date()
    const estStart = new Date(now.getTime() + minMins * 60 * 1000)
    const estEnd = new Date(now.getTime() + maxMins * 60 * 1000)

    return {
      isChamberActive: true,
      waitRangeText: `${toBn(minMins)} – ${toBn(maxMins)} মিনিট`,
      estTimeWindowText: `${formatTimeFromDate(estStart)} – ${formatTimeFromDate(estEnd)}`,
      highWaitMinutes: maxMins,
      highWaitText: `~${toBn(maxMins)} মিনিট`,
      isImmediate: true,
      remainingBreakMinutes: remainingBreak,
      badgeType: 'next',
      statusNotice: 'পরবর্তী সিরিয়াল আপনার। চেম্বারের সামনে প্রস্তুত থাকুন।',
    }
  }

  // Patients ahead >= 1
  const baseMinutes = patientsAhead * slotMinutes
  let minWait = Math.max(5, Math.round(baseMinutes * 0.85))
  let maxWait = Math.max(minWait + 4, Math.round(baseMinutes * 1.0))

  if (isOnBreak) {
    minWait += remainingBreak
    maxWait += remainingBreak
  }

  const now = new Date()
  const estStart = new Date(now.getTime() + minWait * 60 * 1000)
  const estEnd = new Date(now.getTime() + maxWait * 60 * 1000)

  let activeHighWaitDisplay = `~${toBn(maxWait)} মিনিট`
  if (maxWait > 60) {
    const hrs = Math.floor(maxWait / 60)
    const mins = maxWait % 60
    activeHighWaitDisplay = mins > 0 ? `~${toBn(hrs)} ঘণ্টা ${toBn(mins)} মি.` : `~${toBn(hrs)} ঘণ্টা`
  }

  return {
    isChamberActive: true,
    waitRangeText: `${toBn(minWait)} – ${toBn(maxWait)} মিনিট`,
    estTimeWindowText: `${formatTimeFromDate(estStart)} – ${formatTimeFromDate(estEnd)}`,
    highWaitMinutes: maxWait,
    highWaitText: activeHighWaitDisplay,
    isImmediate: false,
    remainingBreakMinutes: remainingBreak,
    badgeType: isOnBreak ? 'break' : 'normal',
    statusNotice: null,
  }
}

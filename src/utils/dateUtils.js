// dateUtils.js — Age calculation utility
// Used in registration forms to display real-time age from date of birth

/**
 * Calculate age from a date of birth string
 * @param {string} dob - Date of birth in YYYY-MM-DD format
 * @returns {{ years: number, months: number, days: number, display: string }}
 */
export function calculateAge(dob) {
  if (!dob) return { years: 0, months: 0, days: 0, display: '' }

  const birthDate = new Date(dob)
  const today = new Date()

  if (isNaN(birthDate.getTime()) || birthDate > today) {
    return { years: 0, months: 0, days: 0, display: '' }
  }

  let years = today.getFullYear() - birthDate.getFullYear()
  let months = today.getMonth() - birthDate.getMonth()
  let days = today.getDate() - birthDate.getDate()

  if (days < 0) {
    months--
    // Get the number of days in the previous month
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += prevMonth.getDate()
  }

  if (months < 0) {
    years--
    months += 12
  }

  const parts = []
  if (years > 0) parts.push(`${years} Year${years !== 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} Month${months !== 1 ? 's' : ''}`)
  if (days > 0) parts.push(`${days} Day${days !== 1 ? 's' : ''}`)

  return {
    years,
    months,
    days,
    display: parts.length > 0 ? parts.join(' ') : '0 Days'
  }
}

/**
 * Blood group options for dropdown
 */
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

/**
 * Gender options for dropdown
 */
export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

/**
 * Always format any Date into Bangladesh Standard Time (Asia/Dhaka) YYYY-MM-DD
 * Prevents UTC midnight boundary bugs across all browsers and devices.
 */
export function getBangladeshDateStr(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    return formatter.format(date)
  } catch {
    // Safe fallback if Intl is not supported
    const offsetMs = 6 * 60 * 60 * 1000 // UTC+6
    const bdDate = new Date(date.getTime() + offsetMs)
    return bdDate.toISOString().split('T')[0]
  }
}

/**
 * Get Today's date in Bangladesh timezone (YYYY-MM-DD)
 */
export function getBangladeshTodayStr() {
  return getBangladeshDateStr(new Date())
}

/**
 * Get Tomorrow's date in Bangladesh timezone (YYYY-MM-DD)
 */
export function getBangladeshTomorrowStr() {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return getBangladeshDateStr(tomorrow)
}

/**
 * Get Day Name in English (Sunday..Saturday) from a YYYY-MM-DD date string
 * Safely sets hours to 12 (noon) to prevent timezone day-shift
 */
export function getDayNameFromDateStr(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d, 12, 0, 0)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dateObj.getDay()] || ''
}

/**
 * Convert Day Name in English to Bengali
 */
export const dayNameToBn = {
  'Saturday': 'শনিবার',
  'Sunday': 'রবিবার',
  'Monday': 'সোমবার',
  'Tuesday': 'মঙ্গলবার',
  'Wednesday': 'বুধবার',
  'Thursday': 'বৃহস্পতিবার',
  'Friday': 'শুক্রবার'
}

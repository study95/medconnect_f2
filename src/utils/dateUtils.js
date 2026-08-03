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

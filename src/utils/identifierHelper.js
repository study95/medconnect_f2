/**
 * Identifier & SEO URL Helpers for MedConnect Enterprise
 */

/**
 * Extracts 26-character Crockford ULID from any string (raw ULID or {slug}-{ULID})
 */
export function extractUlid(value) {
  if (!value || typeof value !== 'string') return null
  const match = value.match(/[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}/i)
  return match ? match[0].toUpperCase() : null
}

/**
 * Generates canonical SEO URL for a doctor: /doctors/{district_slug}/{upazila_slug}/{slug}
 */
export function getDoctorUrl(doctor) {
  if (!doctor) return '/doctors'
  if (typeof doctor === 'string') {
    if (doctor.startsWith('/doctors/')) return doctor
    return `/doctors/${doctor}`
  }
  const districtSlug = doctor.district_slug || doctor.district?.slug || 'bangladesh'
  const upazilaSlug = doctor.upazila_slug || doctor.upazila?.slug || 'general'
  const slug = doctor.slug || doctor.seo_slug || doctor.id
  return `/doctors/${districtSlug}/${upazilaSlug}/${slug}`
}

/**
 * Generates canonical SEO URL for a hospital
 */
export function getHospitalUrl(hospital) {
  if (!hospital) return '/hospitals'
  if (typeof hospital === 'string' || typeof hospital === 'number') {
    return `/hospitals/${hospital}`
  }
  const slug = hospital.seo_slug || hospital.slug || hospital.id
  return `/hospitals/${slug}`
}

/**
 * Generates canonical booking URL for a doctor
 */
export function getBookingUrl(doctor) {
  if (!doctor) return '/book-appointment'
  if (typeof doctor === 'string' || typeof doctor === 'number') {
    return `/book-appointment/${doctor}`
  }
  const slug = doctor.seo_slug || doctor.id
  return `/book-appointment/${slug}`
}

/**
 * Identifier & SEO URL Helpers for MedConnect Enterprise
 * Single source of truth for frontend SEO URL generation across all modules.
 */

/**
 * Checks if value is a valid Public ID format (e.g. PT-8K4X2M, DR-Q7P9LW, HP-M6R2TX)
 */
export function isPublicId(value) {
  if (!value || typeof value !== 'string') return false
  return /^[A-Z]{2,4}-[ABCDEFGHJKMNPQRSTVWXYZ23456789]{6}$/i.test(value.trim())
}

/**
 * Extracts Public ID or 26-character legacy Crockford ULID from any string
 */
export function extractPublicId(value) {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  const publicIdMatch = trimmed.match(/[A-Z]{2,4}-[ABCDEFGHJKMNPQRSTVWXYZ23456789]{6}/i)
  if (publicIdMatch) return publicIdMatch[0].toUpperCase()
  return extractUlid(value)
}

/**
 * Extracts 26-character Crockford ULID from any string (legacy fallback)
 */
export function extractUlid(value) {
  if (!value || typeof value !== 'string') return null
  const match = value.match(/[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}/i)
  return match ? match[0].toUpperCase() : null
}

/**
 * Generic hierarchical location-based SEO URL builder:
 * /{resource}/{district_slug}/{upazila_slug}/{slug}
 * Supports Doctors, Hospitals, and future location-scoped entities.
 */
export function buildLocationSeoUrl(resource, item, defaultDistrict = 'bangladesh', defaultUpazila = 'general') {
  if (!item) return `/${resource}`
  if (typeof item === 'string') {
    if (item.startsWith(`/${resource}/`)) return item
    return `/${resource}/${item}`
  }
  // Prioritize existing canonical_url property if available
  if (item.canonical_url && typeof item.canonical_url === 'string' && item.canonical_url.startsWith(`/${resource}/`)) {
    return item.canonical_url
  }
  const districtSlug = item.district_slug || item.district?.slug || defaultDistrict
  const upazilaSlug = item.upazila_slug || item.upazila?.slug || defaultUpazila
  const slug = item.slug || item.seo_slug || item.id
  return `/${resource}/${districtSlug}/${upazilaSlug}/${slug}`
}

/**
 * Generic standard SEO URL builder:
 * /{resource}/{slug}
 * Supports Specialties, Articles, Services, and future non-location scoped entities.
 */
export function buildStandardSeoUrl(resource, item) {
  if (!item) return `/${resource}`
  if (typeof item === 'string') {
    if (item.startsWith(`/${resource}/`)) return item
    return `/${resource}/${item}`
  }
  // Prioritize existing canonical_url property if available
  if (item.canonical_url && typeof item.canonical_url === 'string' && item.canonical_url.startsWith(`/${resource}/`)) {
    return item.canonical_url
  }
  const slug = item.slug || item.seo_slug || item.id
  return `/${resource}/${slug}`
}

/**
 * Generates canonical SEO URL for a doctor: /doctors/{district_slug}/{upazila_slug}/{slug}
 */
export function getDoctorUrl(doctor) {
  return buildLocationSeoUrl('doctors', doctor)
}

/**
 * Generates canonical SEO URL for a hospital: /hospitals/{district_slug}/{upazila_slug}/{slug}
 */
export function getHospitalUrl(hospital) {
  return buildLocationSeoUrl('hospitals', hospital)
}

/**
 * Generates canonical SEO URL for a specialty: /specialties/{slug}
 */
export function getSpecialtyUrl(specialty) {
  return buildStandardSeoUrl('specialties', specialty)
}

/**
 * Generates canonical SEO URL for an article: /articles/{slug}
 */
export function getArticleUrl(article) {
  return buildStandardSeoUrl('articles', article)
}

/**
 * Generates canonical booking URL for a doctor
 */
export function getBookingUrl(doctor, chamberId = null) {
  if (!doctor) return '/book-appointment'
  let basePath = '/book-appointment'
  if (typeof doctor === 'string' || typeof doctor === 'number') {
    basePath = `/book-appointment/${doctor}`
  } else {
    const slug = doctor.slug || doctor.seo_slug || doctor.public_id || doctor.id
    basePath = `/book-appointment/${slug}`
  }
  if (chamberId !== null && chamberId !== undefined && chamberId !== '') {
    basePath += `?chamberId=${chamberId}`
  }
  return basePath
}

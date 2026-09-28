/**
 * Geolocation & Distance Calculation Utilities
 * High-performance, defensive utilities for distance calculation, formatting, and navigation links.
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371

// Bengali digit map for conversion
const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

/**
 * Convert number or string digits to Bengali numerals
 */
export function toBengaliNumerals(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[digit] || digit)
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Validate latitude and longitude values
 */
export function isValidCoordinate(latitude, longitude) {
  if (latitude === null || latitude === undefined || latitude === '') return false
  if (longitude === null || longitude === undefined || longitude === '') return false

  const lat = typeof latitude === 'string' ? parseFloat(latitude.trim()) : Number(latitude)
  const lng = typeof longitude === 'string' ? parseFloat(longitude.trim()) : Number(longitude)

  if (Number.isNaN(lat) || Number.isNaN(lng)) return false
  if (lat < -90 || lat > 90) return false
  if (lng < -180 || lng > 180) return false

  // Discard 0.000000, 0.000000 (often default empty placeholder)
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false

  return true
}

/**
 * Calculate Great-Circle distance between two coordinates using the Haversine formula
 * @param {number|string} lat1 - Starting latitude
 * @param {number|string} lon1 - Starting longitude
 * @param {number|string} lat2 - Target latitude
 * @param {number|string} lon2 - Target longitude
 * @returns {number|null} Distance in kilometers, or null if coordinates are invalid
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return null
  }

  const pLat1 = typeof lat1 === 'string' ? parseFloat(lat1) : Number(lat1)
  const pLon1 = typeof lon1 === 'string' ? parseFloat(lon1) : Number(lon1)
  const pLat2 = typeof lat2 === 'string' ? parseFloat(lat2) : Number(lat2)
  const pLon2 = typeof lon2 === 'string' ? parseFloat(lon2) : Number(lon2)

  const dLat = toRadians(pLat2 - pLat1)
  const dLon = toRadians(pLon2 - pLon1)

  const rLat1 = toRadians(pLat1)
  const rLat2 = toRadians(pLat2)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = EARTH_RADIUS_KM * c

  return Number.isNaN(distance) ? null : distance
}

/**
 * Format distance in a human-friendly localized representation
 * @param {number|null} distanceKm - Distance in kilometers
 * @param {Object} options - formatting options
 * @param {'bn'|'en'} options.locale - Language ('bn' or 'en')
 * @param {boolean} options.includeStraightLineNote - Whether to include '(সরল দূরত্ব)'
 * @returns {string} Formatted distance string (e.g. "২.৪ কিমি" or "৪৫০ মি.")
 */
export function formatDistance(distanceKm, options = {}) {
  const { locale = 'bn', includeStraightLineNote = false } = options

  if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm) || distanceKm < 0) {
    return ''
  }

  let formatted = ''

  if (distanceKm < 1) {
    // Under 1 km, show in meters rounded to nearest 50m
    const meters = Math.max(50, Math.round((distanceKm * 1000) / 50) * 50)
    if (locale === 'bn') {
      formatted = `${toBengaliNumerals(meters)} মিটার`
    } else {
      formatted = `${meters} m`
    }
  } else {
    // 1 km and above, show with 1 decimal place (e.g. 2.4 km)
    const kmStr = distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm).toString()
    if (locale === 'bn') {
      formatted = `${toBengaliNumerals(kmStr)} কিমি`
    } else {
      formatted = `${kmStr} km`
    }
  }

  if (includeStraightLineNote) {
    formatted += locale === 'bn' ? ' (সরল দূরত্ব)' : ' (direct)'
  }

  return formatted
}

/**
 * Generate a Google Maps directions URL
 * @param {number|string} destLat
 * @param {number|string} destLng
 * @param {string} fallbackAddress
 * @param {number|string|null} originLat
 * @param {number|string|null} originLng
 */
export function getGoogleMapsDirectionsUrl(destLat, destLng, fallbackAddress = '', originLat = null, originLng = null) {
  if (isValidCoordinate(destLat, destLng)) {
    const pDestLat = typeof destLat === 'string' ? parseFloat(destLat) : destLat
    const pDestLng = typeof destLng === 'string' ? parseFloat(destLng) : destLng

    if (isValidCoordinate(originLat, originLng)) {
      const pOrigLat = typeof originLat === 'string' ? parseFloat(originLat) : originLat
      const pOrigLng = typeof originLng === 'string' ? parseFloat(originLng) : originLng
      return `https://www.google.com/maps/dir/?api=1&origin=${pOrigLat},${pOrigLng}&destination=${pDestLat},${pDestLng}`
    }

    return `https://www.google.com/maps/dir/?api=1&destination=${pDestLat},${pDestLng}`
  }

  // Fallback to address search
  const query = encodeURIComponent(fallbackAddress || 'Hospital')
  return `https://maps.google.com/?q=${query}`
}

/**
 * Find the nearest chamber for a doctor among multiple chambers
 * Robust signature: supports (chambers, lat, lng), (chambers, {latitude, longitude}), or ({latitude, longitude}, chambers)
 * Also falls back to chamber.hospital?.latitude / longitude if chamber itself has no direct coordinates.
 * @returns {Object|null} { chamber, distance, distanceKm, formattedDistance } or null if none valid
 */
export function findNearestChamber(arg1, arg2, arg3) {
  let chambers = []
  let userLat = null
  let userLng = null

  if (Array.isArray(arg1)) {
    chambers = arg1
    if (typeof arg2 === 'object' && arg2 !== null) {
      userLat = arg2.latitude ?? arg2.lat
      userLng = arg2.longitude ?? arg2.lng
    } else {
      userLat = arg2
      userLng = arg3
    }
  } else if (Array.isArray(arg2)) {
    chambers = arg2
    if (typeof arg1 === 'object' && arg1 !== null) {
      userLat = arg1.latitude ?? arg1.lat
      userLng = arg1.longitude ?? arg1.lng
    }
  }

  if (!Array.isArray(chambers) || chambers.length === 0) return null
  if (!isValidCoordinate(userLat, userLng)) return null

  let nearest = null
  let minDistance = Infinity

  for (const chamber of chambers) {
    if (!chamber) continue
    const lat = chamber.latitude ?? chamber.hospital?.latitude
    const lng = chamber.longitude ?? chamber.hospital?.longitude

    if (isValidCoordinate(lat, lng)) {
      const dist = calculateDistance(userLat, userLng, lat, lng)
      if (dist !== null && dist < minDistance) {
        minDistance = dist
        nearest = chamber
      }
    }
  }

  if (!nearest || minDistance === Infinity) return null

  return {
    chamber: nearest,
    distance: minDistance,
    distanceKm: minDistance,
    formattedDistance: formatDistance(minDistance, { locale: 'bn' }),
  }
}


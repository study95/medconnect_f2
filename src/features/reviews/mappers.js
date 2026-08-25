/**
 * Data Normalization and Mapping Utilities for Reviews Subsystem
 */

/**
 * Format reviewer display name honoring anonymity privacy rules
 */
export function formatReviewerName(review) {
  if (!review) return 'Verified Patient'
  if (review.is_anonymous) return 'Verified Patient'

  return review.user?.name || review.author_name || 'Verified Patient'
}

/**
 * Calculate star distribution breakdown and sub-dimension averages from a list of reviews
 */
export function calculateRatingSummary(reviews = []) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return {
      total: 0,
      average: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      cleanlinessAverage: 0,
      staffAverage: 0,
      waitTimeAverage: 0,
    }
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  let ratingSum = 0
  let cleanlinessSum = 0
  let cleanlinessCount = 0
  let staffSum = 0
  let staffCount = 0
  let waitTimeSum = 0
  let waitTimeCount = 0

  reviews.forEach((r) => {
    const rating = Math.round(Number(r.rating) || 0)
    if (rating >= 1 && rating <= 5) {
      distribution[rating] = (distribution[rating] || 0) + 1
      ratingSum += Number(r.rating)
    }

    if (r.cleanliness_rating) {
      cleanlinessSum += Number(r.cleanliness_rating)
      cleanlinessCount++
    }
    if (r.staff_rating) {
      staffSum += Number(r.staff_rating)
      staffCount++
    }
    if (r.wait_time_rating) {
      waitTimeSum += Number(r.wait_time_rating)
      waitTimeCount++
    }
  })

  const total = reviews.length
  const average = total > 0 ? Number((ratingSum / total).toFixed(1)) : 0

  const percentages = {
    5: total > 0 ? Math.round((distribution[5] / total) * 100) : 0,
    4: total > 0 ? Math.round((distribution[4] / total) * 100) : 0,
    3: total > 0 ? Math.round((distribution[3] / total) * 100) : 0,
    2: total > 0 ? Math.round((distribution[2] / total) * 100) : 0,
    1: total > 0 ? Math.round((distribution[1] / total) * 100) : 0,
  }

  return {
    total,
    average,
    distribution,
    percentages,
    cleanlinessAverage: cleanlinessCount > 0 ? Number((cleanlinessSum / cleanlinessCount).toFixed(1)) : 0,
    staffAverage: staffCount > 0 ? Number((staffSum / staffCount).toFixed(1)) : 0,
    waitTimeAverage: waitTimeCount > 0 ? Number((waitTimeSum / waitTimeCount).toFixed(1)) : 0,
  }
}

/**
 * Format ISO datetime string into human readable date
 */
export function formatReviewDate(dateString) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

/**
 * Normalize review form submission payload
 */
export function normalizeReviewPayload(formValues = {}) {
  return {
    appointment_id: formValues.appointment_id || undefined,
    appointment_public_id: formValues.appointment_public_id || undefined,
    rating: Number(formValues.rating),
    cleanliness_rating: formValues.cleanliness_rating ? Number(formValues.cleanliness_rating) : null,
    staff_rating: formValues.staff_rating ? Number(formValues.staff_rating) : null,
    wait_time_rating: formValues.wait_time_rating ? Number(formValues.wait_time_rating) : null,
    title: formValues.title ? String(formValues.title).trim() : null,
    comment: formValues.comment ? String(formValues.comment).trim() : '',
    is_anonymous: Boolean(formValues.is_anonymous),
    edit_reason: formValues.edit_reason ? String(formValues.edit_reason).trim() : undefined,
  }
}

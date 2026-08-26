/**
 * Data Normalization and Mapping Utilities for Reviews Subsystem
 */

/**
 * Format reviewer display name honoring anonymity privacy rules
 */
export function formatReviewerName(review) {
  if (!review) return 'Verified Patient'
  const isAnonymous = Boolean(review.reviewer?.is_anonymous ?? review.is_anonymous)
  if (isAnonymous) return 'Verified Patient'

  return review.reviewer?.name || review.user?.name || review.author_name || 'Verified Patient'
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

/**
 * Map API and network errors to natural Bengali user feedback
 */
export function getReviewErrorMessage(err) {
  if (!err) {
    return 'রিভিউ সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
  }

  // Network / Offline Error
  if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।'
  }

  const status = err.response.status
  const data = err.response.data || {}
  const rawMessage = typeof data.message === 'string' ? data.message : ''

  // 403 Forbidden / Policy Denial
  if (status === 403) {
    if (
      rawMessage.toLowerCase().includes('already') ||
      rawMessage.includes('ইতিমধ্যে') ||
      rawMessage.includes('ইতোমধ্যে') ||
      data.code === 'ALREADY_REVIEWED'
    ) {
      return 'আপনি ইতোমধ্যে এই অ্যাপয়েন্টমেন্টের জন্য রিভিউ দিয়েছেন।'
    }
    if (
      rawMessage.toLowerCase().includes('completed') ||
      rawMessage.toLowerCase().includes('attendance') ||
      rawMessage.includes('অসম্পূর্ণ') ||
      rawMessage.includes('বাতিল')
    ) {
      return 'চিকিৎসা সম্পন্ন হওয়ার পর আপনি রিভিউ দিতে পারবেন।'
    }
    if (
      rawMessage.toLowerCase().includes('self') ||
      rawMessage.toLowerCase().includes('own') ||
      rawMessage.includes('নিজস্ব')
    ) {
      return 'নিজের সেবা বা প্রতিষ্ঠানের জন্য রিভিউ দেওয়া অনুমোদিত নয়।'
    }
    return 'আপনি ইতোমধ্যে এই অ্যাপয়েন্টমেন্টের জন্য রিভিউ দিয়েছেন অথবা রিভিউ প্রদানের অনুমতি নেই।'
  }

  // 422 Unprocessable Entity / Validation Error
  if (status === 422) {
    const errors = data.errors || {}
    if (errors.comment && errors.comment[0]) return errors.comment[0]
    if (errors.rating && errors.rating[0]) return errors.rating[0]
    if (errors.title && errors.title[0]) return errors.title[0]
    if (errors.appointment_id || errors.appointment_public_id) {
      return 'সঠিক ও বৈধ অ্যাপয়েন্টমেন্ট নির্বাচন করুন।'
    }
    if (errors.cleanliness_rating || errors.staff_rating || errors.wait_time_rating) {
      return 'রেটিং স্কোর ১ থেকে ৫-এর মধ্যে নির্বাচন করুন।'
    }
    return rawMessage || 'অনুগ্রহ করে ফর্মে প্রদত্ত তথ্যগুলো সঠিকভাবে পূরণ করুন।'
  }

  // 404 Not Found
  if (status === 404) {
    return 'অ্যাপয়েন্টমেন্ট বা ডাক্তারের তথ্য খুঁজে পাওয়া যায়নি।'
  }

  // 401 Unauthorized
  if (status === 401) {
    return 'রিভিউ দিতে অনুগ্রহ করে প্রথমে লগইন করুন।'
  }

  // 429 Rate Limiting
  if (status === 429) {
    return 'অতিরিক্ত অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।'
  }

  // 500+ Server Errors
  if (status >= 500) {
    return 'সাময়িক সার্ভার সমস্যার কারণে রিভিউ জমা দেওয়া যায়নি। পরে আবার চেষ্টা করুন।'
  }

  return rawMessage || 'রিভিউ সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
}

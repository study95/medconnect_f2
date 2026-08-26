import { REVIEW_STATUS } from './constants'

/**
 * Review Permission Helpers for Frontend Authorization Checks
 */

/**
 * Checks if a user is eligible to submit a review for an appointment.
 * Condition: User is the appointment owner, appointment is completed, and no review exists yet.
 */
export function canCreateReview(user, appointment) {
  if (!user || !appointment) return false

  const isPatient = user.id === appointment.user_id || user.public_id === appointment.user?.public_id
  const isCompleted =
    String(appointment.status).toLowerCase() === 'completed' &&
    String(appointment.queue_status || 'completed').toLowerCase() === 'completed'

  const alreadyReviewed = Boolean(appointment.has_review || appointment.review_id || appointment.review)

  return isPatient && isCompleted && !alreadyReviewed
}

/**
 * Checks if a user can edit an existing review.
 * Condition: User is the review author and review is within 48h editable window.
 */
export function canEditReview(user, review) {
  if (!user || !review) return false

  // 1. Authoritative backend permission flag if present
  if (typeof review.can_edit === 'boolean') {
    return review.can_edit
  }

  // 2. Exact identity matching (prevent undefined === undefined leakage)
  const currentUserId = user.id ?? user.user_id
  const currentUserPublicId = user.public_id
  const reviewAuthorId = review.user_id ?? review.reviewer?.id
  const reviewAuthorPublicId = review.user?.public_id ?? review.reviewer?.public_id

  const isAuthor = Boolean(
    (currentUserId && reviewAuthorId && String(currentUserId) === String(reviewAuthorId)) ||
    (currentUserPublicId && reviewAuthorPublicId && String(currentUserPublicId) === String(reviewAuthorPublicId)) ||
    review.is_author === true
  )

  if (!isAuthor) return false

  // 3. Only approved reviews can be edited (pending reviews awaiting moderation cannot be edited)
  if (review.status && review.status !== 'approved') return false

  // 4. Strict 48-hour editable window
  if (review.created_at) {
    const createdAt = new Date(review.created_at).getTime()
    const now = Date.now()
    const hoursElapsed = (now - createdAt) / (1000 * 60 * 60)
    return hoursElapsed <= 48
  }

  return true
}

/**
 * Checks if a user can delete a review.
 * Condition: User is author or an administrator.
 */
export function canDeleteReview(user, review) {
  if (!user || !review) return false

  // 1. Authoritative backend permission flag if present
  if (typeof review.can_delete === 'boolean') {
    return review.can_delete
  }

  const isAdmin =
    user.role === 'admin' ||
    user.role === 'super-admin' ||
    user.registration_type === 'admin' ||
    user.role_id === 1 ||
    String(user.role_id) === 'admin' ||
    (Array.isArray(user.roles) && user.roles.some((r) => ['admin', 'super-admin'].includes(r.name || r)))

  if (isAdmin) return true

  const currentUserId = user.id ?? user.user_id
  const currentUserPublicId = user.public_id
  const reviewAuthorId = review.user_id ?? review.reviewer?.id
  const reviewAuthorPublicId = review.user?.public_id ?? review.reviewer?.public_id

  const isAuthor = Boolean(
    (currentUserId && reviewAuthorId && String(currentUserId) === String(reviewAuthorId)) ||
    (currentUserPublicId && reviewAuthorPublicId && String(currentUserPublicId) === String(reviewAuthorPublicId)) ||
    review.is_author === true
  )

  return isAuthor
}

/**
 * Checks if a user can post an official response to an approved review.
 * Condition: User is the subject Doctor, subject Hospital manager, or an Admin, and no slot collision exists.
 */
export function canReply(user, review) {
  if (!user || !review) return false
  if (review.status !== REVIEW_STATUS.APPROVED) return false

  const isAdmin =
    user.role === 'admin' ||
    user.role === 'super-admin' ||
    user.registration_type === 'admin' ||
    (Array.isArray(user.roles) && user.roles.some((r) => ['admin', 'super-admin'].includes(r.name || r)))

  if (isAdmin) return true

  const isDoctor =
    (user.doctor_id && (user.doctor_id === review.doctor_id || user.doctor?.public_id === review.doctor?.public_id)) ||
    user.registration_type === 'doctor' ||
    user.isDoctor ||
    user.is_doctor

  if (isDoctor && !review.doctor_reply && !review.doctorReply) {
    return true
  }

  const isHospital =
    (user.hospital_id && (user.hospital_id === review.hospital_id || user.hospital?.public_id === review.hospital?.public_id)) ||
    user.registration_type === 'hospital' ||
    user.isManager ||
    user.is_manager

  if (isHospital && !review.hospital_reply && !review.hospitalReply) {
    return true
  }

  return false
}

/**
 * Checks if a user has administrator moderation privileges.
 */
export function canModerate(user) {
  if (!user) return false

  return (
    user.role === 'admin' ||
    user.role === 'super-admin' ||
    user.registration_type === 'admin' ||
    (Array.isArray(user.roles) && user.roles.some((r) => ['admin', 'super-admin'].includes(r.name || r)))
  )
}

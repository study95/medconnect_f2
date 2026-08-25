/**
 * Review Subsystem Domain Constants
 */

export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  HIDDEN: 'hidden',
  FLAGGED: 'flagged',
}

export const REVIEW_STATUS_LABELS = {
  [REVIEW_STATUS.PENDING]: 'Pending Moderation',
  [REVIEW_STATUS.APPROVED]: 'Approved & Live',
  [REVIEW_STATUS.REJECTED]: 'Rejected',
  [REVIEW_STATUS.HIDDEN]: 'Hidden',
  [REVIEW_STATUS.FLAGGED]: 'Flagged for Review',
}

export const REVIEW_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest_rating', label: 'Highest Rating' },
  { value: 'lowest_rating', label: 'Lowest Rating' },
]

export const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
}

export const SUB_DIMENSION_LABELS = {
  cleanliness_rating: 'Cleanliness & Hygiene',
  staff_rating: 'Staff & Reception Behavior',
  wait_time_rating: 'Wait Time & Punctuality',
}

export const MODERATION_ACTIONS = {
  APPROVE: 'approve',
  REJECT: 'reject',
  HIDE: 'hide',
  FLAG: 'flag',
}

export const REPLY_RESPONDER_TYPE = {
  DOCTOR: 'doctor',
  HOSPITAL: 'hospital',
  ADMIN: 'admin',
}

export const REPORT_REASONS = [
  { value: 'defamation', label: 'False or Defamatory Claims' },
  { value: 'inappropriate_language', label: 'Inappropriate or Abusive Language' },
  { value: 'spam', label: 'Commercial Spam or Promotion' },
  { value: 'unverified_visit', label: 'Patient Never Attended Consultation' },
  { value: 'wrong_doctor_or_clinic', label: 'Submitted for Wrong Doctor or Facility' },
  { value: 'other', label: 'Other Policy Violation' },
]

export const REPORT_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  RESOLVED_REMOVED: 'resolved_removed',
  DISMISSED: 'dismissed',
}

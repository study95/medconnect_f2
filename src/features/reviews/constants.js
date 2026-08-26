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
  { value: 'newest', label: 'সবচেয়ে নতুন' },
  { value: 'oldest', label: 'সবচেয়ে পুরাতন' },
  { value: 'highest_rating', label: 'সর্বোচ্চ রেটিং' },
  { value: 'lowest_rating', label: 'সর্বনিম্ন রেটিং' },
]

export const RATING_LABELS = {
  1: 'খুব খারাপ',
  2: 'খারাপ',
  3: 'মোটামুটি',
  4: 'ভালো',
  5: 'অসাধারণ',
}

export const SUB_DIMENSION_LABELS = {
  cleanliness_rating: 'পরিচ্ছন্নতা ও স্বাস্থ্যবিধি',
  staff_rating: 'স্টাফদের ব্যবহার',
  wait_time_rating: 'অপেক্ষার সময়',
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
  { value: 'spam', label: 'স্প্যাম' },
  { value: 'fake_appointment', label: 'ভুয়া রিভিউ' },
  { value: 'harassment', label: 'অশালীন ভাষা' },
  { value: 'defamation', label: 'মানহানিকর তথ্য' },
  { value: 'privacy_leak', label: 'বিভ্রান্তিকর বা ব্যক্তিগত তথ্য' },
  { value: 'other', label: 'অন্যান্য' },
]

export const REPORT_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  RESOLVED_REMOVED: 'resolved_removed',
  DISMISSED: 'dismissed',
}

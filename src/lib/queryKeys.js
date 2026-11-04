// src/lib/queryKeys.js
/**
 * Enterprise Centralized Query Key Factory
 *
 * Provides a strongly-typed, hierarchical structure for all query keys in the application.
 * Hierarchy Rule: [Domain, Scope, ActorScope (for authenticated/portal queries), ID/Sub-scope, Filters/Params]
 * Keeping [Domain] and [Domain, Scope] prefixes intact preserves deterministic prefix
 * invalidation in cacheInvalidation.js while guaranteeing zero cross-tenant cache bleed
 * between Admin, Doctor, Hospital, and Patient accounts in the same browser.
 */

export function getActorCacheScope() {
  if (typeof window === 'undefined') return 'actor:ssr'
  try {
    const rawUser = localStorage.getItem('user')
    const rawType = localStorage.getItem('userType') || 'user'
    if (!rawUser) return 'actor:guest'
    const parsed = JSON.parse(rawUser)
    const id = parsed?.id ?? parsed?.public_id
    return id ? `actor:${rawType}:${id}` : 'actor:guest'
  } catch {
    return 'actor:guest'
  }
}

export const queryKeys = {
  // ===== DOCTORS =====
  doctors: {
    all: ['doctors'],
    me: () => [...queryKeys.doctors.all, 'me', getActorCacheScope()],
    lists: () => [...queryKeys.doctors.all, 'list'],
    list: (filters = {}) => [...queryKeys.doctors.lists(), filters],
    lookup: (filters = {}) => [...queryKeys.doctors.lists(), 'lookup', getActorCacheScope(), filters],
    adminLists: () => [...queryKeys.doctors.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.doctors.adminLists(), getActorCacheScope(), filters],
    details: () => [...queryKeys.doctors.all, 'detail'],
    detail: (identifier) => [...queryKeys.doctors.details(), String(identifier)],
    related: (identifier) => [...queryKeys.doctors.all, 'related', String(identifier)],
    reviews: (doctorId, filters = {}) => [...queryKeys.doctors.all, 'reviews', String(doctorId), filters],
    schedule: (doctorId) => [...queryKeys.doctors.all, 'schedule', String(doctorId)],
  },

  // ===== HOSPITALS =====
  hospitals: {
    all: ['hospitals'],
    me: () => [...queryKeys.hospitals.all, 'me', getActorCacheScope()],
    lists: () => [...queryKeys.hospitals.all, 'list'],
    list: (filters = {}) => [...queryKeys.hospitals.lists(), filters],
    lookup: (filters = {}) => [...queryKeys.hospitals.lists(), 'lookup', getActorCacheScope(), filters],
    adminLists: () => [...queryKeys.hospitals.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.hospitals.adminLists(), getActorCacheScope(), filters],
    details: () => [...queryKeys.hospitals.all, 'detail'],
    detail: (identifier) => [...queryKeys.hospitals.details(), String(identifier)],
    related: (identifier) => [...queryKeys.hospitals.all, 'related', String(identifier)],
    reviews: (hospitalId, filters = {}) => [...queryKeys.hospitals.all, 'reviews', String(hospitalId), filters],
  },

  // ===== DOCTOR CHAMBERS =====
  chambers: {
    all: ['chambers'],
    lists: () => [...queryKeys.chambers.all, 'list'],
    list: (filters = {}) => [...queryKeys.chambers.lists(), filters],
    adminLists: () => [...queryKeys.chambers.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.chambers.adminLists(), getActorCacheScope(), filters],
    details: () => [...queryKeys.chambers.all, 'detail'],
    detail: (id) => [...queryKeys.chambers.details(), String(id)],
    byDoctor: (doctorId) => [...queryKeys.chambers.all, 'doctor', String(doctorId)],
    byHospital: (hospitalId) => [...queryKeys.chambers.all, 'hospital', String(hospitalId)],
  },

  // ===== PATIENTS =====
  patients: {
    all: ['patients'],
    lists: () => [...queryKeys.patients.all, 'list'],
    list: (filters = {}) => [...queryKeys.patients.lists(), getActorCacheScope(), filters],
    lookup: (filters = {}) => [...queryKeys.patients.lists(), 'lookup', getActorCacheScope(), filters],
    adminLists: () => [...queryKeys.patients.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.patients.adminLists(), getActorCacheScope(), filters],
    details: () => [...queryKeys.patients.all, 'detail'],
    detail: (id) => [...queryKeys.patients.details(), String(id), getActorCacheScope()],
    history: (id) => [...queryKeys.patients.all, 'history', String(id), getActorCacheScope()],
  },

  // ===== SPECIALTIES =====
  specialties: {
    all: ['specialties'],
    lists: () => [...queryKeys.specialties.all, 'list'],
    list: (filters = {}) => [...queryKeys.specialties.lists(), filters],
    adminLists: () => [...queryKeys.specialties.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.specialties.adminLists(), getActorCacheScope(), filters],
    details: () => [...queryKeys.specialties.all, 'detail'],
    detail: (identifier) => [...queryKeys.specialties.details(), String(identifier)],
    hub: (slug) => [...queryKeys.specialties.all, 'hub', String(slug)],
  },

  // ===== GEOGRAPHIC / LOCATIONS LOOKUPS =====
  locations: {
    all: ['locations'],
    divisions: () => [...queryKeys.locations.all, 'divisions'],
    division: (id) => [...queryKeys.locations.all, 'division', String(id)],
    districts: (divisionId = null) => [...queryKeys.locations.all, 'districts', { divisionId }],
    district: (id) => [...queryKeys.locations.all, 'district', String(id)],
    upazilas: (districtId = null) => [...queryKeys.locations.all, 'upazilas', { districtId }],
    upazila: (id) => [...queryKeys.locations.all, 'upazila', String(id)],
    unions: (upazilaId = null) => [...queryKeys.locations.all, 'unions', { upazilaId }],
    union: (id) => [...queryKeys.locations.all, 'union', String(id)],
  },

  // ===== APPOINTMENTS =====
  appointments: {
    all: ['appointments'],
    lists: () => [...queryKeys.appointments.all, 'list'],
    list: (filters = {}) => [...queryKeys.appointments.lists(), getActorCacheScope(), filters],
    adminLists: () => [...queryKeys.appointments.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.appointments.adminLists(), getActorCacheScope(), filters],
    details: () => [...queryKeys.appointments.all, 'detail'],
    detail: (id) => [...queryKeys.appointments.details(), String(id), getActorCacheScope()],
    myAppointments: (filters = {}) => [...queryKeys.appointments.all, 'my-appointments', getActorCacheScope(), filters],
    queue: (chamberId, date) => [...queryKeys.appointments.all, 'queue', String(chamberId), date, getActorCacheScope()],
    calendar: (filters = {}) => [...queryKeys.appointments.all, 'calendar', getActorCacheScope(), filters],
    byDoctor: (id) => [...queryKeys.appointments.all, 'doctor', String(id), getActorCacheScope()],
    byPatient: (id) => [...queryKeys.appointments.all, 'patient', String(id), getActorCacheScope()],
    byChamber: (id) => [...queryKeys.appointments.all, 'chamber', String(id), getActorCacheScope()],
  },

  // ===== PRESCRIPTIONS =====
  prescriptions: {
    all: ['prescriptions'],
    lists: () => [...queryKeys.prescriptions.all, 'list'],
    list: (filters = {}) => [...queryKeys.prescriptions.lists(), getActorCacheScope(), filters],
    details: () => [...queryKeys.prescriptions.all, 'detail'],
    detail: (id) => [...queryKeys.prescriptions.details(), String(id), getActorCacheScope()],
    patientPrescriptions: (patientId) => [...queryKeys.prescriptions.all, 'patient', String(patientId), getActorCacheScope()],
  },

  // ===== MEDICINES =====
  medicines: {
    all: ['medicines'],
    lists: () => [...queryKeys.medicines.all, 'list'],
    list: (filters = {}) => [...queryKeys.medicines.lists(), filters],
    adminLists: () => [...queryKeys.medicines.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.medicines.adminLists(), getActorCacheScope(), filters],
    details: () => [...queryKeys.medicines.all, 'detail'],
    detail: (id) => [...queryKeys.medicines.details(), String(id)],
    search: (query) => [...queryKeys.medicines.all, 'search', String(query)],
    pendingCount: () => [...queryKeys.medicines.all, 'pending-count', getActorCacheScope()],
  },

  // ===== REVIEWS =====
  reviews: {
    all: ['reviews'],
    lists: () => [...queryKeys.reviews.all, 'list'],
    list: (filters = {}) => [...queryKeys.reviews.lists(), filters],
    doctor: (doctorId, filters = {}) => [...queryKeys.reviews.lists(), 'doctor', String(doctorId), filters],
    hospital: (hospitalId, filters = {}) => [...queryKeys.reviews.lists(), 'hospital', String(hospitalId), filters],
    details: () => [...queryKeys.reviews.all, 'detail'],
    detail: (identifier) => [...queryKeys.reviews.details(), String(identifier)],
    moderation: (filters = {}) => [...queryKeys.reviews.all, 'moderation', getActorCacheScope(), filters],
    reports: (filters = {}) => [...queryKeys.reviews.all, 'reports', getActorCacheScope(), filters],
  },

  // ===== USERS & PERMISSIONS =====
  users: {
    all: ['users'],
    lists: () => [...queryKeys.users.all, 'list'],
    list: (filters = {}) => [...queryKeys.users.lists(), getActorCacheScope(), filters],
    adminLists: () => [...queryKeys.users.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.users.adminLists(), getActorCacheScope(), filters],
    details: () => [...queryKeys.users.all, 'detail'],
    detail: (id) => [...queryKeys.users.details(), String(id), getActorCacheScope()],
    permissions: () => [...queryKeys.users.all, 'permissions', getActorCacheScope()],
    me: () => [...queryKeys.users.all, 'me', getActorCacheScope()],
  },

  // ===== SUBSCRIPTIONS & PACKAGES =====
  subscription: {
    all: ['subscription'],
    status: () => [...queryKeys.subscription.all, 'status', getActorCacheScope()],
    unreadCount: () => [...queryKeys.subscription.all, 'unread-count', getActorCacheScope()],
    popups: () => [...queryKeys.subscription.all, 'popups', getActorCacheScope()],
    packages: () => [...queryKeys.subscription.all, 'packages'],
    promoCodes: () => [...queryKeys.subscription.all, 'promo-codes', getActorCacheScope()],
    history: () => [...queryKeys.subscription.all, 'history', getActorCacheScope()],
    adminList: (filters = {}) => [...queryKeys.subscription.all, 'admin-list', getActorCacheScope(), filters],
  },

  // ===== DASHBOARD & ANALYTICS =====
  dashboard: {
    all: ['dashboard'],
    stats: () => [...queryKeys.dashboard.all, 'stats', getActorCacheScope()],
    analytics: (params = {}) => [...queryKeys.dashboard.all, 'analytics', getActorCacheScope(), params],
  },

  // ===== COMMISSIONS & REPORTS =====
  commissions: {
    all: ['commissions'],
    serviceEnablements: (filters = {}) => [...queryKeys.commissions.all, 'service-enablements', getActorCacheScope(), filters],
    hospitalCommissions: (filters = {}) => [...queryKeys.commissions.all, 'hospital-commissions', getActorCacheScope(), filters],
    patientBookingCommission: () => [...queryKeys.commissions.all, 'patient-booking', getActorCacheScope()],
    commissionReport: (filters = {}) => [...queryKeys.commissions.all, 'commission-report', getActorCacheScope(), filters],
    hospitalCommissionReport: (filters = {}) => [...queryKeys.commissions.all, 'hospital-commission-report', getActorCacheScope(), filters],
    doctorCommissionReport: (filters = {}) => [...queryKeys.commissions.all, 'doctor-commission-report', getActorCacheScope(), filters],
    purchaseReport: (filters = {}) => [...queryKeys.commissions.all, 'purchase-report', getActorCacheScope(), filters],
  },

  // ===== NOTIFICATIONS =====
  notifications: {
    all: ['notifications'],
    list: (filters = {}) => [...queryKeys.notifications.all, 'list', getActorCacheScope(), filters],
    count: () => [...queryKeys.notifications.all, 'count', getActorCacheScope()],
  },

  // ===== LEAVES =====
  leaves: {
    all: ['leaves'],
    lists: () => [...queryKeys.leaves.all, 'list'],
    list: (filters = {}) => [...queryKeys.leaves.lists(), getActorCacheScope(), filters],
    adminLists: () => [...queryKeys.leaves.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.leaves.adminLists(), getActorCacheScope(), filters],
    detail: (id) => [...queryKeys.leaves.all, 'detail', String(id), getActorCacheScope()],
    doctorLeaves: (doctorId) => [...queryKeys.leaves.all, 'doctor', String(doctorId)],
    byDoctor: (doctorId) => [...queryKeys.leaves.all, 'doctor', String(doctorId)],
    checkImpact: (params = {}) => [...queryKeys.leaves.all, 'impact', getActorCacheScope(), params],
  },

  // ===== AUDIT LOGS =====
  audit: {
    all: ['audit'],
    logs: (params = {}) => [...queryKeys.audit.all, 'logs', getActorCacheScope(), params],
  },

  // ===== CMS CONTENT =====
  content: {
    all: ['content'],
    cms: (slug) => [...queryKeys.content.all, 'cms', String(slug)],
    homepage: () => ['homepage'],
  },

  // ===== PAYMENTS =====
  payments: {
    all: ['payments'],
    lists: () => [...queryKeys.payments.all, 'list'],
    list: (filters = {}) => [...queryKeys.payments.lists(), getActorCacheScope(), filters],
    adminLists: () => [...queryKeys.payments.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.payments.adminLists(), getActorCacheScope(), filters],
    detail: (id) => [...queryKeys.payments.all, 'detail', String(id), getActorCacheScope()],
  },

  // ===== HIGHLIGHTS =====
  highlights: {
    all: ['highlights'],
    list: (filters = {}) => [...queryKeys.highlights.all, 'list', filters],
  },

  // ===== SERIAL DISPLAY =====
  serialDisplay: {
    all: ['serial-display'],
    list: (filters = {}) => [...queryKeys.serialDisplay.all, 'list', getActorCacheScope(), filters],
  },

  // ===== SERVICES =====
  services: {
    all: ['services'],
    list: (filters = {}) => [...queryKeys.services.all, 'list', getActorCacheScope(), filters],
    detail: (id) => [...queryKeys.services.all, 'detail', String(id), getActorCacheScope()],
  },

  // ===== MESSAGES =====
  messages: {
    all: ['admin-messages'],
    list: (filters = {}) => [...queryKeys.messages.all, 'list', getActorCacheScope(), filters],
  },

  // ===== SMS SETTINGS =====
  smsSettings: {
    all: ['sms-settings'],
    settings: () => [...queryKeys.smsSettings.all, 'settings', getActorCacheScope()],
  },
}

export default queryKeys

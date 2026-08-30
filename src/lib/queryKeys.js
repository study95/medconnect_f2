// src/lib/queryKeys.js
/**
 * Enterprise Centralized Query Key Factory
 *
 * Provides a strongly-typed, hierarchical structure for all query keys in the application.
 * Hierarchy Rule: [Domain, Scope, ID/Sub-scope, Filters/Params]
 * This ensures precise query invalidation without collateral cache pollution.
 */

export const queryKeys = {
  // ===== DOCTORS =====
  doctors: {
    all: ['doctors'],
    lists: () => [...queryKeys.doctors.all, 'list'],
    list: (filters = {}) => [...queryKeys.doctors.lists(), filters],
    adminLists: () => [...queryKeys.doctors.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.doctors.adminLists(), filters],
    details: () => [...queryKeys.doctors.all, 'detail'],
    detail: (identifier) => [...queryKeys.doctors.details(), String(identifier)],
    related: (identifier) => [...queryKeys.doctors.all, 'related', String(identifier)],
    reviews: (doctorId, filters = {}) => [...queryKeys.doctors.all, 'reviews', String(doctorId), filters],
    schedule: (doctorId) => [...queryKeys.doctors.all, 'schedule', String(doctorId)],
  },

  // ===== HOSPITALS =====
  hospitals: {
    all: ['hospitals'],
    lists: () => [...queryKeys.hospitals.all, 'list'],
    list: (filters = {}) => [...queryKeys.hospitals.lists(), filters],
    adminLists: () => [...queryKeys.hospitals.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.hospitals.adminLists(), filters],
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
    adminList: (filters = {}) => [...queryKeys.chambers.adminLists(), filters],
    details: () => [...queryKeys.chambers.all, 'detail'],
    detail: (id) => [...queryKeys.chambers.details(), String(id)],
    byDoctor: (doctorId) => [...queryKeys.chambers.all, 'doctor', String(doctorId)],
    byHospital: (hospitalId) => [...queryKeys.chambers.all, 'hospital', String(hospitalId)],
  },

  // ===== PATIENTS =====
  patients: {
    all: ['patients'],
    lists: () => [...queryKeys.patients.all, 'list'],
    list: (filters = {}) => [...queryKeys.patients.lists(), filters],
    adminLists: () => [...queryKeys.patients.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.patients.adminLists(), filters],
    details: () => [...queryKeys.patients.all, 'detail'],
    detail: (id) => [...queryKeys.patients.details(), String(id)],
    history: (id) => [...queryKeys.patients.all, 'history', String(id)],
  },

  // ===== SPECIALTIES =====
  specialties: {
    all: ['specialties'],
    lists: () => [...queryKeys.specialties.all, 'list'],
    list: (filters = {}) => [...queryKeys.specialties.lists(), filters],
    adminLists: () => [...queryKeys.specialties.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.specialties.adminLists(), filters],
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
    list: (filters = {}) => [...queryKeys.appointments.lists(), filters],
    adminLists: () => [...queryKeys.appointments.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.appointments.adminLists(), filters],
    details: () => [...queryKeys.appointments.all, 'detail'],
    detail: (id) => [...queryKeys.appointments.details(), String(id)],
    myAppointments: (filters = {}) => [...queryKeys.appointments.all, 'my-appointments', filters],
    queue: (chamberId, date) => [...queryKeys.appointments.all, 'queue', String(chamberId), date],
    calendar: (filters = {}) => [...queryKeys.appointments.all, 'calendar', filters],
    byDoctor: (id) => [...queryKeys.appointments.all, 'doctor', String(id)],
    byPatient: (id) => [...queryKeys.appointments.all, 'patient', String(id)],
    byChamber: (id) => [...queryKeys.appointments.all, 'chamber', String(id)],
  },

  // ===== PRESCRIPTIONS =====
  prescriptions: {
    all: ['prescriptions'],
    lists: () => [...queryKeys.prescriptions.all, 'list'],
    list: (filters = {}) => [...queryKeys.prescriptions.lists(), filters],
    details: () => [...queryKeys.prescriptions.all, 'detail'],
    detail: (id) => [...queryKeys.prescriptions.details(), String(id)],
    patientPrescriptions: (patientId) => [...queryKeys.prescriptions.all, 'patient', String(patientId)],
  },

  // ===== MEDICINES =====
  medicines: {
    all: ['medicines'],
    lists: () => [...queryKeys.medicines.all, 'list'],
    list: (filters = {}) => [...queryKeys.medicines.lists(), filters],
    details: () => [...queryKeys.medicines.all, 'detail'],
    detail: (id) => [...queryKeys.medicines.details(), String(id)],
    search: (query) => [...queryKeys.medicines.all, 'search', String(query)],
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
    moderation: (filters = {}) => [...queryKeys.reviews.all, 'moderation', filters],
    reports: (filters = {}) => [...queryKeys.reviews.all, 'reports', filters],
  },

  // ===== USERS & PERMISSIONS =====
  users: {
    all: ['users'],
    lists: () => [...queryKeys.users.all, 'list'],
    list: (filters = {}) => [...queryKeys.users.lists(), filters],
    adminLists: () => [...queryKeys.users.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.users.adminLists(), filters],
    details: () => [...queryKeys.users.all, 'detail'],
    detail: (id) => [...queryKeys.users.details(), String(id)],
    permissions: () => [...queryKeys.users.all, 'permissions'],
    me: () => [...queryKeys.users.all, 'me'],
  },

  // ===== SUBSCRIPTIONS & PACKAGES =====
  subscription: {
    all: ['subscription'],
    status: () => [...queryKeys.subscription.all, 'status'],
    unreadCount: () => [...queryKeys.subscription.all, 'unread-count'],
    popups: () => [...queryKeys.subscription.all, 'popups'],
    packages: () => [...queryKeys.subscription.all, 'packages'],
    promoCodes: () => [...queryKeys.subscription.all, 'promo-codes'],
    history: () => [...queryKeys.subscription.all, 'history'],
    adminList: (filters = {}) => [...queryKeys.subscription.all, 'admin-list', filters],
  },

  // ===== DASHBOARD & ANALYTICS =====
  dashboard: {
    all: ['dashboard'],
    stats: () => [...queryKeys.dashboard.all, 'stats'],
    analytics: (params = {}) => [...queryKeys.dashboard.all, 'analytics', params],
  },

  // ===== COMMISSIONS & REPORTS =====
  commissions: {
    all: ['commissions'],
    serviceEnablements: (filters = {}) => [...queryKeys.commissions.all, 'service-enablements', filters],
    hospitalCommissions: (filters = {}) => [...queryKeys.commissions.all, 'hospital-commissions', filters],
    patientBookingCommission: () => [...queryKeys.commissions.all, 'patient-booking'],
    commissionReport: (filters = {}) => [...queryKeys.commissions.all, 'commission-report', filters],
    purchaseReport: (filters = {}) => [...queryKeys.commissions.all, 'purchase-report', filters],
  },

  // ===== NOTIFICATIONS =====
  notifications: {
    all: ['notifications'],
    list: (filters = {}) => [...queryKeys.notifications.all, 'list', filters],
    count: () => [...queryKeys.notifications.all, 'count'],
  },

  // ===== LEAVES =====
  leaves: {
    all: ['leaves'],
    lists: () => [...queryKeys.leaves.all, 'list'],
    list: (filters = {}) => [...queryKeys.leaves.lists(), filters],
    adminLists: () => [...queryKeys.leaves.all, 'admin-list'],
    adminList: (filters = {}) => [...queryKeys.leaves.adminLists(), filters],
    detail: (id) => [...queryKeys.leaves.all, 'detail', String(id)],
    doctorLeaves: (doctorId) => [...queryKeys.leaves.all, 'doctor', String(doctorId)],
    byDoctor: (doctorId) => [...queryKeys.leaves.all, 'doctor', String(doctorId)],
    checkImpact: (params = {}) => [...queryKeys.leaves.all, 'impact', params],
  },

  // ===== AUDIT LOGS =====
  audit: {
    all: ['audit'],
    logs: (params = {}) => [...queryKeys.audit.all, 'logs', params],
  },

  // ===== CMS CONTENT =====
  content: {
    all: ['content'],
    cms: (slug) => [...queryKeys.content.all, 'cms', String(slug)],
    homepage: () => ['homepage'],
  },
}

export default queryKeys

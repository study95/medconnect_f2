// src/lib/cacheInvalidation.js
/**
 * Enterprise Cache Invalidation Utilities
 *
 * Provides targeted, deterministic query invalidation methods.
 * Ensures related downstream data is revalidated when an entity is mutated
 * WITHOUT causing unrelated module cache purges or performance regressions.
 */

import { queryKeys } from './queryKeys'

/**
 * Invalidate Doctor caches (list, detail, related, and optionally chambers)
 */
export function invalidateDoctors(queryClient, { doctorId = null, includeChambers = false, includeReviews = false } = {}) {
  if (!queryClient) return

  // Invalidate doctor lists & admin lists
  queryClient.invalidateQueries({ queryKey: queryKeys.doctors.lists() })
  queryClient.invalidateQueries({ queryKey: queryKeys.doctors.adminLists() })

  if (doctorId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.detail(doctorId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.related(doctorId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.schedule(doctorId) })
  }

  if (includeChambers) {
    queryClient.invalidateQueries({ queryKey: queryKeys.chambers.lists() })
    queryClient.invalidateQueries({ queryKey: queryKeys.chambers.adminLists() })
    if (doctorId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.chambers.byDoctor(doctorId) })
    }
  }

  if (includeReviews && doctorId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.reviews.doctor(doctorId) })
  }
}

/**
 * Invalidate Hospital caches (list, detail, related, and optionally chambers)
 */
export function invalidateHospitals(queryClient, { hospitalId = null, includeChambers = false, includeReviews = false } = {}) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.hospitals.lists() })
  queryClient.invalidateQueries({ queryKey: queryKeys.hospitals.adminLists() })

  if (hospitalId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.hospitals.detail(hospitalId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.hospitals.related(hospitalId) })
  }

  if (includeChambers) {
    queryClient.invalidateQueries({ queryKey: queryKeys.chambers.lists() })
    queryClient.invalidateQueries({ queryKey: queryKeys.chambers.adminLists() })
    if (hospitalId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.chambers.byHospital(hospitalId) })
    }
  }

  if (includeReviews && hospitalId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.reviews.hospital(hospitalId) })
  }
}

/**
 * Invalidate Chamber routines & schedule caches
 */
export function invalidateChambers(queryClient, { chamberId = null, doctorId = null, hospitalId = null } = {}) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.chambers.lists() })
  queryClient.invalidateQueries({ queryKey: queryKeys.chambers.adminLists() })

  if (chamberId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.chambers.detail(chamberId) })
  }

  if (doctorId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.chambers.byDoctor(doctorId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.schedule(doctorId) })
  }

  if (hospitalId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.chambers.byHospital(hospitalId) })
  }
}

/**
 * Invalidate Patient profile and registration caches
 */
export function invalidatePatients(queryClient, { patientId = null } = {}) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() })
  queryClient.invalidateQueries({ queryKey: queryKeys.patients.adminLists() })

  if (patientId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(patientId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.history(patientId) })
  }
}

/**
 * Invalidate Specialty caches
 */
export function invalidateSpecialties(queryClient, { specialtyId = null, slug = null } = {}) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.specialties.lists() })
  queryClient.invalidateQueries({ queryKey: queryKeys.specialties.adminLists() })

  if (specialtyId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.specialties.detail(specialtyId) })
  }

  if (slug) {
    queryClient.invalidateQueries({ queryKey: queryKeys.specialties.hub(slug) })
  }
}

/**
 * Invalidate Location caches (Divisions, Districts, Upazilas, Unions)
 */
export function invalidateLocations(queryClient, { type = 'all', divisionId = null, districtId = null, upazilaId = null } = {}) {
  if (!queryClient) return

  if (type === 'all' || type === 'divisions') {
    queryClient.invalidateQueries({ queryKey: queryKeys.locations.divisions() })
  }

  if (type === 'all' || type === 'districts') {
    queryClient.invalidateQueries({ queryKey: queryKeys.locations.districts(divisionId) })
  }

  if (type === 'all' || type === 'upazilas') {
    queryClient.invalidateQueries({ queryKey: queryKeys.locations.upazilas(districtId) })
  }

  if (type === 'all' || type === 'unions') {
    queryClient.invalidateQueries({ queryKey: queryKeys.locations.unions(upazilaId) })
  }
}

/**
 * Invalidate Appointment and queue state caches
 */
export function invalidateAppointments(queryClient, { appointmentId = null, chamberId = null, date = null, doctorId = null, patientId = null } = {}) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.appointments.lists() })
  queryClient.invalidateQueries({ queryKey: queryKeys.appointments.adminLists() })
  queryClient.invalidateQueries({ queryKey: queryKeys.appointments.myAppointments() })

  if (appointmentId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.detail(appointmentId) })
  }

  if (chamberId && date) {
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.queue(chamberId, date) })
  }

  if (doctorId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.schedule(doctorId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.byDoctor(doctorId) })
  }

  if (patientId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.history(patientId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.byPatient(patientId) })
  }
}

/**
 * Invalidate Prescription caches
 */
export function invalidatePrescriptions(queryClient, { prescriptionId = null, patientId = null } = {}) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.lists() })

  if (prescriptionId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.detail(prescriptionId) })
  }

  if (patientId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.patientPrescriptions(patientId) })
  }
}

/**
 * Invalidate Medicine catalogue and search caches
 */
export function invalidateMedicines(queryClient, { medicineId = null } = {}) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.medicines.lists() })

  if (medicineId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.medicines.detail(medicineId) })
  }
}

/**
 * Invalidate User and Permission caches
 */
export function invalidateUsers(queryClient, { userId = null, includePermissions = false } = {}) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
  queryClient.invalidateQueries({ queryKey: queryKeys.users.adminLists() })

  if (userId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
  }

  if (includePermissions) {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.permissions() })
  }
}

/**
 * Invalidate Subscription and Notification status caches
 */
export function invalidateSubscription(queryClient) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all })
}

/**
 * Invalidate Dashboard and KPI analytics caches
 */
export function invalidateDashboard(queryClient) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
}

/**
 * Invalidate Commission and Commission Report caches
 */
export function invalidateCommissions(queryClient) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all })
}

/**
 * Invalidate Doctor leave management caches
 */
export function invalidateLeaves(queryClient, { doctorId = null, leaveId = null } = {}) {
  if (!queryClient) return

  queryClient.invalidateQueries({ queryKey: queryKeys.leaves.lists() })
  queryClient.invalidateQueries({ queryKey: queryKeys.leaves.adminLists() })

  if (leaveId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.leaves.detail(leaveId) })
  }

  if (doctorId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.leaves.doctorLeaves(doctorId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.schedule(doctorId) })
  }
}

export default {
  doctors: invalidateDoctors,
  hospitals: invalidateHospitals,
  chambers: invalidateChambers,
  patients: invalidatePatients,
  specialties: invalidateSpecialties,
  locations: invalidateLocations,
  appointments: invalidateAppointments,
  prescriptions: invalidatePrescriptions,
  medicines: invalidateMedicines,
  users: invalidateUsers,
  subscription: invalidateSubscription,
  dashboard: invalidateDashboard,
  commissions: invalidateCommissions,
  leaves: invalidateLeaves,
}

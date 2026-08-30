// src/features/patients/useAdminPatients.js
/**
 * Enterprise Admin Patient Query & Mutation Hooks
 *
 * Encapsulates all server-state logic for the Patient Admin Module using TanStack Query.
 * Features:
 * - Query Key Factory integration (queryKeys.patients.adminList)
 * - Cached location lookups (Divisions, Districts, Upazilas, Unions)
 * - staleTime / gcTime inheritance from QueryClient
 * - keepPreviousData for smooth pagination, search, and filter transitions
 * - Targeted cache invalidation on CRUD mutations
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { invalidatePatients } from '../../lib/cacheInvalidation'
import { useLookupQuery } from '../../lib/queryHooks'
import {
  getPatients,
  getAdminPatient,
  createAdminPatient,
  updateAdminPatient,
  deleteAdminPatient,
  getUser,
  getAppointments,
  getPrescriptions,
  getDivisions,
  getDistricts,
  getUpazilas,
  getUnions,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

/**
 * Hook to fetch admin patient listings with server filters & smooth pagination
 */
export function useAdminPatients(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.patients.adminList(filters),
    queryFn: async () => {
      const res = await getPatients({ per_page: 500, ...filters })
      const raw = res.data?.data?.data || res.data?.data || res.data || []
      return Array.isArray(raw) ? raw : []
    },
    placeholderData: keepPreviousData,
  })

  return {
    patients: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load patients list.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch patient profile, history, appointments, and prescriptions in parallel
 */
export function useAdminPatientDetail(id, { isManager = false } = {}) {
  const query = useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: async () => {
      let patientData = null
      let targetUserId = null
      let targetPatientId = id

      // 1. Fetch from /admin/patients/:id first
      try {
        const pRes = await getAdminPatient(id)
        if (pRes.data?.data || pRes.data) {
          patientData = pRes.data?.data || pRes.data
          targetUserId = patientData.user_id || patientData.user?.id || id
          targetPatientId = patientData.id || id
        }
      } catch (pErr) {
        // Fallback to /users/:id
        try {
          const uRes = await getUser(id)
          patientData = uRes.data?.data || uRes.data
          targetUserId = patientData?.id
          targetPatientId = patientData?.patient?.id || patientData?.id
        } catch (uErr) {
          console.warn('Could not load patient or user record:', uErr)
        }
      }

      if (!patientData) {
        return { patient: null, appointments: [], prescriptions: [] }
      }

      // 2. Fetch appointments and prescriptions in parallel
      const fetchAppointments = async () => {
        try {
          const apptRes = await getAppointments({ user_id: targetUserId || targetPatientId })
          const apptList = apptRes.data?.data?.data || apptRes.data?.data || []
          return Array.isArray(apptList) ? apptList : []
        } catch (err) {
          console.warn('Failed to load patient appointments:', err)
          return []
        }
      }

      const fetchPrescriptions = async () => {
        if (isManager) return []
        try {
          const pressRes = await getPrescriptions({ patient_id: targetUserId || targetPatientId })
          const pressList = pressRes.data?.data?.data || pressRes.data?.data || []
          return Array.isArray(pressList) ? pressList : []
        } catch (err) {
          console.warn('Failed to load patient prescriptions:', err)
          return []
        }
      }

      const [appointments, prescriptions] = await Promise.all([
        fetchAppointments(),
        fetchPrescriptions(),
      ])

      return {
        patient: patientData,
        appointments,
        prescriptions,
      }
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })

  return {
    patient: query.data?.patient || null,
    appointments: query.data?.appointments || [],
    prescriptions: query.data?.prescriptions || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load patient details.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook for cached geographical lookups in the Patient module
 */
export function useAdminPatientLookups({ divisionId = '', districtId = '', upazilaId = '' } = {}) {
  // Divisions
  const divisionsQuery = useLookupQuery({
    queryKey: queryKeys.locations.divisions(),
    queryFn: async () => {
      const res = await getDivisions()
      return res.data?.data || []
    },
  })

  // Districts (cascading)
  const districtsQuery = useLookupQuery({
    queryKey: queryKeys.locations.districts(divisionId),
    queryFn: async () => {
      const res = await getDistricts({ division_id: divisionId })
      return res.data?.data || []
    },
    enabled: Boolean(divisionId),
  })

  // Upazilas (cascading)
  const upazilasQuery = useLookupQuery({
    queryKey: queryKeys.locations.upazilas(districtId),
    queryFn: async () => {
      const res = await getUpazilas({ district_id: districtId })
      return res.data?.data || []
    },
    enabled: Boolean(districtId),
  })

  // Unions (cascading)
  const unionsQuery = useLookupQuery({
    queryKey: queryKeys.locations.unions(upazilaId),
    queryFn: async () => {
      const res = await getUnions({ upazila_id: upazilaId })
      return res.data?.data || []
    },
    enabled: Boolean(upazilaId),
  })

  return {
    divisions: divisionsQuery.data || [],
    districts: districtsQuery.data || [],
    upazilas: upazilasQuery.data || [],
    unions: unionsQuery.data || [],
    isLoadingLookups:
      divisionsQuery.isLoading ||
      districtsQuery.isLoading ||
      upazilasQuery.isLoading ||
      unionsQuery.isLoading,
  }
}

/**
 * Hook for Patient CRUD mutations with targeted cache invalidation
 */
export function useAdminPatientMutations() {
  const queryClient = useQueryClient()

  // Delete Patient mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminPatient(id),
    onSuccess: (_, patientId) => {
      invalidatePatients(queryClient, { patientId })
    },
  })

  // Create Patient mutation
  const createMutation = useMutation({
    mutationFn: (formData) => createAdminPatient(formData),
    onSuccess: () => {
      invalidatePatients(queryClient)
    },
  })

  // Update Patient mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => updateAdminPatient(id, formData),
    onSuccess: (_, { id }) => {
      invalidatePatients(queryClient, { patientId: id })
    },
  })

  return {
    deletePatient: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    createPatient: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updatePatient: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

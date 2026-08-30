// src/features/appointments/useAdminAppointments.js
/**
 * Enterprise Admin Appointment Query & Mutation Hooks
 *
 * Encapsulates all server-state logic for the Appointment Admin Module using TanStack Query.
 * Features:
 * - Query Key Factory integration (queryKeys.appointments.adminList)
 * - Reusable lookups for Doctors, Hospitals, Patients, and Doctor Chambers
 * - staleTime / gcTime inheritance from QueryClient
 * - keepPreviousData for smooth pagination, search, tab, and filter transitions
 * - Targeted cache invalidation on appointment scheduling and status updates
 * - Optimistic updates for appointment confirmation, completion, cancellation
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { invalidateAppointments, invalidatePatients } from '../../lib/cacheInvalidation'
import { useLookupQuery } from '../../lib/queryHooks'
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  createWalkInPatient,
  getDoctors,
  getHospitals,
  getPatients,
  getChambers,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

/**
 * Hook to fetch admin appointments with server-side filters & caching
 */
export function useAdminAppointments(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.appointments.adminList(filters),
    queryFn: async () => {
      const res = await getAppointments({ per_page: 5000, ...filters })
      const raw = res.data?.data?.data || res.data?.data || res.data || []
      return Array.isArray(raw) ? raw : []
    },
    placeholderData: keepPreviousData,
  })

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load appointments list.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch single appointment details
 */
export function useAdminAppointmentDetail(id) {
  const query = useQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: async () => {
      const res = await getAppointment(id)
      return res.data?.data || res.data || null
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })

  return {
    appointment: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load appointment details.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook for cached lookup data used across Appointment forms & filters
 */
export function useAdminAppointmentLookups({ doctorId = '' } = {}) {
  // Doctors lookup
  const doctorsQuery = useLookupQuery({
    queryKey: queryKeys.doctors.list({ per_page: 500 }),
    queryFn: async () => {
      const res = await getDoctors({ per_page: 500 })
      return res.data?.data?.data || res.data?.data || []
    },
  })

  // Hospitals lookup
  const hospitalsQuery = useLookupQuery({
    queryKey: queryKeys.hospitals.list({ per_page: 500 }),
    queryFn: async () => {
      const res = await getHospitals({ per_page: 500 })
      return res.data?.data?.data || res.data?.data || []
    },
  })

  // Patients lookup
  const patientsQuery = useLookupQuery({
    queryKey: queryKeys.patients.list({ per_page: 1000 }),
    queryFn: async () => {
      const res = await getPatients({ per_page: 1000 })
      return res.data?.data?.data || res.data?.data || []
    },
  })

  // Scoped Chambers lookup for selected doctor
  const chambersQuery = useLookupQuery({
    queryKey: queryKeys.chambers.byDoctor(doctorId),
    queryFn: async () => {
      const res = await getChambers(doctorId)
      return res.data?.data || []
    },
    enabled: Boolean(doctorId),
  })

  return {
    doctors: doctorsQuery.data || [],
    hospitals: hospitalsQuery.data || [],
    patients: patientsQuery.data || [],
    chambers: chambersQuery.data || [],
    isLoadingLookups:
      doctorsQuery.isLoading ||
      hospitalsQuery.isLoading ||
      patientsQuery.isLoading ||
      chambersQuery.isLoading,
  }
}

/**
 * Mutation hooks for Appointment CRUD with targeted cache invalidation & optimistic status updates
 */
export function useAdminAppointmentMutations() {
  const queryClient = useQueryClient()

  // Create Appointment
  const createMutation = useMutation({
    mutationFn: (data) => createAppointment(data),
    onSuccess: (_, variables) => {
      invalidateAppointments(queryClient, {
        doctorId: variables.doctor_id,
        patientId: variables.patient_id,
        chamberId: variables.chamber_id,
        date: variables.date,
      })
    },
  })

  // Update Appointment
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAppointment(id, data),
    onSuccess: (_, { id, data }) => {
      invalidateAppointments(queryClient, {
        appointmentId: id,
        doctorId: data?.doctor_id,
        patientId: data?.patient_id,
        chamberId: data?.chamber_id,
        date: data?.date,
      })
    },
  })

  // Delete Appointment
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAppointment(id),
    onSuccess: (_, appointmentId) => {
      invalidateAppointments(queryClient, { appointmentId })
    },
  })

  // Optimistic Status Update (Confirmed, Completed, Cancelled)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateAppointment(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.appointments.all })

      const previousLists = queryClient.getQueriesData({ queryKey: queryKeys.appointments.adminLists() })
      const previousDetail = queryClient.getQueryData(queryKeys.appointments.detail(id))

      // Optimistically update lists in memory
      queryClient.setQueriesData({ queryKey: queryKeys.appointments.adminLists() }, (old) => {
        if (!Array.isArray(old)) return old
        return old.map((appt) => (appt.id === id ? { ...appt, status } : appt))
      })

      // Optimistically update detail in memory
      if (previousDetail) {
        queryClient.setQueryData(queryKeys.appointments.detail(id), (old) => ({
          ...old,
          status,
        }))
      }

      return { previousLists, previousDetail }
    },
    onError: (err, { id }, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.appointments.detail(id), context.previousDetail)
      }
    },
    onSettled: (_, __, { id }) => {
      invalidateAppointments(queryClient, { appointmentId: id })
    },
  })

  // Create Walk-in Patient
  const createWalkInMutation = useMutation({
    mutationFn: (data) => createWalkInPatient(data),
    onSuccess: () => {
      invalidatePatients(queryClient)
    },
  })

  return {
    createAppointment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateAppointment: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteAppointment: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateAppointmentStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    createWalkInPatient: createWalkInMutation.mutateAsync,
    isCreatingWalkIn: createWalkInMutation.isPending,
  }
}

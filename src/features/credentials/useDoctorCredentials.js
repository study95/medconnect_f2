// src/features/credentials/useDoctorCredentials.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import {
  getMedicalDegrees,
  getActiveMedicalDegrees,
  createMedicalDegree,
  updateMedicalDegree,
  deleteMedicalDegree,
  toggleMedicalDegreeActive,
  getDoctorDesignations,
  getActiveDoctorDesignations,
  createDoctorDesignation,
  updateDoctorDesignation,
  deleteDoctorDesignation,
  toggleDoctorDesignationActive,
} from '../../api/adminApi'

export function useActiveMedicalDegrees() {
  const query = useQuery({
    queryKey: queryKeys.medicalDegrees.active(),
    queryFn: async () => {
      const res = await getActiveMedicalDegrees()
      return res.data?.data || []
    },
    staleTime: 60 * 60 * 1000,
  })

  return {
    degrees: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useAdminMedicalDegrees(params = {}) {
  const query = useQuery({
    queryKey: queryKeys.medicalDegrees.adminList(params),
    queryFn: async () => {
      const res = await getMedicalDegrees(params)
      return res.data
    },
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  })

  return {
    items: query.data?.data || [],
    pagination: {
      currentPage: query.data?.current_page || 1,
      lastPage: query.data?.last_page || 1,
      total: query.data?.total || 0,
      perPage: query.data?.per_page || 50,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  }
}

export function useActiveDoctorDesignations() {
  const query = useQuery({
    queryKey: queryKeys.doctorDesignations.active(),
    queryFn: async () => {
      const res = await getActiveDoctorDesignations()
      return res.data?.data || []
    },
    staleTime: 60 * 60 * 1000,
  })

  return {
    designations: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useAdminDoctorDesignations(params = {}) {
  const query = useQuery({
    queryKey: queryKeys.doctorDesignations.adminList(params),
    queryFn: async () => {
      const res = await getDoctorDesignations(params)
      return res.data
    },
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  })

  return {
    items: query.data?.data || [],
    pagination: {
      currentPage: query.data?.current_page || 1,
      lastPage: query.data?.last_page || 1,
      total: query.data?.total || 0,
      perPage: query.data?.per_page || 50,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  }
}

export function useAdminCredentialMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.medicalDegrees.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.doctorDesignations.all })
  }

  const createDegreeMutation = useMutation({
    mutationFn: (data) => createMedicalDegree(data),
    onSuccess: () => invalidate(),
  })

  const updateDegreeMutation = useMutation({
    mutationFn: ({ id, data }) => updateMedicalDegree(id, data),
    onSuccess: () => invalidate(),
  })

  const deleteDegreeMutation = useMutation({
    mutationFn: (id) => deleteMedicalDegree(id),
    onSuccess: () => invalidate(),
  })

  const toggleDegreeMutation = useMutation({
    mutationFn: (id) => toggleMedicalDegreeActive(id),
    onSuccess: () => invalidate(),
  })

  const createDesignationMutation = useMutation({
    mutationFn: (data) => createDoctorDesignation(data),
    onSuccess: () => invalidate(),
  })

  const updateDesignationMutation = useMutation({
    mutationFn: ({ id, data }) => updateDoctorDesignation(id, data),
    onSuccess: () => invalidate(),
  })

  const deleteDesignationMutation = useMutation({
    mutationFn: (id) => deleteDoctorDesignation(id),
    onSuccess: () => invalidate(),
  })

  const toggleDesignationMutation = useMutation({
    mutationFn: (id) => toggleDoctorDesignationActive(id),
    onSuccess: () => invalidate(),
  })

  return {
    createDegreeMutation,
    updateDegreeMutation,
    deleteDegreeMutation,
    toggleDegreeMutation,
    createDesignationMutation,
    updateDesignationMutation,
    deleteDesignationMutation,
    toggleDesignationMutation,
  }
}

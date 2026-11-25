// src/features/clinical/useDosagePresets.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import {
  getDosageFrequencies,
  getActiveDosageFrequencies,
  createDosageFrequency,
  updateDosageFrequency,
  deleteDosageFrequency,
  toggleDosageFrequencyActive,
  getDosageTimings,
  getActiveDosageTimings,
  createDosageTiming,
  updateDosageTiming,
  deleteDosageTiming,
  toggleDosageTimingActive,
} from '../../api/adminApi'

export function useActiveDosageFrequencies() {
  const query = useQuery({
    queryKey: queryKeys.dosageFrequencies.active(),
    queryFn: async () => {
      const res = await getActiveDosageFrequencies()
      return res.data?.data || []
    },
    staleTime: 60 * 60 * 1000,
  })

  return {
    frequencies: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useAdminDosageFrequencies(params = {}) {
  const query = useQuery({
    queryKey: queryKeys.dosageFrequencies.adminList(params),
    queryFn: async () => {
      const res = await getDosageFrequencies(params)
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

export function useActiveDosageTimings(type = 'meal') {
  const query = useQuery({
    queryKey: queryKeys.dosageTimings.active(type),
    queryFn: async () => {
      const res = await getActiveDosageTimings(type)
      return res.data?.data || []
    },
    staleTime: 60 * 60 * 1000,
  })

  return {
    timings: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useAdminDosageTimings(params = {}) {
  const query = useQuery({
    queryKey: queryKeys.dosageTimings.adminList(params),
    queryFn: async () => {
      const res = await getDosageTimings(params)
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

export function useAdminDosagePresetMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dosageFrequencies.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.dosageTimings.all })
  }

  const createFrequencyMutation = useMutation({
    mutationFn: (data) => createDosageFrequency(data),
    onSuccess: () => invalidate(),
  })

  const updateFrequencyMutation = useMutation({
    mutationFn: ({ id, data }) => updateDosageFrequency(id, data),
    onSuccess: () => invalidate(),
  })

  const deleteFrequencyMutation = useMutation({
    mutationFn: (id) => deleteDosageFrequency(id),
    onSuccess: () => invalidate(),
  })

  const toggleFrequencyMutation = useMutation({
    mutationFn: (id) => toggleDosageFrequencyActive(id),
    onSuccess: () => invalidate(),
  })

  const createTimingMutation = useMutation({
    mutationFn: (data) => createDosageTiming(data),
    onSuccess: () => invalidate(),
  })

  const updateTimingMutation = useMutation({
    mutationFn: ({ id, data }) => updateDosageTiming(id, data),
    onSuccess: () => invalidate(),
  })

  const deleteTimingMutation = useMutation({
    mutationFn: (id) => deleteDosageTiming(id),
    onSuccess: () => invalidate(),
  })

  const toggleTimingMutation = useMutation({
    mutationFn: (id) => toggleDosageTimingActive(id),
    onSuccess: () => invalidate(),
  })

  return {
    createFrequencyMutation,
    updateFrequencyMutation,
    deleteFrequencyMutation,
    toggleFrequencyMutation,
    createTimingMutation,
    updateTimingMutation,
    deleteTimingMutation,
    toggleTimingMutation,
  }
}

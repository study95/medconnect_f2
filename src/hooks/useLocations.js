// WHY THIS FILE EXISTS:
// The search filter on Home page AND Doctors page both need
// divisions + districts. Instead of copy-pasting the same
// fetch logic twice, we put it in ONE custom hook.
//
// OPTIMIZATION: Now uses TanStack Query for each cascade level.
// - Divisions cached 30min (they never change)
// - Districts cached by division_id
// - Upazilas cached by district_id
// - Unions cached by upazila_id
// On back-navigation, all data is instantly available from cache.

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDivisions, getDistricts, getUpazilas, getUnions } from '../api/locationApi'

function useLocations() {
  const [selectedDivision, setSelectedDivision] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedUpazila, setSelectedUpazila]   = useState('')
  const [selectedUnion, setSelectedUnion]       = useState('')

  // Divisions — cached 30min, fetched once
  const divisionsQuery = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const res = await getDivisions()
      return res.data?.data || res.data || []
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })

  // Districts — cached by division, only fetches when a division is selected
  const districtsQuery = useQuery({
    queryKey: ['districts', { division_id: selectedDivision }],
    queryFn: async () => {
      const res = await getDistricts({ division_id: selectedDivision })
      return res.data?.data || res.data || []
    },
    enabled: !!selectedDivision,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })

  // Upazilas — cached by district
  const upazilasQuery = useQuery({
    queryKey: ['upazilas', { district_id: selectedDistrict }],
    queryFn: async () => {
      const res = await getUpazilas({ district_id: selectedDistrict })
      return res.data?.data || res.data || []
    },
    enabled: !!selectedDistrict,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })

  // Unions — cached by upazila
  const unionsQuery = useQuery({
    queryKey: ['unions', { upazila_id: selectedUpazila }],
    queryFn: async () => {
      const res = await getUnions({ upazila_id: selectedUpazila })
      return res.data?.data || res.data || []
    },
    enabled: !!selectedUpazila,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })

  // Cascade reset wrappers — when parent changes, reset children
  const handleSetDivision = (val) => {
    setSelectedDivision(val)
    setSelectedDistrict('')
    setSelectedUpazila('')
    setSelectedUnion('')
  }

  const handleSetDistrict = (val) => {
    setSelectedDistrict(val)
    setSelectedUpazila('')
    setSelectedUnion('')
  }

  const handleSetUpazila = (val) => {
    setSelectedUpazila(val)
    setSelectedUnion('')
  }

  return {
    divisions: divisionsQuery.data || [],
    districts: districtsQuery.data || [],
    upazilas: upazilasQuery.data || [],
    unions: unionsQuery.data || [],
    selectedDivision, selectedDistrict, selectedUpazila, selectedUnion,
    setSelectedDivision: handleSetDivision,
    setSelectedDistrict: handleSetDistrict,
    setSelectedUpazila: handleSetUpazila,
    setSelectedUnion,
    loadingDivisions: divisionsQuery.isLoading,
    loadingDistricts: districtsQuery.isLoading,
    loadingUpazilas: upazilasQuery.isLoading,
    loadingUnions: unionsQuery.isLoading,
    refresh: () => {
      divisionsQuery.refetch()
    }
  }
}

export default useLocations

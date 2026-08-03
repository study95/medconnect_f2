// src/hooks/useHomepage.js
// WHY THIS HOOK EXISTS:
// ─────────────────────
// Before: Each homepage section (MostViewedDoctors, TopHospitals,
// TopSpecialtiesSlider, HeroSection) made its own API call.
// That's 5-8 parallel HTTP requests on page load.
//
// After: This single hook fetches ALL homepage data in one call.
// The HomePage component distributes the data to children via props.
//
// CACHING STRATEGY:
// - staleTime: 10 minutes → data stays "fresh", no refetch on back-navigation
// - gcTime: 30 minutes → cached data persists in memory even after unmount
// - refetchOnMount: false → navigating away and back shows cached data instantly
//
// This means:
// 1. First visit: single API call, ~100-200ms
// 2. Navigate to /doctors, then press back: INSTANT (0ms, cached)
// 3. Revisit after 5 min: still instant (staleTime not expired)
// 4. Revisit after 11 min: background refetch, but old data shown immediately

import { useQuery } from '@tanstack/react-query'
import { getHomepage } from '../api/homepageApi'

export function useHomepage() {
  return useQuery({
    queryKey: ['homepage'],
    queryFn: async () => {
      const res = await getHomepage()
      return res.data
    },
    staleTime: 10 * 60 * 1000,   // 10 min — homepage data rarely changes
    gcTime: 30 * 60 * 1000,      // 30 min — keep in memory long after unmount
  })
}

export default useHomepage

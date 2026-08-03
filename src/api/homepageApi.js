// src/api/homepageApi.js
// WHY THIS FILE EXISTS:
// Single API call that replaces 8 separate calls the homepage used to make.
// Returns: top_doctors, top_hospitals, specialties, stats — all in one payload.
// Combined with TanStack Query caching, this makes the homepage feel instant.

import axiosInstance from './axiosInstance'

// GET /api/homepage — aggregated homepage data (~12-15KB vs ~60-80KB before)
export const getHomepage = () => axiosInstance.get('/homepage')

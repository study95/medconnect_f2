import axiosInstance from './axiosInstance'

/**
 * Unified Search API
 */
export const searchUnified = (params = {}) =>
  axiosInstance.get('/search', { params })

export const getSearchSuggestions = (query, limit = 5, type = null) =>
  axiosInstance.get('/search/suggestions', { params: { query, limit, ...(type ? { type } : {}) } })

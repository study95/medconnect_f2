import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * useTableUrlFilters
 *
 * Enterprise-grade URL query parameter sync hook for data tables and listing pages.
 * 
 * Features:
 * - Two-way sync between URL query string and table filters (search, status, date, pagination, etc.)
 * - Native Browser Back/Forward support: preserves exact filter state and page number
 * - Shareable & Bookmarkable URLs
 * - Built-in debounced search with zero typing latency
 * - Automatic page reset to 1 when filters or search change
 * - Clean URLs (omits default/empty values)
 * - Optional sessionStorage fallback for same-session tab persistence
 * - Zero-loop protection with stable refs, equality checks, and sync guards
 */
export function useTableUrlFilters({
  initialFilters = {},
  defaultPage = 1,
  defaultPerPage = 10,
  searchDebounceMs = 350,
  storageKey = null,
  aliases = {},
  preserveKeys = ['page', 'perPage']
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams()

  // Stable references for options that may be passed as inline object literals
  const initialFiltersRef = useRef(initialFilters)
  useEffect(() => {
    initialFiltersRef.current = initialFilters
  })

  const aliasesRef = useRef(aliases)
  useEffect(() => {
    aliasesRef.current = aliases
  })

  // Flag to avoid overwriting URL when internal state is being updated FROM the URL (back/forward)
  const isSyncingFromUrl = useRef(false)
  const isInitialMount = useRef(true)
  const lastSyncedUrlQuery = useRef(searchParams.toString())

  // 1. Helper to cast URL string values to match initialFilters types
  const parseParamValue = useCallback((key, strVal, fallback) => {
    if (strVal === null || strVal === undefined) return fallback

    const targetType = typeof fallback
    if (targetType === 'number') {
      const parsed = Number(strVal)
      return isNaN(parsed) ? fallback : parsed
    }
    if (targetType === 'boolean') {
      return strVal === 'true' || strVal === '1'
    }
    return strVal
  }, [])

  // Helper to read param checking aliases
  const getParamWithAlias = useCallback((key, currentParams) => {
    const directVal = currentParams.get(key)
    if (directVal !== null) return directVal
    const aliasList = aliasesRef.current[key]
    if (aliasList) {
      for (const alias of aliasList) {
        const aliasVal = currentParams.get(alias)
        if (aliasVal !== null) return aliasVal
      }
    }
    return null
  }, [])

  // 2. Read initial state from URL (or sessionStorage fallback)
  const getInitialState = useCallback(() => {
    const hasAnyUrlParams = Array.from(searchParams.keys()).length > 0

    let sessionData = null
    if (!hasAnyUrlParams && storageKey) {
      try {
        const raw = sessionStorage.getItem(storageKey)
        if (raw) sessionData = JSON.parse(raw)
      } catch (err) {
        // Ignore session parse error
      }
    }

    const initFilters = initialFiltersRef.current
    const state = { ...initFilters }

    // Parse custom filters
    Object.keys(initFilters).forEach((key) => {
      const urlVal = getParamWithAlias(key, searchParams)
      if (urlVal !== null) {
        state[key] = parseParamValue(key, urlVal, initFilters[key])
      } else if (sessionData && sessionData[key] !== undefined) {
        state[key] = sessionData[key]
      }
    })

    // Parse search
    const urlSearch = getParamWithAlias('search', searchParams)
    const initialSearchVal = urlSearch !== null 
      ? urlSearch 
      : (sessionData?.search !== undefined ? sessionData.search : '')

    // Parse page and perPage
    const urlPage = getParamWithAlias('page', searchParams)
    const initialPageVal = urlPage !== null 
      ? Math.max(1, parseInt(urlPage, 10) || defaultPage)
      : (sessionData?.page || defaultPage)

    const urlPerPage = getParamWithAlias('perPage', searchParams)
    const initialPerPageVal = urlPerPage !== null 
      ? Math.max(1, parseInt(urlPerPage, 10) || defaultPerPage)
      : (sessionData?.perPage || defaultPerPage)

    return {
      filters: state,
      search: initialSearchVal,
      page: initialPageVal,
      perPage: initialPerPageVal
    }
  }, [searchParams, defaultPage, defaultPerPage, parseParamValue, storageKey, getParamWithAlias])

  // Parse initial state once on component mount
  const initialParsed = useMemo(() => getInitialState(), []) // eslint-disable-line react-hooks/exhaustive-deps

  // Local state
  const [searchInput, setSearchInput] = useState(initialParsed.search)
  const [debouncedSearch, setDebouncedSearch] = useState(initialParsed.search)
  const [page, setPageState] = useState(initialParsed.page)
  const [perPage, setPerPageState] = useState(initialParsed.perPage)
  const [filters, setFiltersState] = useState(initialParsed.filters)

  // 3. Keep debouncedSearch in sync with searchInput
  useEffect(() => {
    // If searchInput matches debouncedSearch, no need to trigger timer
    if (searchInput === debouncedSearch) return

    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, searchDebounceMs)

    return () => clearTimeout(timer)
  }, [searchInput, debouncedSearch, searchDebounceMs])

  // 4. Synchronize URL searchParams whenever filters, debouncedSearch, page, or perPage change
  useEffect(() => {
    // Skip if this effect is running due to a sync FROM url
    if (isSyncingFromUrl.current) {
      isSyncingFromUrl.current = false
      return
    }

    // Skip on very first mount if URL already has identical content
    if (isInitialMount.current) {
      isInitialMount.current = false
      // Only write to URL if we restored from sessionStorage on empty URL
      if (Array.from(searchParams.keys()).length > 0) {
        return
      }
    }

    const initFilters = initialFiltersRef.current
    const newParams = new URLSearchParams()

    // Add debounced search
    if (debouncedSearch && debouncedSearch.trim() !== '') {
      newParams.set('search', debouncedSearch.trim())
    }

    // Add page if not 1
    if (page > 1) {
      newParams.set('page', String(page))
    }

    // Add perPage if not default
    if (perPage !== defaultPerPage) {
      newParams.set('perPage', String(perPage))
    }

    // Add filters (skip empty strings, null, or defaults)
    Object.keys(filters).forEach((key) => {
      const val = filters[key]
      const defaultVal = initFilters[key]

      if (val !== undefined && val !== null && val !== '' && val !== defaultVal) {
        newParams.set(key, String(val))
      }
    })

    // Strict equality check: do NOT call setSearchParams if URL query string is already identical!
    const currentQueryStr = searchParams.toString()
    const newQueryStr = newParams.toString()
    if (currentQueryStr !== newQueryStr) {
      lastSyncedUrlQuery.current = newQueryStr
      setSearchParams(newParams, { replace: true })
    }

    // Persist to sessionStorage for fallback if configured
    if (storageKey) {
      try {
        const toStore = {
          search: debouncedSearch,
          page,
          perPage,
          ...filters
        }
        sessionStorage.setItem(storageKey, JSON.stringify(toStore))
      } catch (e) {
        // Ignore quota errors
      }
    }
  }, [debouncedSearch, page, perPage, filters, defaultPerPage, searchParams, setSearchParams, storageKey])

  // 5. Handle Browser Back / Forward navigation (Listen to external URL changes)
  useEffect(() => {
    const currentQueryStr = searchParams.toString()

    // If query string matches what we last wrote or initialized, ignore (internal update)
    if (currentQueryStr === lastSyncedUrlQuery.current) {
      return
    }

    lastSyncedUrlQuery.current = currentQueryStr

    const initFilters = initialFiltersRef.current

    const currentUrlSearch = getParamWithAlias('search', searchParams) || ''
    const currentUrlPage = Math.max(1, parseInt(getParamWithAlias('page', searchParams) || '1', 10))
    const currentUrlPerPage = Math.max(1, parseInt(getParamWithAlias('perPage', searchParams) || String(defaultPerPage), 10))

    setSearchInput(currentUrlSearch)
    setDebouncedSearch(currentUrlSearch)
    setPageState(currentUrlPage)
    setPerPageState(currentUrlPerPage)

    // Check custom filters against URL
    const nextFilters = { ...initFilters }
    Object.keys(initFilters).forEach((key) => {
      const urlVal = getParamWithAlias(key, searchParams)
      if (urlVal !== null) {
        nextFilters[key] = parseParamValue(key, urlVal, initFilters[key])
      }
    })

    isSyncingFromUrl.current = true
    setFiltersState(nextFilters)
  }, [searchParams, defaultPerPage, getParamWithAlias, parseParamValue])

  // 6. Public Actions
  const setFilter = useCallback((key, value) => {
    setFiltersState((prev) => {
      if (prev[key] === value) return prev
      return { ...prev, [key]: value }
    })
    // Reset to page 1 unless key is in preserveKeys
    if (!preserveKeys.includes(key)) {
      setPageState(1)
    }
  }, [preserveKeys])

  const setFilters = useCallback((updaterOrNewFilters) => {
    setFiltersState((prev) => {
      const next = typeof updaterOrNewFilters === 'function' 
        ? updaterOrNewFilters(prev) 
        : { ...prev, ...updaterOrNewFilters }
      return next
    })
    setPageState(1)
  }, [])

  const setPage = useCallback((newPage) => {
    setPageState(newPage)
  }, [])

  const setPerPage = useCallback((newPerPage) => {
    setPerPageState(newPerPage)
    setPageState(1)
  }, [])

  const resetFilters = useCallback(() => {
    const initFilters = initialFiltersRef.current
    setSearchInput('')
    setDebouncedSearch('')
    setFiltersState(initFilters)
    setPageState(1)
    if (storageKey) {
      try {
        sessionStorage.removeItem(storageKey)
      } catch (e) {}
    }
  }, [storageKey])

  // 7. Check if any filter is actively applied (excluding default pagination)
  const hasActiveFilters = useMemo(() => {
    const initFilters = initialFiltersRef.current
    if (debouncedSearch && debouncedSearch.trim() !== '') return true
    return Object.keys(initFilters).some((key) => {
      const val = filters[key]
      const defaultVal = initFilters[key]
      return val !== undefined && val !== null && val !== '' && val !== defaultVal
    })
  }, [debouncedSearch, filters])

  return {
    // Current State
    filters,
    search: searchInput,
    debouncedSearch,
    currentPage: page,
    perPage,
    hasActiveFilters,

    // Updaters
    setFilter,
    setFilters,
    setSearch: setSearchInput,
    setCurrentPage: setPage,
    setPerPage,
    resetFilters,

    // Raw params
    searchParams
  }
}

export default useTableUrlFilters

import { useState, useEffect } from 'react'

/**
 * useDebounce hook
 * Delays updating the debounced value until after the specified delay
 * has elapsed since the last time the value changed.
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce

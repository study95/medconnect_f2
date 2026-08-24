import React, { useEffect, useRef, useState } from 'react'

/**
 * ScrollReveal component — Uses IntersectionObserver API to fade in and slide elements into view as the user scrolls down.
 *
 * @param {React.ReactNode} children - The content to animate
 * @param {number} delay - Animation delay in milliseconds (default: 0)
 * @param {number} duration - Animation duration in milliseconds (default: 600)
 * @param {string} direction - 'up' | 'down' | 'left' | 'right' | 'fade' (default: 'up')
 * @param {number} distance - Movement distance in pixels (default: 24)
 * @param {string} className - Additional CSS class names
 * @param {object} style - Additional inline styles
 * @param {number} threshold - IntersectionObserver threshold (default: 0.1)
 * @param {boolean} once - Should animate only once (default: true)
 */
export default function ScrollReveal({
  children,
  delay = 0,
  duration = 600,
  direction = 'up',
  distance = 24,
  className = '',
  style = {},
  threshold = 0.1,
  once = true
}) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once && elementRef.current) {
            observer.unobserve(elementRef.current)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -30px 0px'
      }
    )

    const el = elementRef.current
    if (el) {
      observer.observe(el)
    }

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [threshold, once])

  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0)'
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}px, 0)`
      case 'down':
        return `translate3d(0, -${distance}px, 0)`
      case 'left':
        return `translate3d(-${distance}px, 0, 0)`
      case 'right':
        return `translate3d(${distance}px, 0, 0)`
      case 'fade':
      default:
        return 'translate3d(0, 0, 0)'
    }
  }

  const animatedStyle = {
    opacity: isVisible ? 1 : 0,
    transform: getTransform(),
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    // willChange: only applied before animation, released after to save GPU compositor layers
    willChange: isVisible ? 'auto' : 'opacity, transform',
    ...style
  }

  return (
    <div ref={elementRef} className={`scroll-reveal-box ${className}`} style={animatedStyle}>
      {children}
    </div>
  )
}

/**
 * Custom Hook: useScrollFade
 * Attach `ref` to any element to make it fade in on scroll.
 */
export function useScrollFade({ threshold = 0.1, delay = 0, duration = 600, distance = 24, direction = 'up', once = true } = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once && ref.current) observer.unobserve(ref.current)
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin: '0px 0px -30px 0px' }
    )

    const el = ref.current
    if (el) observer.observe(el)
    return () => {
      if (el) observer.unobserve(el)
    }
  }, [threshold, once])

  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0)'
    switch (direction) {
      case 'up': return `translate3d(0, ${distance}px, 0)`
      case 'down': return `translate3d(0, -${distance}px, 0)`
      case 'left': return `translate3d(-${distance}px, 0, 0)`
      case 'right': return `translate3d(${distance}px, 0, 0)`
      case 'fade': default: return 'translate3d(0, 0, 0)'
    }
  }

  const style = {
    opacity: isVisible ? 1 : 0,
    transform: getTransform(),
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: isVisible ? 'auto' : 'opacity, transform',
  }

  return { ref, isVisible, style }
}

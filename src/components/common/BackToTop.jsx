// A floating "↑" button that appears after scrolling 400px.
// Clicking it smoothly scrolls back to the top.
// Small UX detail that makes the app feel polished on mobile.

import { useState, useEffect } from 'react'

function BackToTop() {
  const [visible, setVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize, { passive: true })

    const handleScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  if (isMobile || !visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      style={{
        position: 'fixed',
        bottom: 30,
        right: 30,
        width: 50,
        height: 50,
        borderRadius: '16px',
        background: 'rgba(0, 168, 140, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 10px 30px rgba(0, 168, 140, 0.3)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px) rotate(5deg)'
        e.currentTarget.style.background = '#00A88C'
        e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 168, 140, 0.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) rotate(0deg)'
        e.currentTarget.style.background = 'rgba(0, 168, 140, 0.9)'
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 168, 140, 0.3)'
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
    </button>
  )
}

export default BackToTop

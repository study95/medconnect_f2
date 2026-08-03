import { useState, useCallback } from 'react'

export default function useShare() {
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareData, setShareData] = useState(null)

  const triggerShare = useCallback(async (data) => {
    const title = data?.title || 'Doctor Booklet'
    const text = data?.text || ''
    const url = data?.url || window.location.href
    const image = data?.image || ''

    const payload = { title, text, url, image }

    // Use native Web Share API if available (Mobile Chrome/Safari/supported desktop)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text ? `${title} - ${text}` : title,
          url,
        })
        return
      } catch (err) {
        // If user cancelled (AbortError) or closed native dialog, return gracefully
        if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
          return
        }
        // Fall back to custom modal if navigator.share failed unexpectedly
      }
    }

    // Fallback if Web Share API is unavailable
    setShareData(payload)
    setShareModalOpen(true)
  }, [])

  const closeShareModal = useCallback(() => {
    setShareModalOpen(false)
  }, [])

  return {
    triggerShare,
    shareModalOpen,
    shareData,
    closeShareModal
  }
}

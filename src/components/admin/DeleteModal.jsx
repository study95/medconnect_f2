// DeleteModal.jsx — Harmonized Enterprise Confirmation Dialog for Delete Actions
// 100% Backward compatible with existing props: show, title, message, onConfirm, onCancel, loading
import { useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { DIALOG_BUTTONS, DIALOG_MESSAGES } from '../../utils/dialogMessages'
import '../../styles/dialog.css'

export default function DeleteModal({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
  confirmText,
  cancelText,
}) {
  const cardRef = useRef(null)
  const confirmBtnRef = useRef(null)

  useEffect(() => {
    if (!show) return

    const timer = setTimeout(() => {
      if (confirmBtnRef.current) {
        confirmBtnRef.current.focus()
      }
    }, 50)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading && onCancel) {
        onCancel()
      } else if (e.key === 'Tab' && cardRef.current) {
        const focusableElements = cardRef.current.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [show, loading, onCancel])

  if (!show) return null

  const displayTitle = title || DIALOG_MESSAGES.DELETE_CONFIRM.title
  const displayMessage = message || DIALOG_MESSAGES.DELETE_CONFIRM.message
  const displayConfirmText = confirmText || (loading ? 'মুছে ফেলা হচ্ছে...' : DIALOG_BUTTONS.DELETE)
  const displayCancelText = cancelText || DIALOG_BUTTONS.CANCEL

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading && onCancel) {
      onCancel()
    }
  }

  return (
    <div
      className="db-dialog-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={cardRef}
        className="db-dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="db-delete-modal-title"
        aria-describedby="db-delete-modal-desc"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="db-dialog-icon-wrapper danger">
          <Trash2 size={32} strokeWidth={2.2} />
        </div>

        <h3 id="db-delete-modal-title" className="db-dialog-title">
          {displayTitle}
        </h3>

        <p id="db-delete-modal-desc" className="db-dialog-body">
          {displayMessage}
        </p>

        <div className="db-dialog-actions">
          <button
            type="button"
            className="db-dialog-btn db-dialog-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {displayCancelText}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            className="db-dialog-btn db-dialog-btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {displayConfirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

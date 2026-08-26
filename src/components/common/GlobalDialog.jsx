import { useEffect, useRef } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Trash2 } from 'lucide-react'
import { useDialog } from '../../hooks/useDialog'
import '../../styles/dialog.css'

export default function GlobalDialog() {
  const { currentDialog, handleConfirm, handleCancel, handleDismiss } = useDialog()
  const cardRef = useRef(null)
  const confirmBtnRef = useRef(null)

  // Focus trap and keyboard listener
  useEffect(() => {
    if (!currentDialog) return

    // Auto-focus confirm/ok button
    const timer = setTimeout(() => {
      if (confirmBtnRef.current) {
        confirmBtnRef.current.focus()
      }
    }, 50)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!currentDialog.preventBackdropClose) {
          handleCancel()
        }
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
  }, [currentDialog, handleCancel])

  if (!currentDialog) return null

  const { type, title, message, confirmText, cancelText, variant, autoCloseMs, preventBackdropClose } = currentDialog

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={32} strokeWidth={2.2} />
      case 'error':
        return <AlertTriangle size={32} strokeWidth={2.2} />
      case 'warning':
        return <AlertCircle size={32} strokeWidth={2.2} />
      case 'confirm':
        return variant === 'danger' ? <Trash2 size={32} strokeWidth={2.2} /> : <AlertCircle size={32} strokeWidth={2.2} />
      case 'info':
      default:
        return <Info size={32} strokeWidth={2.2} />
    }
  }

  const iconClass = type === 'confirm' ? (variant === 'danger' ? 'danger' : 'warning') : type

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !preventBackdropClose) {
      handleDismiss(false)
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
        aria-labelledby="db-dialog-title"
        aria-describedby="db-dialog-desc"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`db-dialog-icon-wrapper ${iconClass}`}>
          {getIcon()}
        </div>

        {title && (
          <h3 id="db-dialog-title" className="db-dialog-title">
            {title}
          </h3>
        )}

        {message && (
          <p id="db-dialog-desc" className="db-dialog-body">
            {message}
          </p>
        )}

        <div className="db-dialog-actions">
          {cancelText && (
            <button
              type="button"
              className="db-dialog-btn db-dialog-btn-cancel"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          )}

          <button
            ref={confirmBtnRef}
            type="button"
            className={`db-dialog-btn ${
              variant === 'danger' ? 'db-dialog-btn-danger' : 'db-dialog-btn-primary'
            }`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>

        {autoCloseMs && autoCloseMs > 0 && (
          <div
            className="db-dialog-progress-bar"
            style={{ animationDuration: `${autoCloseMs}ms` }}
          />
        )}
      </div>
    </div>
  )
}

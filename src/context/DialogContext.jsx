import { createContext, useState, useCallback, useRef, useEffect } from 'react'
import { DIALOG_BUTTONS, DIALOG_MESSAGES } from '../utils/dialogMessages'

export const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [queue, setQueue] = useState([])
  const [currentDialog, setCurrentDialog] = useState(null)
  const resolveRef = useRef(null)
  const autoCloseTimerRef = useRef(null)

  // Process next item in queue when currentDialog finishes
  useEffect(() => {
    if (!currentDialog && queue.length > 0) {
      const next = queue[0]
      setQueue((prev) => prev.slice(1))
      setCurrentDialog(next)
    }
  }, [currentDialog, queue])

  // Handle auto-close timer for success or auto-closeable dialogs
  useEffect(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
      autoCloseTimerRef.current = null
    }

    if (currentDialog && currentDialog.autoCloseMs && currentDialog.autoCloseMs > 0) {
      autoCloseTimerRef.current = setTimeout(() => {
        handleDismiss(true)
      }, currentDialog.autoCloseMs)
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current)
      }
    }
  }, [currentDialog])

  const showDialog = useCallback((config) => {
    return new Promise((resolve) => {
      const dialogItem = {
        id: Date.now() + Math.random(),
        type: config.type || 'info', // 'success' | 'error' | 'warning' | 'info' | 'confirm'
        title: config.title || '',
        message: config.message || '',
        confirmText: config.confirmText || DIALOG_BUTTONS.OK,
        cancelText: config.cancelText || (config.type === 'confirm' ? DIALOG_BUTTONS.CANCEL : null),
        variant: config.variant || (config.type === 'error' ? 'danger' : config.type === 'confirm' ? 'danger' : 'primary'),
        autoCloseMs: config.autoCloseMs ?? (config.type === 'success' ? 1800 : null),
        preventBackdropClose: config.preventBackdropClose ?? (config.type === 'confirm'),
        resolve,
      }

      setQueue((prev) => [...prev, dialogItem])
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
    }
    if (currentDialog?.resolve) {
      currentDialog.resolve(true)
    }
    setCurrentDialog(null)
  }, [currentDialog])

  const handleCancel = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
    }
    if (currentDialog?.resolve) {
      currentDialog.resolve(false)
    }
    setCurrentDialog(null)
  }, [currentDialog])

  const handleDismiss = useCallback((resolvedValue = true) => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
    }
    if (currentDialog?.resolve) {
      currentDialog.resolve(resolvedValue)
    }
    setCurrentDialog(null)
  }, [currentDialog])

  // Convenience helper methods
  const confirm = useCallback((options = {}) => {
    return showDialog({
      type: 'confirm',
      title: options.title || DIALOG_MESSAGES.DELETE_CONFIRM.title,
      message: options.message || DIALOG_MESSAGES.DELETE_CONFIRM.message,
      confirmText: options.confirmText || DIALOG_BUTTONS.DELETE,
      cancelText: options.cancelText || DIALOG_BUTTONS.CANCEL,
      variant: options.variant || 'danger',
      preventBackdropClose: options.preventBackdropClose ?? true,
      autoCloseMs: null,
    })
  }, [showDialog])

  const showSuccess = useCallback((options = {}) => {
    const defaultData = typeof options === 'string' ? { message: options } : options
    return showDialog({
      type: 'success',
      title: defaultData.title || DIALOG_MESSAGES.SUCCESS.title,
      message: defaultData.message || DIALOG_MESSAGES.SUCCESS.message,
      confirmText: defaultData.confirmText || DIALOG_BUTTONS.OK,
      variant: 'primary',
      autoCloseMs: defaultData.autoCloseMs ?? 1800,
    })
  }, [showDialog])

  const showError = useCallback((options = {}) => {
    const defaultData = typeof options === 'string' ? { message: options } : options
    return showDialog({
      type: 'error',
      title: defaultData.title || DIALOG_MESSAGES.ERROR.title,
      message: defaultData.message || DIALOG_MESSAGES.ERROR.message,
      confirmText: defaultData.confirmText || DIALOG_BUTTONS.OK,
      variant: 'danger',
      autoCloseMs: null,
    })
  }, [showDialog])

  const showWarning = useCallback((options = {}) => {
    const defaultData = typeof options === 'string' ? { message: options } : options
    return showDialog({
      type: 'warning',
      title: defaultData.title || 'সতর্কতা',
      message: defaultData.message || '',
      confirmText: defaultData.confirmText || DIALOG_BUTTONS.CONFIRM,
      cancelText: defaultData.cancelText || DIALOG_BUTTONS.CANCEL,
      variant: 'primary',
      autoCloseMs: null,
    })
  }, [showDialog])

  const showInfo = useCallback((options = {}) => {
    const defaultData = typeof options === 'string' ? { message: options } : options
    return showDialog({
      type: 'info',
      title: defaultData.title || 'তথ্য',
      message: defaultData.message || '',
      confirmText: defaultData.confirmText || DIALOG_BUTTONS.OK,
      variant: 'primary',
      autoCloseMs: defaultData.autoCloseMs ?? null,
    })
  }, [showDialog])

  const contextValue = {
    currentDialog,
    showDialog,
    confirm,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    handleConfirm,
    handleCancel,
    handleDismiss,
  }

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  )
}

import { useContext } from 'react'
import { DialogContext } from '../context/DialogContext'

const defaultDialog = {
  showDialog: () => Promise.resolve(false),
  confirm: () => Promise.resolve(false),
  alert: () => Promise.resolve(),
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    return defaultDialog
  }
  return context
}

export default useDialog

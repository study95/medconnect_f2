let pendingPromise = null

/**
 * Trigger the global SudoVerifyModal and return a Promise that resolves when
 * the user completes password/2FA verification, or rejects if cancelled.
 */
export function requestSudoVerification(requires2fa = false) {
  if (pendingPromise) {
    return pendingPromise
  }

  pendingPromise = new Promise((resolve, reject) => {
    window.dispatchEvent(
      new CustomEvent('sudo-verify-requested', {
        detail: {
          requires2fa,
          resolve: () => {
            pendingPromise = null
            resolve(true)
          },
          reject: (err) => {
            pendingPromise = null
            reject(err || new Error('Sudo verification cancelled'))
          },
        },
      })
    )
  })

  return pendingPromise
}

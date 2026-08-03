// WHY ERROR BOUNDARIES?
// If ANY component crashes (e.g. unexpected API response shape,
// null reference, network error), normally the ENTIRE page goes blank.
// An Error Boundary "catches" the crash and shows a friendly message
// instead of a white screen.
//
// HOW IT WORKS:
// React has a special lifecycle: componentDidCatch().
// This ONLY works as a class component (not a hook) — this is one
// of the few places in modern React where you MUST use a class.
// We wrap sections of the UI in <ErrorBoundary> and if anything
// inside crashes, ErrorBoundary catches it and renders a fallback.
//
// USAGE:
//   <ErrorBoundary>
//     <SomeComponent />
//   </ErrorBoundary>

import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  // Called when a child component throws an error
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  // Called after the error is caught — good place for logging
  componentDidCatch(error, info) {
    // In production you would send this to a logging service
    // e.g. Sentry.captureException(error)
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      // Show a friendly fallback UI
      return (
        <div
          style={{
            background: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: 16,
            padding: '32px 24px',
            textAlign: 'center',
            margin: '16px 0',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h5 style={{ fontWeight: 700, color: '#c53030', marginBottom: 8 }}>
            Something went wrong
          </h5>
          <p style={{ color: '#742a2a', fontSize: 14, marginBottom: 20 }}>
            {this.props.message || 'This section failed to load. Please try refreshing the page.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: '#c53030', color: 'white', border: 'none',
              borderRadius: 8, padding: '8px 20px',
              fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

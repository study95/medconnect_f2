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
      // Show a friendly, polished fallback UI
      return (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #FEE2E2',
            borderRadius: 16,
            padding: '36px 24px',
            textAlign: 'center',
            margin: '20px auto',
            maxWidth: 520,
            boxShadow: '0 4px 20px -2px rgba(239, 68, 68, 0.05)',
            fontFamily: "'Hind Siliguri', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: '#FEF2F2',
              border: '1px solid #FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 24,
            }}
          >
            🛡️
          </div>
          <h5 style={{ fontWeight: 700, color: '#1E293B', fontSize: 18, marginBottom: 8 }}>
            সাময়িক ত্রুটি দেখা দিয়েছে
          </h5>
          <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 20px' }}>
            {this.props.message || 'এই সেকশনটি লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: '#0B192C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 22px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s ease',
            }}
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// WHY THIS FILE EXISTS:
// In a normal website, clicking a link loads a new HTML page
// and the browser scrolls to the top automatically.
// In React (Single Page App), the "page" never actually reloads —
// React just swaps out components. This means the scroll position
// stays wherever it was on the previous page.
//
// This tiny component fixes that: it watches the URL and whenever
// it changes, it scrolls to the top.
//
// USAGE: Place <ScrollToTop /> once inside <BrowserRouter> in App.jsx.

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  // Renders nothing — this is a "behavior-only" component
  return null
}

export default ScrollToTop

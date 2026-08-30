// WHY THIS FILE EXISTS:
// This is the VERY FIRST file React runs.
// It mounts your entire app into the <div id="root"> in index.html.
// We wrap everything with:
//   - BrowserRouter → enables URL routing (React Router)
//   - AuthProvider  → makes login state available everywhere

import React from 'react'
import ReactDOM from 'react-dom/client'

// Bootstrap CSS — must be imported before your own CSS
// so your custom styles can override Bootstrap if needed
import 'bootstrap/dist/css/bootstrap.min.css'
// Note: bootstrap.bundle.min.js is NOT imported here.
// react-bootstrap handles all Bootstrap interactivity (modals, dropdowns, tooltips, etc.)
// without requiring the vanilla Bootstrap JS bundle. Removing it saves ~22KB.

// Swiper CSS for sliders
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Your global styles
import './index.css'

import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import { ThemeProvider } from './context/ThemeContext'
import { DialogProvider } from './context/DialogContext'
import App from './App'

// ─── GLOBAL DOM WORKAROUND ──────────────────────────────────────────────────
// WHY: Some browser extensions (like IDM or Google Translate) modify the DOM.
// If React tries to remove a node that an extension already moved or deleted,
// React 18 throws a fatal 'NotFoundError' and crashes the whole app.
// This patch makes removeChild and insertBefore "safe" by checking parentage.
if (typeof Node !== 'undefined' && Node.prototype.removeChild) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child.parentNode !== this) {
      if (console) {
        console.warn('DOM: Attempted to remove a child from a different parent. Skipping to prevent crash.', child, this);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };
}

if (typeof Node !== 'undefined' && Node.prototype.insertBefore) {
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        console.warn('DOM: Attempted to insert before a node with a different parent. Skipping to prevent crash.', referenceNode, this);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <FavoritesProvider>
              <SubscriptionProvider>
                <DialogProvider>
                  <App />
                </DialogProvider>
              </SubscriptionProvider>
            </FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)



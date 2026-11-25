import DOMPurify from 'dompurify'

/**
 * Strict DOMPurify-backed client-side HTML sanitizer to prevent Stored & DOM XSS
 * when rendering rich notification, announcement, or CMS HTML content.
 *
 * Security invariants:
 *  - Forbids `style`, `on*` event handlers, `data-*` attributes, `svg`, `math`, `iframe`, `script`, `form`
 *  - Rejects `javascript:`, `vbscript:`, `data:`, and protocol-relative (`//`) URLs
 *  - Enforces `rel="noopener noreferrer"` on all anchor tags
 */
const ALLOWED_TAGS = [
  'div', 'span', 'p', 'br', 'hr',
  'strong', 'b', 'i', 'em', 'u', 's', 'small', 'sub', 'sup',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'title']

let hooksRegistered = false
function ensureDomPurifyHooks() {
  if (hooksRegistered || typeof window === 'undefined' || !DOMPurify?.addHook) return
  hooksRegistered = true

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href')
      if (href !== null) {
        const safe = safeAnchorHref(href)
        if (!safe) {
          node.removeAttribute('href')
        } else {
          node.setAttribute('href', safe)
        }
      }
      if (node.getAttribute('target') && !['_blank', '_self'].includes(node.getAttribute('target'))) {
        node.removeAttribute('target')
      }
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

function safeAnchorHref(rawHref) {
  if (!rawHref || typeof rawHref !== 'string') return null
  const trimmed = rawHref.trim()
  // Collapse control chars and whitespace before scheme checks
  const collapsed = trimmed.replace(/[\u0000-\u0020]+/g, '')
  const lower = collapsed.toLowerCase()
  if (!collapsed || collapsed.startsWith('//')) return null
  if (collapsed.startsWith('/') || collapsed.startsWith('#')) return trimmed
  if (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:')
  ) {
    return trimmed
  }
  return null
}

export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return ''
  try {
    ensureDomPurifyHooks()
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: [
        'script', 'style', 'svg', 'math', 'iframe', 'frame', 'frameset',
        'object', 'embed', 'applet', 'link', 'meta', 'base', 'form',
        'input', 'button', 'select', 'textarea', 'template', 'noscript',
        'audio', 'video', 'source', 'track', 'canvas', 'dialog',
      ],
      FORBID_ATTR: ['style', 'srcdoc', 'formaction'],
    })
  } catch (err) {
    console.error('Failed to sanitize HTML:', err)
    return ''
  }
}

/**
 * Strictly validate an external HTTP(S) URL for dynamic `href` / `window.open` / redirects.
 * Rejects `javascript:`, `vbscript:`, `data:`, `file:`, and protocol-relative `//` payloads.
 */
export function safeHttpUrl(rawUrl, fallback = null) {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback
  const trimmed = rawUrl.trim()
  if (!trimmed || trimmed.startsWith('//')) return fallback

  const collapsed = trimmed.replace(/[\u0000-\u0020]+/g, '')
  if (/^(?:javascript|vbscript|data|file):/i.test(collapsed)) {
    return fallback
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href
    }
    return fallback
  } catch {
    return fallback
  }
}

/**
 * Strictly validate an internal SPA relative redirect path (prevents Open Redirects).
 * Accepts ONLY single-slash relative paths like `/admin/dashboard` (blocks `//evil.com`, `https://evil.com`, `/\evil.com`).
 */
export function safeRelativeRedirect(rawTarget, fallback = '/admin/dashboard') {
  if (!rawTarget || typeof rawTarget !== 'string') return fallback
  const trimmed = rawTarget.trim()
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('\r') ||
    trimmed.includes('\n') ||
    /[\u0000-\u001F]/.test(trimmed)
  ) {
    return fallback
  }
  return trimmed
}

/**
 * Escape plain text before interpolating into HTML templates (prevents DOM XSS).
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

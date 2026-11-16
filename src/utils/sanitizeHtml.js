/**
 * Strict allowlist-based client-side HTML sanitizer to prevent Stored & DOM XSS
 * when rendering rich notification/announcement HTML messages.
 */
const ALLOWED_TAGS = new Set([
  'div', 'span', 'p', 'br', 'hr',
  'strong', 'b', 'i', 'em', 'u', 's', 'small', 'sub', 'sup',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

const DROP_COMPLETELY_TAGS = new Set([
  'script', 'style', 'svg', 'math', 'iframe', 'frame', 'frameset',
  'object', 'embed', 'applet', 'link', 'meta', 'base', 'form',
  'input', 'button', 'select', 'textarea', 'template', 'noscript',
  'audio', 'video', 'source', 'track', 'canvas', 'dialog',
]);

const ALLOWED_ATTRS = new Set(['href', 'target', 'rel', 'class', 'style', 'title']);

export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Completely remove dangerous executable / active content elements
    DROP_COMPLETELY_TAGS.forEach((tag) => {
      doc.querySelectorAll(tag).forEach((el) => el.remove());
    });

    // 2. Walk all remaining elements and enforce tag & attribute allowlists
    const allElements = Array.from(doc.body.querySelectorAll('*'));
    allElements.forEach((el) => {
      const tagName = el.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tagName)) {
        // Unwrap unknown formatting tags while keeping safe text children, or remove if detached
        if (el.parentNode) {
          while (el.firstChild) {
            el.parentNode.insertBefore(el.firstChild, el);
          }
          el.parentNode.removeChild(el);
        } else {
          el.remove();
        }
        return;
      }

      // Filter attributes against strict allowlist
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const rawVal = attr.value || '';
        // Normalize control characters and whitespace for protocol checks
        const normalizedVal = rawVal.replace(/[\u0000-\u0020]+/g, '').toLowerCase();

        if (!ALLOWED_ATTRS.has(name)) {
          el.removeAttribute(attr.name);
          return;
        }

        if (name === 'href') {
          const isSafeHref =
            normalizedVal.startsWith('http://') ||
            normalizedVal.startsWith('https://') ||
            normalizedVal.startsWith('mailto:') ||
            normalizedVal.startsWith('tel:') ||
            normalizedVal.startsWith('/') ||
            normalizedVal.startsWith('#');

          if (!isSafeHref) {
            el.removeAttribute(attr.name);
            return;
          }
        }

        if (name === 'style') {
          if (
            normalizedVal.includes('expression(') ||
            normalizedVal.includes('javascript:') ||
            normalizedVal.includes('vbscript:') ||
            normalizedVal.includes('data:') ||
            normalizedVal.includes('url(') ||
            normalizedVal.includes('-moz-binding') ||
            normalizedVal.includes('behavior:')
          ) {
            el.removeAttribute(attr.name);
            return;
          }
        }
      });

      if (tagName === 'a') {
        el.setAttribute('rel', 'noopener noreferrer');
      }
    });

    return doc.body.innerHTML;
  } catch (err) {
    console.error('Failed to sanitize HTML:', err);
    return '';
  }
}

/**
 * Escape plain text before interpolating into HTML templates (prevents DOM XSS).
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

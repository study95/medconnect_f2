/**
 * Client-side HTML sanitizer to prevent Stored XSS when rendering HTML messages.
 * Uses DOMParser to safely parse and strip scripts, dangerous tags, and event handlers.
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove dangerous executable and external resource tags
    const disallowedTags = ['script', 'object', 'embed', 'iframe', 'style', 'link', 'meta', 'base', 'form', 'input', 'button', 'select'];
    disallowedTags.forEach(tag => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach(el => el.remove());
    });

    // Strip inline event listeners (on*) and javascript: URIs
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.toLowerCase().startsWith('on')) {
          el.removeAttribute(attr.name);
        }
        if (
          (attr.name === 'href' || attr.name === 'src' || attr.name === 'action') &&
          attr.value.trim().toLowerCase().startsWith('javascript:')
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  } catch (err) {
    console.error('Failed to sanitize HTML:', err);
    return '';
  }
}

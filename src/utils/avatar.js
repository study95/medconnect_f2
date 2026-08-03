// WHY THIS FILE EXISTS:
// We use dynamic colored avatars for doctors and users who don't have a photo.
// These utility functions ensure that "Dr. John" always gets the exact same color
// everywhere in the app, rather than a random color on every render.
// Centralizing this prevents copy-pasting the same logic across 5 different pages.

const AVATAR_COLORS = [
  '#00A88C', '#00C9A7', '#7C3AED', '#DB2777',
  '#D97706', '#059669', '#DC2626', '#2563EB',
]

/**
 * Returns a consistent hex color from the AVATAR_COLORS array.
 * @param {string|number} identifier - A user ID (number) or user Name (string)
 */
export function getColor(identifier) {
  if (typeof identifier === 'number') {
    return AVATAR_COLORS[(identifier || 0) % AVATAR_COLORS.length]
  }
  
  // If it's a string (like a user name), generate a hash
  const str = identifier || ''
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/**
 * Returns the first two initials of a name. (e.g. "John Doe" -> "JD")
 * @param {string} name 
 */
export function getInitials(name = '') {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

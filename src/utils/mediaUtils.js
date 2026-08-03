// src/utils/mediaUtils.js

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// By default, removing '/api' gives us the base domain. 
// If your backend serves storage files from a different path, adjust here.
const BASE_DOMAIN = API_BASE.replace('/api', '');

/**
 * Ensures a media URL is absolute.
 * @param {string} path - The media path from the database (e.g. 'storage/doctors/img.jpg').
 * @param {string} fallback - The fallback image URL.
 * @returns {string} The full absolute URL.
 */
export const getMediaUrl = (path, fallback = '') => {
  if (!path) return fallback;
  
  // If it's already an absolute URL (http://, https://, data:, blob:), return it
  if (/^(http|https|data|blob):/i.test(path)) {
    return path;
  }
  
  // Clean up leading slashes to prevent double slashes like http://127.0.0.1:8000//storage/...
  const cleanPath = path.replace(/^\/+/, '');
  
  // Check if the backend is already adding 'storage/' to the path or not.
  // We just append the path to the base domain.
  return `${BASE_DOMAIN}/${cleanPath}`;
};

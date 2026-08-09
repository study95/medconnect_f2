// src/utils/mediaUtils.js

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// By default, removing '/api' gives us the base domain. 
const BASE_DOMAIN = API_BASE.replace('/api', '');

/**
 * Ensures a media URL is absolute and correctly points to backend storage.
 * @param {string} path - The media path from the database (e.g. 'doctors/img.jpg' or 'storage/doctors/img.jpg').
 * @param {string} fallback - The fallback image URL.
 * @returns {string} The full absolute URL.
 */
export const getMediaUrl = (path, fallback = '') => {
  if (!path) return fallback;
  
  // Data URLs or Blob URLs
  if (/^(data|blob):/i.test(path)) {
    return path;
  }
  
  // If it's already an absolute HTTP/HTTPS URL
  if (/^https?:\/\//i.test(path)) {
    // Normalize localhost / 127.0.0.1 hostnames to match current BASE_DOMAIN
    return path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, BASE_DOMAIN);
  }
  
  // Clean up leading slashes
  let cleanPath = path.replace(/^\/+/, '');
  
  // Prepend 'storage/' if it's missing from relative path
  if (!cleanPath.toLowerCase().startsWith('storage/')) {
    cleanPath = `storage/${cleanPath}`;
  }
  
  return `${BASE_DOMAIN}/${cleanPath}`;
};


// src/utils/mediaUtils.js

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// By default, removing '/api' gives us the base domain. 
const BASE_DOMAIN = API_BASE.replace('/api', '');

// Cloudflare R2 Public CDN / Bucket URL
const R2_BASE = import.meta.env.VITE_R2_URL || 'https://pub-48d5472a27c44c82a8eaefd7a6ab968b.r2.dev';

export const DEFAULT_DOCTOR_AVATAR = '/images/default-doctor.png';
export const DEFAULT_HOSPITAL_IMAGE = '/images/default-hospital.png';

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
    // If it points to an unintended /storage/favicon.png or /storage/doctorBookletLogo.png, restore to static
    if (path.includes('/storage/favicon.png')) return '/favicon.png';
    if (path.includes('/storage/doctorBookletLogo.png')) return '/doctorBookletLogo.png';
    // If it points to Cloudflare R2 raw private API endpoint, convert to public R2 CDN URL
    if (path.includes('.r2.cloudflarestorage.com/')) {
      const parts = path.split('.r2.cloudflarestorage.com/');
      let sub = parts[1] ? parts[1].split('?')[0] : '';
      sub = sub.replace(/^[^/]+\//, ''); // strip bucket name prefix
      return `${R2_BASE}/${sub}`;
    }
    // Normalize localhost / 127.0.0.1 hostnames to match current BASE_DOMAIN
    return path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, BASE_DOMAIN);
  }

  // If it's a static frontend asset (starts with '/' and not '/storage/')
  if (path.startsWith('/') && !path.toLowerCase().startsWith('/storage/')) {
    return path;
  }
  
  // Clean up leading slashes
  let cleanPath = path.replace(/^\/+/, '');
  
  // Specific compatibility alias
  if (cleanPath === '3ce2457a9880b2ad120ada30e06a725c.jpg') {
    return `${R2_BASE}/onboarding/hospital_trade_license/2026/11/7937b2de-2030-42b9-996b-dfaf1d168ba1.jpg`;
  }

  // Cloudflare R2 files (onboarding documents, credentials)
  if (cleanPath.startsWith('onboarding/')) {
    return `${R2_BASE}/${cleanPath}`;
  }

  // Prepend 'storage/' if it's missing from relative path
  if (!cleanPath.toLowerCase().startsWith('storage/')) {
    cleanPath = `storage/${cleanPath}`;
  }
  
  return `${BASE_DOMAIN}/${cleanPath}`;
};


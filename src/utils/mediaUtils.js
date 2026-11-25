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
  
  // Data image URLs or Blob URLs only (reject data:text/html or javascript: schemes)
  if (/^(blob:|data:image\/(png|jpe?g|webp|gif|avif|bmp);)/i.test(path)) {
    return path;
  }
  if (/^(data|javascript|vbscript):/i.test(path.trim())) {
    return fallback;
  }
  
  // If it's already an absolute HTTP/HTTPS URL
  if (/^https?:\/\//i.test(path)) {
    // If it points to an unintended /storage/favicon.png or /storage/doctorBookletLogo.png, restore to static
    if (path.includes('/storage/favicon.png')) return '/favicon.png';
    if (path.includes('/storage/doctorBookletLogo.png')) return '/doctorBookletLogo.png';

    // Preserve SigV4 presigned private R2/S3 URLs and signed private local document stream URLs untouched
    if (path.includes('X-Amz-Signature=') || path.includes('/documents/private-stream')) {
      return path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, BASE_DOMAIN);
    }

    // Legacy unsigned raw R2 URL: only map non-KYC public media to public R2 CDN
    if (path.includes('.r2.cloudflarestorage.com/')) {
      const parts = path.split('.r2.cloudflarestorage.com/');
      let sub = parts[1] ? parts[1].split('?')[0] : '';
      sub = sub.replace(/^[^/]+\//, ''); // strip bucket name prefix
      if (sub.startsWith('verification_docs/') || sub.startsWith('onboarding/') || sub.startsWith('backups/')) {
        return fallback;
      }
      return `${R2_BASE}/${sub}`;
    }
    // Normalize localhost / 127.0.0.1 hostnames to match current BASE_DOMAIN
    return path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, BASE_DOMAIN);
  }

  // Reject protocol-relative URLs like //evil.com
  if (path.startsWith('//')) {
    return fallback;
  }

  // If it's a static frontend asset (starts with '/' and not '/storage/')
  if (path.startsWith('/') && !path.toLowerCase().startsWith('/storage/')) {
    return path;
  }
  
  // Clean up leading slashes
  let cleanPath = path.replace(/^\/+/, '');

  // Never route private KYC / onboarding / backup relative keys to public CDN
  if (
    cleanPath.startsWith('verification_docs/') ||
    cleanPath.startsWith('onboarding/') ||
    cleanPath.startsWith('backups/')
  ) {
    return fallback;
  }

  // Prepend 'storage/' if it's missing from relative path
  if (!cleanPath.toLowerCase().startsWith('storage/')) {
    cleanPath = `storage/${cleanPath}`;
  }
  
  return `${BASE_DOMAIN}/${cleanPath}`;
};


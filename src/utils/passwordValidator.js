/**
 * Validate password against the enterprise strong password policy:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 *
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export function validateStrongPassword(password) {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'পাসওয়ার্ডটি কমপক্ষে ৮ অক্ষরের হতে হবে।',
    }
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'পাসওয়ার্ডে অন্তত একটি বড় হাতের (A-Z) এবং একটি ছোট হাতের (a-z) অক্ষর থাকতে হবে।',
    }
  }

  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: 'পাসওয়ার্ডে অন্তত একটি সংখ্যা (0-9) থাকতে হবে।',
    }
  }

  return { valid: true, message: '' }
}

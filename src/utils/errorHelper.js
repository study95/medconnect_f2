/**
 * Translates error/notification strings into clear, user-friendly Bangla.
 */
export const translateToBangla = (msg, fallback = 'তথ্য প্রক্রিয়াকরণে সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।') => {
  if (!msg) return fallback;
  if (typeof msg !== 'string') return fallback;

  // If message already contains Bangla characters, return it directly
  if (/[\u0980-\u09FF]/.test(msg)) {
    return msg;
  }

  const lower = msg.toLowerCase();

  // Server error / HTTP status codes
  if (
    lower.includes('status code 500') ||
    lower.includes('500 internal') ||
    lower.includes('internal server error') ||
    lower.includes('server error') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504')
  ) {
    return 'সার্ভারে সাময়িক কারিগরি সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }

  if (lower.includes('status code 404') || lower.includes('not found')) {
    return 'অনুরোধকৃত তথ্যটি পাওয়া যায়নি।';
  }

  if (lower.includes('status code 403') || lower.includes('forbidden')) {
    return 'আপনার এই তথ্য দেখার অনুমতি নেই।';
  }

  if (lower.includes('status code 401') || lower.includes('unauthorized') || lower.includes('unauthenticated')) {
    return 'অনুগ্রহ করে পুনরায় লগইন করে চেষ্টা করুন।';
  }

  if (lower.includes('request failed') || lower.includes('failed to load') || lower.includes('timeout') || lower.includes('aborted')) {
    return 'সার্ভার থেকে তথ্য লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
  }

  // Network / Connection errors
  if (lower.includes('network error') || lower.includes('failed to fetch') || lower.includes('econnrefused') || lower.includes('connection refused')) {
    return 'সার্ভারের সাথে সংযোগ করা যাচ্ছে না। আপনার ইন্টারনেট সংযোগ চেক করুন অথবা কিছুক্ষণ পর চেষ্টা করুন।';
  }

  // Mobile / Phone already registered
  if ((lower.includes('mobile') || lower.includes('phone') || lower.includes('number')) && (lower.includes('already') || lower.includes('exist') || lower.includes('registered') || lower.includes('duplicate') || lower.includes('taken'))) {
    return 'এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত! অনুগ্রহ করে লগইন করুন।';
  }

  // Email already registered
  if (lower.includes('email') && (lower.includes('already') || lower.includes('exist') || lower.includes('registered') || lower.includes('duplicate') || lower.includes('taken'))) {
    return 'এই ইমেইল ঠিকানাটি ইতিমধ্যে নিবন্ধিত! অনুগ্রহ করে লগইন করুন।';
  }

  // Role mismatch / Account type conflict
  if (lower.includes('role') || (lower.includes('registered as') && (lower.includes('doctor') || lower.includes('patient')))) {
    return 'এই নম্বরটি ইতিমধ্যে অন্য অ্যাকাউন্টের ধরন হিসেবে নিবন্ধিত।';
  }

  // Mobile format / length
  if (lower.includes('mobile') && (lower.includes('format') || lower.includes('invalid') || lower.includes('regex'))) {
    return 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।';
  }

  // Credentials mismatch
  if (lower.includes('credential') || lower.includes('match') || lower.includes('invalid email or password')) {
    return 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।';
  }

  // Password errors
  if (lower.includes('password') && (lower.includes('short') || lower.includes('at least') || lower.includes('min'))) {
    const numMatch = msg.match(/(\d+)/);
    const minLen = numMatch ? numMatch[1] : '৬';
    const banglaDigits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    const banglaLen = String(minLen).replace(/\d/g, d => banglaDigits[d] || d);
    return `পাসওয়ার্ডটি কমপক্ষে ${banglaLen} অক্ষরের হতে হবে।`;
  }

  // OTP errors
  if (lower.includes('otp') || lower.includes('code') || lower.includes('sms')) {
    if (lower.includes('sent')) return 'OTP সফলভাবে পাঠানো হয়েছে!';
    if (lower.includes('invalid') || lower.includes('incorrect') || lower.includes('wrong') || lower.includes('ভুল') || lower.includes('সঠিক নয়') || lower.includes('সঠিক নয়')) return 'ভুল OTP কোড! সঠিক OTP কোডটি লিখুন।';
    if (lower.includes('expired')) return 'OTP কোডের মেয়াদ শেষ হয়েছে। পুনরায় OTP পাঠান।';
    if (lower.includes('failed') || lower.includes('unable')) return 'OTP পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে মোবাইল নম্বর চেক করে আবার চেষ্টা করুন।';
  }

  // Validation generic
  if (lower.includes('given data was invalid') || lower.includes('validation error') || lower.includes('field is required')) {
    return 'অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।';
  }

  // Rate limiting / Too many attempts
  if (lower.includes('too many') || lower.includes('attempts') || lower.includes('throttle')) {
    return 'অতিরিক্ত চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }

  // Duplicate database entry fallback
  if (lower.includes('duplicate entry') || lower.includes('sqlstate[23000]')) {
    return 'এই তথ্যটি (মোবাইল বা ইমেইল) ইতিমধ্যে সিস্টেমে বিদ্যমান।';
  }

  // General registration error
  if (lower.includes('registration failed') || lower.includes('register')) {
    return 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।';
  }

  // Default fallback in Bangla if unhandled English string
  return fallback;
};

export const getErrorMessage = (error, fallback = 'তথ্য প্রক্রিয়াকরণে সমস্যা হচ্ছে। অনুগ্রহ করে আপনার তথ্য পরীক্ষা করে আবার চেষ্টা করুন।') => {
  if (!error) return fallback;

  // If passed directly as a string
  if (typeof error === 'string') {
    return translateToBangla(error, fallback);
  }

  const status = error?.response?.status;
  const data = error?.response?.data;

  // 1. Server errors (500, 502, 503, 504) - give a friendly clean message instead of exposing server details
  if (status >= 500) {
    return 'সার্ভারে সাময়িক কারিগরি সমস্যা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
  }

  // 2. Specific validation errors (Laravel style)
  if (data?.errors && typeof data.errors === 'object') {
    const errorMessages = Object.values(data.errors).flat();
    if (errorMessages.length > 0) {
      const firstMsg = errorMessages[0];
      return translateToBangla(firstMsg, fallback);
    }
  }

  // 3. Check for main message or error property
  const mainMessage = data?.message || data?.error || '';
  if (mainMessage && typeof mainMessage === 'string' && !mainMessage.includes('SQLSTATE') && !mainMessage.includes('Stack trace')) {
    return translateToBangla(mainMessage, fallback);
  }

  // 4. Status-based fallback messages
  if (status === 401) return 'অনুগ্রহ করে পুনরায় লগইন করুন।';
  if (status === 403) return 'এই কাজটি করার অনুমতি নেই।';
  if (status === 404) return 'অনুরোধকৃত তথ্য পাওয়া যায়নি।';
  if (status === 409) return 'এই তথ্যটি ইতিমধ্যে সিস্টেমে বিদ্যমান।';
  if (status === 422) return 'প্রদত্ত তথ্য সঠিক নয়। অনুগ্রহ করে সকল ফিল্ড পরীক্ষা করুন।';
  if (status === 429) return 'অতিরিক্ত অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।';

  // 5. If no response (network down, timeout, CORS error)
  const msg = error?.message || '';
  if (msg) {
    return translateToBangla(msg, fallback);
  }

  // 6. Final fallback
  return fallback;
};

/**
 * Translates error/notification strings into clear, user-friendly Bangla.
 */
export const translateToBangla = (msg, fallback = 'একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে।') => {
  if (!msg) return fallback;
  if (typeof msg !== 'string') return fallback;

  // If message already contains Bangla characters, return it directly
  if (/[\u0980-\u09FF]/.test(msg)) {
    return msg;
  }

  const lower = msg.toLowerCase();

  // Mobile / Phone already registered
  if ((lower.includes('mobile') || lower.includes('phone') || lower.includes('number')) && (lower.includes('already') || lower.includes('exist') || lower.includes('registered') || lower.includes('duplicate'))) {
    return 'এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত! অনুগ্রহ করে লগইন করুন।';
  }

  // Email already registered
  if (lower.includes('email') && (lower.includes('already') || lower.includes('exist') || lower.includes('registered') || lower.includes('duplicate'))) {
    return 'এই ইমেইল ঠিকানাটি ইতিমধ্যে নিবন্ধিত! অনুগ্রহ করে লগইন করুন।';
  }

  // Credentials mismatch / Unauthorized
  if (lower.includes('credential') || lower.includes('match') || lower.includes('unauthorized') || lower.includes('unauthenticated') || lower.includes('invalid email or password')) {
    return 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।';
  }

  // Password errors
  if (lower.includes('password') && (lower.includes('short') || lower.includes('at least') || lower.includes('min'))) {
    // Extract the number from the message (e.g., "must be at least 12 characters")
    const numMatch = msg.match(/(\d+)/);
    const minLen = numMatch ? numMatch[1] : '৬';
    // Convert to Bangla digits
    const banglaDigits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    const banglaLen = String(minLen).replace(/\d/g, d => banglaDigits[d] || d);
    return `পাসওয়ার্ডটি কমপক্ষে ${banglaLen} অক্ষরের হতে হবে।`;
  }

  // OTP errors
  if (lower.includes('otp') || lower.includes('code')) {
    if (lower.includes('sent')) return 'OTP সফলভাবে পাঠানো হয়েছে!';
    if (lower.includes('invalid') || lower.includes('incorrect') || lower.includes('wrong')) return 'OTP কোডটি সঠিক নয়। আবার চেষ্টা করুন।';
    if (lower.includes('expired')) return 'OTP কোডের মেয়াদ শেষ হয়েছে। পুনরায় পাঠান।';
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
  return 'এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত! অনুগ্রহ করে লগইন করুন।';
};

export const getErrorMessage = (error, fallback = 'একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে।') => {
  if (!error?.response) {
    return translateToBangla(error?.message, fallback);
  }

  const { data } = error.response;

  // 1. Check for specific validation errors (Laravel style)
  if (data?.errors && typeof data.errors === 'object') {
    const errorMessages = Object.values(data.errors).flat();
    if (errorMessages.length > 0) {
      return translateToBangla(errorMessages[0], fallback);
    }
  }

  // 2. Check for main message or error property
  let mainMessage = data?.message || data?.error || '';
  if (mainMessage) {
    return translateToBangla(mainMessage, fallback);
  }

  // 3. Fallback
  return fallback;
};

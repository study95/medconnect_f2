import axiosInstance from '../api/axiosInstance'

const INITIAL_CONTENT = {
  // ── SITE SETTINGS ──────────────────────────────
  site: {
    name: 'Doctor Booklet Bangladesh',
    tagline: 'ডিজিটাল স্বাস্থ্যসেবার নতুন অভিজ্ঞতা',
    phone: '017 XXXX XXXX',
    phone_secondary: '(প্রিমিয়াম সদস্যরা সকাল ৮টা - রাত ১০টা)',
    email: 'info@doctorbooklet.com.bd',
    email_support: 'support@doctorbooklet.com.bd',
    website: 'www.doctorbooklet.com.bd',
    address: 'মেডকানেক্ট কমপ্লেক্স, বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা-১২০৫',
    office_hours: 'শনিবার - বৃহস্পতিবার: সকাল ৯টা - রাত ৮টা | শুক্রবার: সকাল ১০টা - বিকাল ৫টা',
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    twitter: 'https://x.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    copyright: '© ২০২৬ Doctor Booklet Bangladesh. সকল অধিকার সংরক্ষিত।',
  },

  // ── HERO SECTION (Home page) ─────────────────
  hero: {
    badge: 'বাংলাদেশের এক নম্বর স্বাস্থ্যসেবা প্ল্যাটফর্ম',
    title: 'স্বাগত ডক্টর বুকলেটে- বিশ্বস্ত ডাক্তার খুঁজুন, সহজে অ্যাপয়েন্টমেন্ট নিন',
    title_line1: 'স্বাগত ডক্টর বুকলেটে- বিশ্বস্ত ডাক্তার খুঁজুন, সহজে অ্যাপয়েন্টমেন্ট নিন',
    title_line2: '',
    subtitle: 'বাংলাদেশের অভিজ্ঞ ও যাচাইকৃত বিশেষজ্ঞ ডাক্তার, হাসপাতাল এবং চেম্বার খুঁজে মাত্র কয়েক ক্লিকেই অ্যাপয়েন্টমেন্ট বুক করুন—দ্রুত, নিরাপদ এবং সম্পূর্ণ ঝামেলামুক্তভাবে।',
    bg_image_url: '',
    btn_primary: 'ডাক্তার খুঁজুন',
    btn_secondary: 'হাসপাতাল দেখুন',
  },

  // ── IMAGE BANNER SLIDER (Home page) ─────────
  banners: {
    items: [
      { id: 1, image: '/images/banner_telemedicine_1786196938449.jpg', alt: 'টেলিমেডিসিন ও ডাক্তার বুকিং', link: '/doctors' },
      { id: 2, image: '/images/banner_emergency_1786196953227.jpg', alt: 'জরুরি অ্যাম্বুলেন্স ও হাসপাতাল', link: '/hospitals' },
      { id: 3, image: '/images/banner_checkup_1786196968047.jpg', alt: 'ফুল বডি হেলথ চেকআপ', link: '/services' },
      { id: 4, image: '/images/banner_mother_child_1786196984755.jpg', alt: 'মা ও শিশু সেবা', link: '/services' },
      { id: 5, image: '/images/banner_ai_health_1786197001799.jpg', alt: 'এআই স্বাস্থ্য সহকারী', link: '/contact' },
      { id: 6, image: '/images/banner_health_card_1786197020544.jpg', alt: 'ডিজিটাল হেলথ কার্ড', link: '/services' },
      { id: 7, image: '/images/promotion/doctor.png', alt: 'বিশেষজ্ঞ পরামর্শ', link: '/doctors' },
      { id: 8, image: '/images/promotion/hospital.png', alt: 'হাসপাতাল ডিরেক্টরি', link: '/hospitals' },
    ]
  },

  // ── STATS (Home page) ───────────────────────
  stats: {
    doctors_count: '১০০০+',
    doctors_label: 'বিশেষজ্ঞ ডাক্তার',
    hospitals_count: '৫০০+',
    hospitals_label: 'হাসপাতাল ও ক্লিনিক',
    services_count: '৮০+',
    services_label: 'স্বাস্থ্য সেবা',
    patients_count: '১০ লাখ+',
    patients_label: 'সন্তুষ্ট রোগী',
  },

  // ── WHY CHOOSE US (Home page) ───────────────
  why_us: {
    badge: 'কেন আমরা?',
    title: 'বিশ্বস্ত ও নির্ভরযোগ্য কেন?',
    features: [
      { icon: '🛡️', title: 'যাচাইকৃত ডাক্তার', desc: 'চিকিৎসা বোর্ড দ্বারা যাচাইকৃত সকল ডাক্তার' },
      { icon: '⚡', title: 'সহজ ও দ্রুত', desc: 'যেকোনো সময় মিনিটেই বুক করুন' },
      { icon: '⭐', title: 'মানসম্মত সেবা', desc: 'শীর্ষ রেটেড হাসপাতাল ও ক্লিনিক' },
      { icon: '🎧', title: '২৪/৭ সহায়তা', desc: 'সর্বদা আপনার পাশে আছি' },
    ],
  },

  // ── PATIENT TESTIMONIALS (Home page) ────────
  testimonials: {
    badge: 'রোগীদের রিভিউ',
    title: 'হাজারো রোগীর ভরসা ও সন্তুষ্টি',
    subtitle: 'আমাদের সেবা ব্যবহার করে যারা তাদের পছন্দের বিশেষজ্ঞ ডাক্তার ও সঠিক চিকিৎসা সেবা নিশ্চিত করেছেন, তাদের কথা শুনুন।',
    items: [
      {
        id: 1,
        name: 'ঐশী খান',
        role: 'রোগী (ঢাকা)',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        comment: 'ঘরে বসেই মাত্র কয়েক ক্লিকে ধানমন্ডির সেরা শিশু বিশেষজ্ঞ ডাক্তারের অ্যাপয়েন্টমেন্ট বুক করতে পেরেছি! সময় বেঁচেছে অনেক এবং সিরিয়ালও সঠিক সময়ে পেয়েছি।'
      },
      {
        id: 2,
        name: 'মনিরুল ইসলাম',
        role: 'রোগী (সিলেট)',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        comment: 'জরুরি প্রয়োজনে অভিজ্ঞ হৃদরোগ বিশেষজ্ঞ ডাক্তার খুঁজে পাওয়া ছিল কঠিন। কিন্তু এই প্ল্যাটফর্মের মাধ্যমে সরাসরি সিরিয়াল ও ডিজিটাল টিকিট পেয়ে খুব উপকার হয়েছে।'
      },
      {
        id: 3,
        name: 'তানজিলা রহমান',
        role: 'রোগী (চট্টগ্রাম)',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        comment: 'হাসপাতালে ঘণ্টার পর ঘণ্টা সিরিয়ালের লাইনে দাঁড়িয়ে থাকার দিন শেষ! এখন স্মার্টফোন থেকেই সিরিয়াল দেওয়া যায় আর নোটিফিকেশনও পাওয়া যায়।'
      },
      {
        id: 4,
        name: 'মোঃ আরিফ হোসেন',
        role: 'রোগী (রাজশাহী)',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        comment: 'যাচাইকৃত বিএমডিসি নিবন্ধিত বিশেষজ্ঞ ডাক্তারদের সরাসরি চেম্বার ঠিকানা ও সিরিয়াল নম্বর সহজে জানা যায়। প্ল্যাটফর্মটির সেবা সত্যি প্রশংসনীয়।'
      }
    ]
  },

  // ── PARTNER HOSPITALS (Home page) ───────────
  partners: {
    badge: 'পার্টনার নেটওয়ার্ক',
    title: 'আমাদের সহযোগী হাসপাতালসমূহ',
    subtitle: 'দেশজুড়ে নির্ভরযোগ্য হাসপাতাল ও ক্লিনিক্যাল সেন্টারসমূহ',
    items: [
      { id: 1, name: 'Bangladesh Specialized Hospital', logo_url: 'https://img.freepik.com/free-vector/hospital-logo-design-vector-medical-cross_53876-136743.jpg' },
      { id: 2, name: 'Chevron Clinical Laboratory', logo_url: 'https://img.freepik.com/free-vector/cross-medical-health-care-logo_23987-136.jpg' },
      { id: 3, name: 'Popular Diagnostic Center', logo_url: 'https://img.freepik.com/free-vector/hospital-clinic-logo-design_23-2149544607.jpg' },
      { id: 4, name: 'Praava Health', logo_url: 'https://img.freepik.com/free-vector/medical-care-logo-vector_53876-136744.jpg' },
      { id: 5, name: 'York Hospital', logo_url: 'https://img.freepik.com/free-vector/medical-cross-logo-vector_53876-136742.jpg' },
      { id: 6, name: 'Ibn Sina Hospital', logo_url: 'https://img.freepik.com/free-vector/gradient-medical-logo-template_23-2148995383.jpg' }
    ]
  },

  // ── NEWSLETTER ──────────────────────────────
  newsletter: {
    title: 'স্বাস্থ্য সম্পর্কিত সর্বশেষ তথ্য ও টিপস পেতে আমাদের সাথে থাকুন',
    subtitle: 'নিয়মিত আপডেট পেতে আমাদের নিউজলেটারে সাবস্ক্রাইব করুন।',
    placeholder: 'আপনার ইমেইল লিখুন',
    btn_label: 'সাবস্ক্রাইব করুন',
  },

  // ── FAQ ─────────────────────────────────────
  // ── FAQ ─────────────────────────────────────
  faq: {
    badge: 'সচরাচর জিজ্ঞাসা (FAQ)',
    title: 'আপনার প্রশ্নের সহজ ও দ্রুত সমাধান',
    subtitle: 'Doctor Booklet সম্পর্কিত সবচেয়ে সাধারণ প্রশ্নগুলোর উত্তর নিচে খুঁজে নিন',
    categories: [
      { id: 'all', label: 'সব প্রশ্ন' },
      { id: 'appointment', label: 'অ্যাপয়েন্টমেন্ট' },
      { id: 'payment', label: 'পেমেন্ট ও রিফান্ড' },
      { id: 'account', label: 'অ্যাকাউন্ট ও নিরাপত্তা' },
      { id: 'services', label: 'ডিজিটাল সেবা' },
    ],
    items: [
      { id: 1, category: 'account', q: 'Doctor Booklet-এ কীভাবে অ্যাকাউন্ট তৈরি করব?', a: 'রেজিস্টার পেজে গিয়ে রোগী বা ডাক্তার হিসেবে প্রয়োজনীয় তথ্য পূরণ করুন। মোবাইল নম্বর ও ইমেইলে প্রাপ্ত ওটিপি যাচাই করলেই অ্যাকাউন্ট সক্রিয় হবে।' },
      { id: 2, category: 'appointment', q: 'কীভাবে ডাক্তারের অ্যাপয়েন্টমেন্ট বুক করব?', a: 'ডাক্তার সার্চ বার থেকে আপনার পছন্দের ডাক্তার, বিশেষজ্ঞতা বা এলাকা বেছে নিন। খালি তারিখ ও সময় নির্বাচন করে "বুক করুন" বাটনে ক্লিক করুন।' },
      { id: 3, category: 'payment', q: 'পেমেন্ট পদ্ধতি কী কী এবং এটি কি নিরাপদ?', a: 'আমরা বিকাশ, নগদ, রকেট, ডেবিট/ক্রেডিট কার্ড এবং সরাসরি হাসপাতালে পেমেন্ট সাপোর্ট করি। আমাদের অনলাইন পেমেন্ট সিস্টেম সম্পূর্ণ SSL এনক্রিপ্টেড ও নিরাপদ।' },
      { id: 4, category: 'appointment', q: 'অ্যাপয়েন্টমেন্ট পরিবর্তন বা বাতিল কীভাবে করব?', a: 'আপনার প্রোফাইলের "আমার অ্যাপয়েন্টমেন্ট" সেকশনে গিয়ে অ্যাপয়েন্টমেন্টের ২ ঘণ্টা পূর্বে বিনামূল্যে বাতিল বা সময় পুনর্নির্ধারণ করতে পারবেন।' },
      { id: 5, category: 'account', q: 'আমার ব্যক্তিগত ও স্বাস্থ্য সম্পর্কিত তথ্য কি নিরাপদ?', a: 'হ্যাঁ, সম্পূর্ণভাবে। Doctor Booklet আন্তর্জাতিক তথ্য সুরক্ষা স্ট্যান্ডার্ড এবং এন্ড-টু-এন্ড এনক্রিপশন মেনে চলে। আপনার তথ্য কেবল অনুমোদিত চিকিৎসক দেখতে পাবেন।' },
      { id: 6, category: 'services', q: 'অনলাইন ভিডিও কনসালটেশন কীভাবে কাজ করে?', a: 'অ্যাপয়েন্টমেন্টের সময় হলে আপনার ড্যাশবোর্ড থেকে "ভিডিও কল শুরু করুন" বাটনে ক্লিক করে সরাসরি ডাক্তারের সাথে ভিডিওতে পরামর্শ নিতে পারবেন।' },
      { id: 7, category: 'payment', q: 'অ্যাপয়েন্টমেন্ট বাতিল করলে রিফান্ড কতদিনে পাওয়া যাবে?', a: 'সফলভাবে বাতিল করার পর আপনার অর্থ ৩-৫ কার্যদিবসের মধ্যে আপনার বিকাশ/নগদ/ব্যাংক অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে ফেরত পাঠানো হয়।' },
      { id: 8, category: 'services', q: 'প্রেসক্রিপশন কীভাবে সংগ্রহ করব?', a: 'কনসালটেশন শেষে ডাক্তার ডিজিটাল প্রেসক্রিপশন আপলোড করলে তা আপনার প্রোফাইলের "আমার প্রেসক্রিপশন" সেকশন থেকে যেকোনো সময় ডাউনলোড বা প্রিন্ট করতে পারবেন।' },
    ],
  },

  // ── HELPLINES ───────────────────────────────
  helplines: {
    title: 'স্বাস্থ্য জরুরি হেল্পলাইন',
    items: [
      { label: 'জাতীয় জরুরি সেবা', number: '999' },
      { label: 'স্বাস্থ্য বাতায়ন', number: '16263' },
      { label: 'আইইডিসিআর হটলাইন', number: '10655' },
      { label: 'অ্যাম্বুলেন্স সেবা', number: '01199' },
    ],
  },

  // ── CONTACT PAGE ────────────────────────────
  contact: {
    hero_title: 'আমরা আছি আপনার সেবায় সর্বদা',
    hero_subtitle: 'আপনার যেকোনো প্রশ্ন, মতামত বা সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন। আমাদের টিম আপনার সাথে যোগাযোগ করবে।',
    emergency_title: 'জরুরী সহায়তা প্রয়োজন?',
    emergency_subtitle: 'আমাদের হেল্পলাইনে এ কল করুন',
    map_embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.902444685767!2d90.38795307603397!3d23.746469478681074!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b087026b81%3A0x8fa563bbdd5904c2!2sDhanmondi%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1683000000000!5m2!1sen!2sbd',
  },

  // ── ABOUT PAGE ──────────────────────────────
  about_us: {
    title: 'স্বাস্থ্যসেবায় বিপ্লব',
    subtitle: 'Doctor Booklet Bangladesh ঢাকার পান্থপথে একটি অনন্য স্বপ্ন নিয়ে প্রতিষ্ঠিত হয়েছিল — বাংলাদেশের প্রতিটি রোগীর কাছে বিএমডিসি-যাচাইকৃত বিশেষজ্ঞ চিকিৎসকদের সেবা নিরবচ্ছিন্নভাবে পৌঁছে দেওয়া।',
    description: 'আমাদের প্ল্যাটফর্ম প্রতিটি চিকিৎসকের জন্য বহু-স্তর বিশিষ্ট যাচাইকরণ প্রক্রিয়া পরিচালনা করে, যার মধ্যে রয়েছে সক্রিয় বিএমডিসি নিবন্ধন যাচাই, হাসপাতাল অনুমোদন ও পেশাদার শংসাপত্র নিশ্চিতকরণ। আমরা বিশ্বাস করি যে একটি মেডিকেল অ্যাপয়েন্টমেন্ট বুক করা যতটা নির্ভরযোগ্য হওয়া উচিত, ঠিক ততটাই স্বচ্ছ ও সহজ হওয়া প্রয়োজন।',
    mission: 'অত্যাধুনিক ডিজিটাল শিডিউলিং ও ভেরিফিকেশন সিস্টেম ব্যবহার করে বাংলাদেশ জুড়ে ক্লিনিকাল অ্যাক্সেসিবিলিটির প্রতিটি বাধা দূর করা — যাতে সঠিক ডাক্তারের কাছে পৌঁছানো হয় মিনিটের মধ্যে, ঘণ্টার নয়।',
    vision: '১৭ কোটি নাগরিকের জন্য নিশ্চিত স্বাস্থ্য-আস্থা স্তর হয়ে ওঠা — এমন একটি ভবিষ্যৎ নির্মাণ করা যেখানে প্রতিটি বাংলাদেশি মানসম্পন্ন স্বাস্থ্যসেবার নিশ্চয়তা পান।',
  },

  // ── TERMS PAGE ──────────────────────────────
  terms: {
    title: 'সেবার শর্তাবলী',
    content: 'মেডকানেক্ট ব্যবহার করার মাধ্যমে, আপনি আমাদের বুকিং নীতিমালার সাথে সম্মত হন। ডিজিটাল পেমেন্টের মাধ্যমে বুক করা অ্যাপয়েন্টমেন্টগুলি উচ্চ-অগ্রাধিকার সিরিয়াল পায়। সরাসরি পেমেন্টের বিকল্পগুলি হাসপাতালের রিসেপশন উপলব্ধতার ওপর নির্ভরশীল।',
    cancellation: 'স্লটের ২ ঘণ্টা আগে বুকিং বাতিল করতে হবে। ডিজিটাল পেমেন্টের রিফান্ড ৩-৫ কার্যদিবসের মধ্যে সম্পন্ন করা হয়।',
  },

  // ── PRIVACY PAGE ────────────────────────────
  privacy: {
    title: 'গোপনীয়তা এবং তথ্য সুরক্ষা',
    content: 'আপনার স্বাস্থ্য তথ্য আমাদের কাছে পবিত্র। মেডকানেক্ট সমস্ত রোগী-ডাক্তার যোগাযোগের জন্য এন্ড-টু-এন্ড এনক্রিপশন ব্যবহার করে। আমরা আপনার ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষের বিজ্ঞাপনদাতাদের কাছে বিক্রি করি না।',
    cookies: 'আমরা আপনার লগইন সেশন এবং পছন্দগুলি বজায় রাখার জন্য প্রয়োজনীয় কুকি ব্যবহার করি।',
  },

  // ── SUPPORT PAGE ────────────────────────────
  support: {
    title: '২৪/৭ এলিট সহায়তা',
    content: 'আমাদের ডেডিকেটেড সাপোর্ট টিম হেল্পলাইন বা ইমেলের মাধ্যমে উপলব্ধ রয়েছে। জরুরি চিকিৎসার জন্য, দয়া করে অবিলম্বে নিকটস্থ হাসপাতালে যোগাযোগ করুন।',
    hr_notice: 'অ-জরুরি জিজ্ঞাসার জন্য স্ট্যান্ডার্ড রেসপন্স টাইম ২ ঘণ্টা।',
  },
}

const STORAGE_KEY = 'doctor_booklet_cms_v2'

export const getContent = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return deepMerge(INITIAL_CONTENT, parsed)
    } catch (e) {
      return INITIAL_CONTENT
    }
  }
  return INITIAL_CONTENT
}

export const fetchContentFromBackend = async () => {
  try {
    const res = await axiosInstance.get('/cms-content')
    if (res.data && typeof res.data === 'object' && !res.data.status) {
      // ── FIX: local data takes PRIORITY over backend ──────────────────
      // Backend data only fills keys that are missing locally.
      // It must never overwrite image URLs / banners the user saved locally.
      const localRaw = (() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
      })()
      // deepMerge(backend, local) → local wins on every key
      const merged = deepMerge(res.data, localRaw)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        window.dispatchEvent(new Event('cms-updated'))
      } catch (_quota) { /* localStorage full — keep existing */ }
      return deepMerge(INITIAL_CONTENT, merged)
    }
  } catch (e) {
    // Silently fall back to cached / initial content
  }
  return getContent()
}

// Auto-trigger background fetch on module load
fetchContentFromBackend()

// ── Strip base64 data-URLs from content before sending to backend ────────────
// Base64 images can be megabytes — backends & PHP limits reject them.
// We keep them in localStorage but send clean URLs to the API.
function stripBase64ForBackend(obj) {
  if (Array.isArray(obj)) return obj.map(stripBase64ForBackend)
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const k of Object.keys(obj)) {
      const v = obj[k]
      if (typeof v === 'string' && v.startsWith('data:')) {
        out[k] = '' // replace base64 blob with empty string for backend
      } else {
        out[k] = stripBase64ForBackend(v)
      }
    }
    return out
  }
  return obj
}

export const saveContent = async (newContent) => {
  // ── 1. Save FULL content (including base64 images) to localStorage ──
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newContent))
  } catch (e) {
    // QuotaExceededError — try saving without base64 blobs as fallback
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripBase64ForBackend(newContent)))
    } catch (_) { /* storage completely full, skip */ }
  }
  window.dispatchEvent(new Event('cms-updated'))

  // ── 2. Send stripped content (no base64) to backend ──────────────────
  const backendPayload = stripBase64ForBackend(newContent)
  try {
    await axiosInstance.post('/admin/cms-content', backendPayload)
  } catch (e) {
    try {
      await axiosInstance.post('/cms-content', backendPayload)
    } catch (err) {
      // Backend unavailable — local storage already saved above
    }
  }
}

export const resetContent = () => {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('cms-updated'))
  return INITIAL_CONTENT
}

// Deep merge helper: keeps initial keys as default, overrides with saved values
function deepMerge(base, override) {
  const result = { ...base }
  for (const key of Object.keys(override)) {
    if (
      override[key] &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      base[key] &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], override[key])
    } else {
      result[key] = override[key]
    }
  }
  return result
}


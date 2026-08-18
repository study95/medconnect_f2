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
    hero_badge: 'সার্বক্ষণিক যোগাযোগ',
    hero_title: 'আমরা আছি আপনার সেবায় সর্বদা',
    hero_subtitle: 'আপনার যেকোনো প্রশ্ন, মতামত বা সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন। আমাদের টিম আপনার সাথে যোগাযোগ করবে।',
    office_title: 'প্রধান কার্যালয়',
    address: 'মেডকানেক্ট কমপ্লেক্স, বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা-১২০৫',
    phone: '017 XXXX XXXX',
    email: 'info@doctorbooklet.com.bd',
    office_hours: 'শনিবার - বৃহস্পতিবার: সকাল ৯টা - রাত ৮টা | শুক্রবার: সকাল ১০টা - বিকাল ৫টা',
    emergency_title: 'জরুরী সহায়তা প্রয়োজন?',
    emergency_subtitle: 'আমাদের হেল্পলাইনে কল করুন',
    map_embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.902444685767!2d90.38795307603397!3d23.746469478681074!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b087026b81%3A0x8fa563bbdd5904c2!2sDhanmondi%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1683000000000!5m2!1sen!2sbd',
  },

  // ── ABOUT PAGE ──────────────────────────────
  about_us: {
    badge: 'আমাদের গল্প ও লক্ষ্য',
    title: 'রোগী ও বিশেষজ্ঞের মধ্যে সেতুবন্ধন',
    subtitle: 'Doctor Booklet Bangladesh দেশের সবচেয়ে বিশ্বস্ত ডিজিটাল স্বাস্থ্যসেবা প্ল্যাটফর্ম — সকল ৮টি বিভাগে বিএমডিসি-যাচাইকৃত বিশেষজ্ঞ, স্বীকৃত হাসপাতাল ও নিরবচ্ছিন্ন অ্যাপয়েন্টমেন্টের সংযোগ স্থাপন করছে।',
    story_title: 'আমাদের প্রতিষ্ঠা ও যাত্রা',
    story_desc: 'Doctor Booklet Bangladesh ঢাকার পান্থপথে একটি অনন্য স্বপ্ন নিয়ে প্রতিষ্ঠিত হয়েছিল — বাংলাদেশের প্রতিটি রোগীর কাছে বিএমডিসি-যাচাইকৃত বিশেষজ্ঞ চিকিৎসকদের সেবা নিরবচ্ছিন্নভাবে পৌঁছে দেওয়া।',
    mission_title: 'আমাদের মিশন (Our Mission)',
    mission_desc: 'অত্যাধুনিক ডিজিটাল শিডিউলিং ও ভেরিফিকেশন সিস্টেম ব্যবহার করে বাংলাদেশ জুড়ে ক্লিনিকাল অ্যাক্সেসিবিলিটির প্রতিটি বাধা দূর করা — যাতে সঠিক ডাক্তারের কাছে পৌঁছানো হয় মিনিটের মধ্যে, ঘণ্টার নয়।',
    vision_title: 'আমাদের ভিশন (Our Vision)',
    vision_desc: '১৭ কোটি নাগরিকের জন্য নিশ্চিত স্বাস্থ্য-আস্থা স্তর হয়ে ওঠা — এমন একটি ভবিষ্যৎ নির্মাণ করা যেখানে প্রতিটি বাংলাদেশি মানসম্পন্ন স্বাস্থ্যসেবার নিশ্চয়তা পান।',
    stat_doctors: '১,০০০+',
    stat_hospitals: '৫০০+',
    stat_patients: '১০ লাখ+',
    stat_coverage: '৮টি বিভাগ',
    timeline: [
      { year: '২০২২', title: 'প্ল্যাটফর্ম প্রতিষ্ঠা', desc: 'স্বাস্থ্যসেবা ডিজিটালায়নের লক্ষ্যে Doctor Booklet Bangladesh পান্থপথে প্রতিষ্ঠিত হয়।' },
      { year: '২০২৩', title: '৫০০+ ডাক্তার অনবোর্ড', desc: 'ঢাকা, চট্টগ্রাম ও সিলেট বিভাগে ৫০০ বিএমডিসি-যাচাইকৃত ডাক্তারের মাইলফলক অর্জিত।' },
      { year: '২০২৪', title: 'হাসপাতাল সম্প্রসারণ', desc: '২০০+ স্বীকৃত হাসপাতালের সাথে অংশীদারিত্ব ও জাতীয় পর্যায়ে অনলাইন বুকিং চালু।' },
      { year: '২০২৫', title: 'ডিজিটাল পেমেন্ট', desc: 'বিকাশ, নগদ ও রকেট পেমেন্ট গেটওয়ের মাধ্যমে তাৎক্ষণিক স্লট কনফার্মেশন।' },
      { year: '২০২৬', title: '১০ লাখ+ রোগী সেবিত', desc: '১০ লাখের বেশি রোগী সেবার মাইলফলক অতিক্রম করে সকল ৮ বিভাগে সম্প্রসারণ।' },
    ]
  },

  // ── SUPPORT PAGE ────────────────────────────
  support: {
    badge: '২৪/৭ এলিট সহায়তা কেন্দ্র',
    title: '২৪/৭ এলিট সহায়তা ও হেল্পডেস্ক',
    subtitle: 'অ্যাপয়েন্টমেন্ট, পেমেন্ট, রিফান্ড বা যেকোনো স্বাস্থ্য জিজ্ঞাসায় আমাদের নিবেদিত সাপোর্ট টিম সর্বদা আপনার পাশে রয়েছে।',
    hotline: '16263',
    phone: '017 XXXX XXXX',
    email: 'support@doctorbooklet.com.bd',
    office_hours: 'শনিবার - বৃহস্পতিবার: সকাল ৯টা - রাত ১০টা | শুক্রবার: সকাল ১০টা - সন্ধ্যা ৬টা',
    response_time: 'অ-জরুরি জিজ্ঞাসার জন্য স্ট্যান্ডার্ড রেসপন্স টাইম ১৫ মিনিট - ২ ঘণ্টা।',
    emergency_notice: 'জরুরি চিকিৎসার জন্য, দয়া করে অবিলম্বে নিকটস্থ হাসপাতালের ইমার্জেন্সি বিভাগে সরাসরি যোগাযোগ করুন।'
  },

  // ── LEGAL: TERMS OF SERVICE ─────────────────
  legal_terms: {
    title: 'ব্যবহারের শর্তাবলী (Terms of Service)',
    subtitle: 'Doctor Booklet ডিজিটাল স্বাস্থ্যসেবা প্ল্যাটফর্ম ব্যবহারের জন্য আবশ্যকীয় নিয়ম ও সুবিধাসমূহ।',
    updated_date: '২৪ জুলাই, ২০২৬',
    notice: 'দয়া করে Doctor Booklet সার্ভিস ব্যবহারের পূর্বে নিম্নোক্ত শর্তাবলী মনোযোগ দিয়ে পড়ুন। প্ল্যাটফর্মটি ব্যবহারের মাধ্যমে আপনি এই নিয়মাবলীতে সম্মত বলে গণ্য হবেন।',
    sections: [
      {
        num: '১.১',
        heading: 'ভূমিকা ও সেবা পরিচিতি',
        content: 'Doctor Booklet একটি সমন্বিত ডিজিটাল হেলথকেয়ার প্ল্যাটফর্ম যা রোগী, অভিজ্ঞ চিকিৎসক এবং স্বনামধন্য হাসপাতালগুলোর মধ্যে দ্রুত ও নিরবচ্ছিন্ন সংযোগ নিশ্চিত করে। প্ল্যাটফর্মটির মাধ্যমে অনলাইন সিরিয়াল বুকিং, হেলথ রেকর্ড সংরক্ষণ এবং স্বাস্থ্যসেবা সংক্রান্ত তথ্যাদি প্রদান করা হয়।'
      },
      {
        num: '১.২',
        heading: 'অ্যাকাউন্ট নিবন্ধন ও তথ্য সঠিকতা',
        content: 'আমাদের প্ল্যাটফর্মে অ্যাকাউন্ট তৈরির সময় আপনাকে সঠিক ও হালনাগাদ তথ্য প্রদান করতে হবে। আপনার অ্যাকাউন্টের গোপনীয়তা ও পাসওয়ার্ডের নিরাপত্তার পূর্ণ দায়িত্ব আপনার। ভুল বা মিথ্যা তথ্য প্রদানের কারণে কোনো জটিলতা তৈরি হলে Doctor Booklet কর্তৃপক্ষ দায়ী থাকবে না।'
      },
      {
        num: '১.৩',
        heading: 'ডাক্তার অ্যাপয়েন্টমেন্ট ও সিরিয়াল বুকিং',
        content: 'Doctor Booklet প্ল্যাটফর্মের মাধ্যমে ডাক্তার বা হাসপাতালের অ্যাপয়েন্টমেন্ট কনফার্মেশনের পর একটি ডিজিটালি ভেরিফাইড সিরিয়াল কার্ড প্রদান করা হয়। নির্ধারিত সময়ে চেম্বারে উপস্থিত হওয়া রোগীর দায়িত্ব। চেম্বারের জরুরি পরিস্থিতি বা ডাক্তার সাহেবের সময়সূচি পরিবর্তনের কারণে সিরিয়াল সময় সাময়িক পরিবর্তিত হতে পারে।'
      },
      {
        num: '১.৪',
        heading: 'মেডিকেল ডিসক্লেমার ও সীমাবদ্ধতা',
        content: 'Doctor Booklet সরাসরি কোনো চিকিৎসা সেবা বা জরুরি অ্যাম্বুলেন্স সেবা প্রদান করে না। এটি একটি প্রযুক্তিগত প্ল্যাটফর্ম যা রোগী ও স্বাস্থ্যসেবা প্রদানকারীদের সংযোগ ঘটায়। যেকোনো তীব্র শারীরিক জরুরি অবস্থায় (Emergency) অনুগ্রহ করে নিকটস্থ হাসপাতালের ইমার্জেন্সি বিভাগে সরাসরি যোগাযোগ করুন।'
      },
      {
        num: '১.৫',
        heading: 'ব্যবহারকারীর আচরণ বিধি',
        content: 'প্ল্যাটফর্মে যেকোনো অনৈতিক, বেআইনি বা উদ্দেশ্যপ্রণোদিত ভুল তথ্য প্রদান কঠোরভাবে নিষিদ্ধ। প্ল্যাটফর্মের কোনো ডেটা বা সিস্টেম ক্ষতিগ্রস্ত করার চেষ্টা করা হলে সংশ্লিষ্ট অ্যাকাউন্টের অ্যাক্সেস স্থায়ীভাবে বাতিল করা হবে এবং আইনি ব্যবস্থা গ্রহণ করা হতে পারে।'
      },
      {
        num: '১.৬',
        heading: 'মেধা সম্পত্তি ও স্বত্বাধিকার',
        content: 'Doctor Booklet ওয়েবসাইটের লোগো, কনটেন্ট, ইন্টারফেস ডিজাইন এবং সকল সফ্টওয়্যার কোড Doctor Booklet-এর নিজস্ব সম্পদ। পূর্বানুমতি ব্যতিরেকে এগুলো কপি বা বাণিজ্যিক উদ্দেশ্যে ব্যবহার করা সম্পূর্ণ আইনত দণ্ডনীয়।'
      }
    ]
  },

  // ── LEGAL: PRIVACY POLICY ───────────────────
  legal_privacy: {
    title: 'গোপনীয়তা নীতি (Privacy Policy)',
    subtitle: 'আপনার ব্যক্তিগত ও চিকিৎসা সংক্রান্ত তথ্যের নিরাপত্তা এবং গোপনীয়তা রক্ষায় আমাদের অঙ্গীকার।',
    updated_date: '২৪ জুলাই, ২০২৬',
    notice: 'Doctor Booklet আপনার তথ্যের সর্বোচ্চ সুরক্ষায় বিশ্বমানের এনক্রিপশন ও সিকিউরিটি প্রোটোকল অনুসরণ করে। আমরা আপনার সম্মতি ছাড়া কোনো ব্যক্তিগত তথ্য বাণিজ্যিক উদ্দেশ্যে বিক্রি করি না।',
    sections: [
      {
        num: '২.১',
        heading: 'তথ্য সংগ্রহ ও এর ধরন',
        content: 'সেবা প্রদানের লক্ষ্যে আমরা ব্যবহারকারীর নাম, ফোন নম্বর, ইমেইল ঠিকানা, জন্মতারিখ, লিঙ্গ এবং প্রয়োজনীয় ক্ষেত্রে পূর্ববর্তী স্বাস্থ্য বিবরণী সংগ্রহ করে থাকি। এই তথ্যসমূহ শুধুমাত্র অ্যাপয়েন্টমেন্ট বুকিং ও মানসম্মত সেবা নিশ্চিত করতে ব্যবহৃত হয়।'
      },
      {
        num: '২.২',
        heading: 'তথ্যের ব্যবহার ও উদ্দেশ্য',
        content: 'সংগৃহীত তথ্য ডাক্তার সিরিয়াল প্রদান, প্রেসক্রিপশন সংরক্ষণ, স্বাস্থ্য নোটিফিকেশন প্রেরণ এবং প্ল্যাটফর্মের মানোন্নয়নে ব্যবহৃত হয়। কোনো অবস্থাতেই তৃতীয় পক্ষের কাছে ব্যক্তিগত তথ্য হস্তান্তর করা হয় না।'
      },
      {
        num: '২.৩',
        heading: 'ডেটা নিরাপত্তা ও এন্ড-টু-এন্ড এনক্রিপশন',
        content: 'আমাদের সিস্টেমে সংগৃহীত সমস্ত মেডিকেল ডেটা এবং যোগাযোগ আন্তর্জাতিক মানের SSL এনক্রিপশন ও সিকিউর ক্লাউড ডাটাবেজে সংরক্ষিত থাকে।'
      },
      {
        num: '২.৪',
        heading: 'কুকি ও ট্র্যাকিং নীতি',
        content: 'আমরা আপনার লগইন সেশন ও ইউজার এক্সপেরিয়েন্স সমৃদ্ধ করতে প্রয়োজনীয় সিকিউর কুকি ব্যবহার করি।'
      }
    ]
  },

  // ── LEGAL: REFUND & CANCELLATION ────────────
  legal_refund: {
    title: 'রিফান্ড ও বাতিলকরণ নীতি (Refund Policy)',
    subtitle: 'Doctor Booklet ডিজিটাল পেমেন্ট, সিরিয়াল বাতিল এবং অর্থ ফেরত সংক্রান্ত স্বচ্ছ নীতিমালা।',
    updated_date: '২৪ জুলাই, ২০২৬',
    notice: 'যেকোনো বুকিং বাতিলের পূর্বে আমাদের রিফান্ড নীতি পর্যালোচনা করার জন্য অনুরোধ করা হচ্ছে। গ্রাহকের স্বার্থ সুরক্ষায় আমরা ১০০% স্বচ্ছতা বজায় রাখি।',
    sections: [
      {
        num: '৩.১',
        heading: 'রোগী কর্তৃক অ্যাপয়েন্টমেন্ট বাতিল ও সময়সীমা',
        content: 'নির্ধারিত অ্যাপয়েন্টমেন্টের সময়সূচির অন্তত ৬ ঘণ্টা পূর্বে অ্যাপয়েন্টমেন্ট বাতিল করলে পরিশোধিত সার্ভিস চার্জ বা ফি সম্পূর্ণ রিফান্ড পাওয়ার যোগ্য হবেন।'
      },
      {
        num: '৩.২',
        heading: 'ডাক্তার বা হাসপাতাল কর্তৃক বাতিলকরণ',
        content: 'যদি কোনো অনাকাঙ্ক্ষিত কারণে ডাক্তার সাহেব অনুপস্থিত থাকেন অথবা হাসপাতাল কর্তৃপক্ষ অ্যাপয়েন্টমেন্ট বাতিল ঘোষণা করে, তবে রোগী ১০০% রিফান্ড পাবেন অথবা সুবিধাজনক পরবর্তী স্লটে ফ্রিতে পুনর্নির্ধারণ (Reschedule) করতে পারবেন।'
      },
      {
        num: '৩.৩',
        heading: 'রিফান্ড প্রসেসিং সময় ও মাধ্যম',
        content: 'অনুমোদিত রিফান্ডের টাকা সাধারণত ৩ থেকে ৭ কর্মদিবসের (Working Days) মধ্যে ব্যবহারকারীর মূল পেমেন্ট মাধ্যমে (বিকাশ, নগদ, রকেট বা ব্যাংক কার্ড) স্বয়ংক্রিয়ভাবে জমা হয়ে যায়।'
      },
      {
        num: '৩.৪',
        heading: 'অফেরতযোগ্য ক্ষেত্রসমূহ (Non-Refundable Cases)',
        content: 'যদি রোগী নির্দিষ্ট সময়ে চেম্বারে উপস্থিত হতে না পারেন (No-Show) এবং সময় পার হওয়ার পূর্বে বাতিল না করেন, তবে উক্ত অ্যাপয়েন্টমেন্টের ফি অফেরতযোগ্য বলে গণ্য হবে।'
      },
      {
        num: '৩.৫',
        heading: 'সহায়তা ও ক্লেম প্রক্রিয়া',
        content: 'রিফান্ড সংক্রান্ত যেকোনো জটিলতা বা অনুসন্ধানের জন্য হেল্পলাইন নম্বর অথবা refund@doctorbooklet.com.bd ইমেইলে ট্রানজেকশন আইডি সহ যোগাযোগ করতে অনুরোধ করা যাচ্ছে।'
      }
    ]
  },

  // ── SUPPORT TICKET / OBIJUG SECTION CMS ──────
  support_ticket: {
    badge: 'অনলাইন সাপোর্ট টিকিট ও অভিযোগ',
    title: 'নতুন সাপোর্ট টিকিট / অভিযোগ জমা দিন',
    subtitle: 'আপনার যেকোনো জিজ্ঞাসা বা সমস্যা নিচে জমা দিন। আমাদের সাপোর্ট টিম দ্রুত আপনার সাথে যোগাযোগ করবে।',
    response_estimate: '২ ঘণ্টা',
    success_title: 'সফলভাবে টিকিট জমা হয়েছে!',
    success_subtitle: 'আমাদের টিম দ্রুত যোগাযোগ করবে',
    categories: [
      'অ্যাপয়েন্টমেন্ট সমস্যা',
      'পেমেন্ট ও রিফান্ড',
      'ভিডিও কল সমস্যা',
      'ডাক্তার সম্পর্কিত তথ্য',
      'অন্যান্য জিজ্ঞাসা'
    ]
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


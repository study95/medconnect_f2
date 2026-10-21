// prescriptionConstants.js — Clinical options, bilingual translation maps & layout template definitions

export const STRENGTH_OPTIONS = [
  '500 mg', '650 mg', '250 mg', '100 mg', '50 mg', '20 mg', '10 mg', '5 mg', '30 mg/5ml', '100 ml', '—'
]

export const DOSE_OPTIONS_BN = [
  '১টি ট্যাবলেট',
  '২টি ট্যাবলেট',
  'আধখানা ট্যাবলেট',
  '১টি ক্যাপসুল',
  '১ চামচ',
  '২ চামচ',
  '১ প্যাকেট',
  '১ ফোঁটা',
  '১ চাপ'
]

export const DOSE_OPTIONS_EN = [
  '1 Tablet',
  '2 Tablets',
  '0.5 Tablet',
  '1 Capsule',
  '5 ml',
  '10 ml',
  '1 Sachet',
  '1 Spoon',
  '1 Drop',
  '1 Puff'
]

export const DOSE_OPTIONS = [...DOSE_OPTIONS_BN, ...DOSE_OPTIONS_EN]

export const FREQUENCY_OPTIONS_BN = [
  '১+০+১',
  '১+১+১',
  '১+০+০',
  '০+১+০',
  '০+০+১',
  '১+১+১+১',
  '০+০+০+১',
  '১+০+১+০',
  '১/২+০+১/২',
  '১/২+০+০',
  '০+০+১/২',
  'SOS (প্রয়োজনে)',
  'PRN (নিয়ম অনুযায়ী)'
]

export const FREQUENCY_OPTIONS_EN = [
  '1+0+1',
  '1+1+1',
  '1+0+0',
  '0+1+0',
  '0+0+1',
  '1+1+1+1',
  '0+0+0+1',
  '1+0+1+0',
  '1/2+0+1/2',
  '1/2+0+0',
  '0+0+1/2',
  'SOS',
  'PRN'
]

export const FREQUENCY_OPTIONS = [...FREQUENCY_OPTIONS_BN, ...FREQUENCY_OPTIONS_EN]

export const DURATION_OPTIONS_BN = [
  '৩ দিন',
  '৫ দিন',
  '৭ দিন',
  '১০ দিন',
  '১৪ দিন',
  '২১ দিন',
  '১ মাস',
  '২ মাস',
  '৩ মাস',
  'চলবে'
]

export const DURATION_OPTIONS_EN = [
  '3 Days',
  '5 Days',
  '7 Days',
  '10 Days',
  '14 Days',
  '21 Days',
  '1 Month',
  '2 Months',
  '3 Months',
  'Continue'
]

export const DURATION_OPTIONS = [...DURATION_OPTIONS_BN, ...DURATION_OPTIONS_EN]

export const MEAL_OPTIONS_BN = [
  'খাওয়ার পর',
  'খাওয়ার আগে',
  'খাওয়ার সাথে',
  'খালি পেটে',
  'ঘুমানোর আগে',
  'নিয়ম অনুযায়ী'
]

export const MEAL_OPTIONS_EN = [
  'After Meal',
  'Before Meal',
  'With Food',
  'Empty Stomach',
  'Bedtime',
  'As Directed'
]

export const MEAL_OPTIONS = [...MEAL_OPTIONS_BN, ...MEAL_OPTIONS_EN]

export const FREQUENCY_TRANSLATION_EN_TO_BN = {
  '1+0+1': '১+০+১',
  '1+1+1': '১+১+১',
  '1+0+0': '১+০+০',
  '0+1+0': '০+১+০',
  '0+0+1': '০+০+১',
  '1+1+1+1': '১+১+১+১',
  '0+0+0+1': '০+০+০+১',
  '1+0+1+0': '১+০+১+০',
  '1/2+0+1/2': '১/২+০+১/২',
  '1/2+0+0': '১/২+০+০',
  '0+0+1/2': '০+০+১/২',
  'SOS': 'SOS (প্রয়োজনে)',
  'PRN': 'PRN (নিয়ম অনুযায়ী)'
}

export const FREQUENCY_TRANSLATION_BN_TO_EN = {
  '১+০+১': '1+0+1',
  '১+১+১': '1+1+1',
  '১+০+০': '1+0+0',
  '০+১+০': '0+1+0',
  '০+০+১': '0+0+1',
  '১+১+১+১': '1+1+1+1',
  '০+০+০+১': '0+0+0+1',
  '১+০+১+০': '1+0+1+0',
  '১/২+০+১/২': '1/2+0+1/2',
  '১/২+০+০': '1/2+0+0',
  '০+০+১/২': '0+0+1/2',
  'SOS (প্রয়োজনে)': 'SOS',
  'PRN (নিয়ম অনুযায়ী)': 'PRN',
  'প্রয়োজনে (SOS)': 'SOS',
  'নিয়ম অনুযায়ী (PRN)': 'PRN'
}

export const DURATION_TRANSLATION_EN_TO_BN = {
  '3 Days': '৩ দিন',
  '5 Days': '৫ দিন',
  '7 Days': '৭ দিন',
  '10 Days': '১০ দিন',
  '14 Days': '১৪ দিন',
  '21 Days': '২১ দিন',
  '1 Month': '১ মাস',
  '2 Months': '২ মাস',
  '3 Months': '৩ মাস',
  'Continue': 'চলবে'
}

export const DURATION_TRANSLATION_BN_TO_EN = {
  '৩ দিন': '3 Days',
  '৫ দিন': '5 Days',
  '৭ দিন': '7 Days',
  '১০ দিন': '10 Days',
  '১৪ দিন': '14 Days',
  '২১ দিন': '21 Days',
  '১ মাস': '1 Month',
  '২ মাস': '2 Months',
  '৩ মাস': '3 Months',
  'চলবে': 'Continue'
}

export const MEAL_TRANSLATION_EN_TO_BN = {
  'After Meal': 'খাওয়ার পর',
  'Before Meal': 'খাওয়ার আগে',
  'With Food': 'খাওয়ার সাথে',
  'Empty Stomach': 'খালি পেটে',
  'Bedtime': 'ঘুমানোর আগে',
  'As Directed': 'নিয়ম অনুযায়ী'
}

export const MEAL_TRANSLATION_BN_TO_EN = {
  'খাওয়ার পর': 'After Meal',
  'খাওয়ার আগে': 'Before Meal',
  'খাওয়ার সাথে': 'With Food',
  'খালি পেটে': 'Empty Stomach',
  'ঘুমানোর আগে': 'Bedtime',
  'নিয়ম অনুযায়ী': 'As Directed'
}

export const DOSE_TRANSLATION_EN_TO_BN = {
  '1 Tablet': '১টি ট্যাবলেট',
  '2 Tablets': '২টি ট্যাবলেট',
  '1/2 Tablet': '১/২ ট্যাবলেট',
  '1 Capsule': '১টি ক্যাপসুল',
  '5 ml': '৫ মি.লি.',
  '10 ml': '১০ মি.লি.',
  '1 Sachet': '১ স্যাচেট',
  '1 Spoon': '১ চামচ',
  '1 Drop': '১ ফোঁটা',
  '1 Puff': '১ চাপ (Puff)'
}

export const DOSE_TRANSLATION_BN_TO_EN = {
  '১টি ট্যাবলেট': '1 Tablet',
  '২টি ট্যাবলেট': '2 Tablets',
  '১/২ ট্যাবলেট': '1/2 Tablet',
  '১টি ক্যাপসুল': '1 Capsule',
  '৫ মি.লি.': '5 ml',
  '১০ মি.লি.': '10 ml',
  '১ স্যাচেট': '1 Sachet',
  '১ চামচ': '1 Spoon',
  '১ ফোঁটা': '1 Drop',
  '১ চাপ (Puff)': '1 Puff'
}

export const CC_PRESETS = []
export const OE_PRESETS = []
export const MH_PRESETS = []
export const INVESTIGATION_CATEGORIES = {}
export const ADVICE_CATEGORIES = {}
export const FAVORITE_MEDICINES = []
export const QUICK_COMBOS = []
export const QUICK_TEMPLATES = []

export const DIGITAL_PRESCRIPTION_TEMPLATES = [
  {
    id: 'digital-qr-barcode',
    name: '১. ডিজিটাল প্রিন্ট (QR কোড ও বারকোড সহ)',
    badge: 'ডিজিটাল প্রিন্ট',
    description: 'সম্পূর্ণ হেডার, কিউআর কোড (QR Code), বারকোড (Barcode) এবং ভেরিফাইড ই-প্রেসক্রিপশন সিল সহ।'
  },
  {
    id: 'pad-print-only-data',
    name: '২. ডাক্তারের হার্ড প্যাড (শুধু তথ্যগুলো প্রিন্ট হবে)',
    badge: 'প্যাড প্রিন্ট',
    description: 'ডাক্তারের নিজস্ব ছাপানো প্যাডে প্রিন্টের জন্য — হেডার ও ফুটার বাদ দিয়ে শুধু রোগীর তথ্য ও ওষুধ প্রিন্ট হবে।'
  },
  {
    id: 'smart-hospital',
    name: '৩. স্মার্ট হসপিটাল / ক্লিনিক লে-আউট',
    badge: 'হসপিটাল',
    description: 'কর্পোরেট হসপিটাল হেডার, ক্লিনিক্যাল গ্রিড এবং বারকোড সহ ডিজিটাল ডিজাইন।'
  },
  {
    id: 'classic-pad',
    name: '৪. ক্লাসিক বাংলা প্রেসক্রিপশন ডিজাইন',
    badge: 'স্ট্যান্ডার্ড',
    description: 'দ্বি-কলাম বিশিষ্ট প্রথাগত ডিজাইন সাথে মোবাইল কিউআর কোড স্ক্যানার।'
  }
]

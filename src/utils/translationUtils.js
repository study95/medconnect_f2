/**
 * Utility to translate dynamic metadata (Divisions, Districts, Specialties)
 * retrieved from the API when static keys aren't enough.
 */

const DIVISION_MAP = {
  'Dhaka': 'dhaka_div',
  'Chittagong': 'chittagong_div',
  'Rajshahi': 'rajshahi_div',
  'Khulna': 'khulna_div',
  'Barisal': 'barisal_div',
  'Sylhet': 'sylhet_div',
  'Rangpur': 'rangpur_div',
  'Mymensingh': 'mymensingh_div'
};

const SPECIALTY_MAP = {
  'Cardiology': 'spec_cardiology',
  'Neurology': 'spec_neurology',
  'Orthopedic': 'spec_orthopedics',
  'Orthopedics': 'spec_orthopedics',
  'Medicine': 'spec_medicine',
  'Internal Medicine': 'spec_medicine',
  'Gynecology': 'spec_gynecology',
  'Pediatrics': 'spec_pediatrics',
  'Dermatology': 'spec_dermatology',
  'Surgery': 'spec_surgery',
  'Dental': 'spec_dental'
};

// District Map (64 Districts of Bangladesh)
const DISTRICT_BENGALI = {
  "Dhaka": "ঢাকা", "Faridpur": "ফরিদপুর", "Gazipur": "গাজীপুর", "Gopalganj": "গোপালগঞ্জ", "Kishoreganj": "কিশোরগঞ্জ", 
  "Madaripur": "মাদারীপুর", "Manikganj": "মানিকগঞ্জ", "Munshiganj": "মুন্সীগঞ্জ", "Narayanganj": "নারায়ণগঞ্জ", 
  "Narsingdi": "নরসিংদী", "Rajbari": "রাজবাড়ী", "Shariatpur": "শরীয়তপুর", "Tangail": "টাঙ্গাইল", 
  "Bagerhat": "বাগেরহাট", "Chuadanga": "চুয়াডাঙ্গা", "Jessore": "যশোর", "Jhenaidah": "ঝিনাইদহ", "Khulna": "খুলনা", 
  "Kushtia": "কুষ্টিয়া", "Magura": "মাগুরা", "Meherpur": "মেহেরপুর", "Narail": "নড়াইল", "Satkhira": "সাতক্ষীরা", 
  "Bogra": "বগুড়া", "Joypurhat": "জয়পুরহাট", "Naogaon": "নওগাঁ", "Natore": "নাটোর", "Chapainawabganj": "চাঁপাইনবাবগঞ্জ", 
  "Pabna": "পাবনা", "Rajshahi": "রাজশাহী", "Sirajganj": "সিরাজগঞ্জ", "Dinajpur": "দিনাজপুর", "Gaibandha": "গাইবান্ধা", 
  "Kurigram": "কুড়িগ্রাম", "Lalmonirhat": "লালমনিরহাট", "Nilphamari": "নীলফামারী", "Panchagarh": "পঞ্চগড়", 
  "Rangpur": "রংপুর", "Thakurgaon": "ঠাকুরগাঁও", "Barguna": "বরগুনা", "Barisal": "বরিশাল", "Bhola": "ভোলা", 
  "Jhalokati": "ঝালকাঠি", "Patuakhali": "পটুয়াখালী", "Pirojpur": "পিরোজপুর", "Bandarban": "বান্দরবান", 
  "Brahmanbaria": "ব্রাহ্মণবাড়িয়া", "Chandpur": "চাঁদপুর", "Chittagong": "চট্টগ্রাম", "Comilla": "কুমিল্লা", 
  "Cox's Bazar": "কক্সবাজার", "Feni": "ফেনী", "Khagrachhari": "খাগড়াছড়ি", "Lakshmipur": "লক্ষ্মীপুর", 
  "Noakhali": "নোয়াখালী", "Rangamati": "রাঙ্গামাটি", "Habiganj": "হবিগঞ্জ", "Moulvibazar": "মৌলভীবাজার", 
  "Sunamganj": "সুনামগঞ্জ", "Sylhet": "সিলেট", "Jamalpur": "জামালপুর", "Mymensingh": "ময়মনসিংহ", 
  "Netrokona": "নেত্রকোনা", "Sherpur": "শেরপুর"
};

export const translateMetadata = (name, language, t) => {
  if (!name) return '';
  if (language === 'en') return name;

  // 1. Check for Division
  if (DIVISION_MAP[name]) {
    return t(DIVISION_MAP[name]);
  }

  // 2. Check for Specialty
  if (SPECIALTY_MAP[name]) {
    return t(SPECIALTY_MAP[name]);
  }

  // 3. Check for District
  if (DISTRICT_BENGALI[name]) {
    return DISTRICT_BENGALI[name];
  }

  // Fallback
  return name;
};

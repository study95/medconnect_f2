import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import BreadcrumbHUD from '../../components/common/BreadcrumbHUD'
import { useTheme } from '../../context/ThemeContext'
import { getContent } from '../../utils/contentService'
import { 
  IconShieldCheck, 
  IconLock, 
  IconReceiptRefund, 
  IconMail, 
  IconInfoCircle,
  IconCheck,
  IconFileText,
  IconClock,
  IconFileCheck,
  IconCreditCard,
  IconPrinter
} from '@tabler/icons-react'

export default function LegalPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['terms', 'privacy', 'refund', 'subscription', 'billing']
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam && validTabs.includes(tabParam) ? tabParam : 'terms')
  const [cms, setCms] = useState(getContent())
  const { theme } = useTheme()

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    const handleUpdate = () => setCms(getContent())
    window.addEventListener('cms-updated', handleUpdate)
    return () => window.removeEventListener('cms-updated', handleUpdate)
  }, [])

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const tabs = [
    { 
      id: 'terms', 
      title: 'ব্যবহারের শর্তাবলী', 
      englishTitle: 'Terms of Service',
      icon: <IconShieldCheck size={20} />,
      updatedDate: cms.legal_terms?.updated_date || '২৪ জুলাই, ২০২৬'
    },
    { 
      id: 'privacy', 
      title: 'গোপনীয়তা নীতি', 
      englishTitle: 'Privacy Policy',
      icon: <IconLock size={20} />,
      updatedDate: cms.legal_privacy?.updated_date || '২৪ জুলাই, ২০২৬'
    },
    { 
      id: 'refund', 
      title: 'রিফান্ড ও বাতিলকরণ নীতি', 
      englishTitle: 'Refund & Cancellation Policy',
      icon: <IconReceiptRefund size={20} />,
      updatedDate: cms.legal_refund?.updated_date || '২৪ জুলাই, ২০২৬'
    },
    { 
      id: 'subscription', 
      title: 'সাবস্ক্রিপশন চুক্তি', 
      englishTitle: 'Master Subscription Agreement (B2B)',
      icon: <IconFileCheck size={20} />,
      updatedDate: cms.legal_subscription?.updated_date || '৪ অক্টোবর, ২০২৬'
    },
    { 
      id: 'billing', 
      title: 'বিলিং ও পেমেন্ট নীতিমালা', 
      englishTitle: 'Enterprise Billing & Proration Policy',
      icon: <IconCreditCard size={20} />,
      updatedDate: cms.legal_billing?.updated_date || '৪ অক্টোবর, ২০২৬'
    }
  ]

  const defaultTerms = {
    title: 'ব্যবহারের শর্তাবলী (Terms of Service)',
    subtitle: 'Doctor Booklet ডিজিটাল স্বাস্থ্যসেবা প্ল্যাটফর্ম ব্যবহারের জন্য আবশ্যকীয় নিয়ম ও সুবিধাসমূহ।',
    notice: 'দয়া করে Doctor Booklet সার্ভিস ব্যবহারের পূর্বে নিম্নোক্ত শর্তাবলী মনোযোগ দিয়ে পড়ুন। প্ল্যাটফর্মটি ব্যবহারের মাধ্যমে আপনি এই নিয়মাবলীতে সম্মত বলে গণ্য হবেন।',
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
  }

  const defaultPrivacy = {
    title: 'গোপনীয়তা নীতি (Privacy Policy)',
    subtitle: 'আপনার ব্যক্তিগত ও চিকিৎসা সংক্রান্ত তথ্যের নিরাপত্তা এবং গোপনীয়তা রক্ষায় আমাদের অঙ্গীকার।',
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
  }

  const defaultRefund = {
    title: 'রিফান্ড ও বাতিলকরণ নীতি (Refund & Cancellation Policy)',
    subtitle: 'Doctor Booklet ডিজিটাল পেমেন্ট, সিরিয়াল বাতিল এবং অর্থ ফেরত সংক্রান্ত স্বচ্ছ নীতিমালা।',
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
  }

  const defaultSubscription = {
    title: 'সাবস্ক্রিপশন সেবা চুক্তি (Master Subscription Agreement)',
    subtitle: 'Doctor Booklet প্ল্যাটফর্মে নিবন্ধিত চিকিৎসক, স্বাস্থ্য ক্লিনিক ও হাসপাতালগুলোর প্রাতিষ্ঠানিক সেবা চুক্তি।',
    notice: 'গুরুত্বপূর্ণ বিজ্ঞপ্তি: এটি স্বাস্থ্যসেবা প্রদানকারী (ডাক্তার/হাসপাতাল) এবং Doctor Booklet Health Technologies Ltd.-এর মধ্যকার একটি দ্বিপাক্ষিক আইনি চুক্তি। কোনো সাবস্ক্রিপশন প্ল্যান সক্রিয় করার মাধ্যমে আপনি এই চুক্তিপত্রের সকল ধারায় পূর্ণ সম্মতি জ্ঞাপন করছেন।',
    sections: [
      {
        num: '৪.১',
        heading: 'ভূমিকা, পক্ষসমূহ ও চুক্তির উদ্দেশ্য',
        content: 'এই সেবা চুক্তিটি ("চুক্তি") Doctor Booklet Health Technologies Ltd. ("প্ল্যাটফর্ম" বা "সেবাপ্রদানকারী") এবং সাবস্ক্রিপশন গ্রহণকারী নিবন্ধিত চিকিৎসক বা প্রাতিষ্ঠানিক হাসপাতাল/ক্লিনিক কর্তৃপক্ষ ("গ্রাহক") এর মধ্যে কার্যকর হবে। প্ল্যাটফর্মের সফটওয়্যার, অনলাইন সিরিয়াল ম্যানেজমেন্ট, প্রেসক্রিপশন মডিউল এবং প্রাতিষ্ঠানিক সিট ডিরেক্টরি ব্যবহারের ক্ষেত্রে এই শর্তাবলী প্রযোজ্য।'
      },
      {
        num: '৪.২',
        heading: 'রোগীর ডেটার শতভাগ মালিকানা ও কঠোর গোপনীয়তা',
        content: 'প্ল্যাটফর্মে সংরক্ষিত সকল রোগী প্রোফাইল, প্রেসক্রিপশন, ডায়াগনস্টিক রিপোর্ট এবং স্বাস্থ্য সংক্রান্ত তথ্যের একমাত্র ও অবিসংবাদিত মালিক গ্রাহক (ডাক্তার বা হাসপাতাল)। Doctor Booklet কেবল একটি আন্তর্জাতিক মানসম্পন্ন এন্ড-টু-এন্ড এনক্রিপ্টেড ক্লাউড ডাটা প্রসেসর হিসেবে কাজ করে। গ্রাহকের লিখিত অনুমতি ব্যতীত প্ল্যাটফর্ম কখনোই কোনো রোগীর ব্যক্তিগত বা স্বাস্থ্যগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি, প্রকাশ বা বাণিজ্যিক বিপণনে ব্যবহার করবে না।'
      },
      {
        num: '৪.৩',
        heading: 'সার্ভিস লেভেল অ্যাগ্রিমেন্ট (SLA) ও ৯৯.৯% আপটাইম প্রতিশ্রুতি',
        content: 'প্ল্যাটফর্ম সার্বক্ষণিক ৯৯.৯% আপটাইম বজায় রাখতে প্রতিশ্রুতিবদ্ধ। নির্ধারিত সিস্টেম আপগ্রেডেশন বা শিডিউল মেইনটেন্যান্স পরিচালনার ক্ষেত্রে গ্রাহককে কমপক্ষে ২৪ থেকে ৪৮ ঘণ্টা পূর্বে ড্যাশবোর্ড নোটিশ বা ইমেইলের মাধ্যমে অবহিত করা হবে। অপ্রত্যাশিত কোনো প্রযুক্তিগত বিপর্যয়ে সর্বোচ্চ অগ্রাধিকারে সাপোর্ট ইঞ্জিনিয়ার টিম কাজ করবে।'
      },
      {
        num: '৪.৪',
        heading: 'হাসপাতাল সিট কোটা, ইনভাইটেশন ও এক্সেস কন্ট্রোল',
        content: 'প্রাতিষ্ঠানিক সাবস্ক্রিপশন প্ল্যানে বরাদ্দকৃত অনুমোদিত ডাক্তার সিটের (Seat Allocation) সংখ্যার মধ্যে হাসপাতাল কর্তৃপক্ষ তাদের বৈধ চিকিৎসকদের সংযুক্ত করতে পারবেন। প্রতিটি আমন্ত্রিত চিকিৎসকের রেজিস্ট্রেশন ও বিএমডিসি (BMDC) সনদের সত্যতা নিশ্চিত করার দায়ভার সংশ্লিষ্ট হাসপাতাল প্রশাসনের।'
      },
      {
        num: '৪.৫',
        heading: 'ফ্রি ট্রায়াল (১৪ দিন) ও গ্রেস পিরিয়ড (৭ দিন) বিধান',
        content: 'নতুন গ্রাহকগণের জন্য প্রদত্ত ১৪ দিনের মূল্যায়ন ট্রায়াল চলাকালীন সকল সুবিধা উন্মুক্ত থাকবে। ট্রায়াল বা পেইড প্যাকেজের মেয়াদ শেষ হওয়ার পর গ্রাহকের চলমান স্বাস্থ্যসেবা সচল রাখতে ৭ দিনের সহনশীল গ্রেস পিরিয়ড প্রদান করা হয়। গ্রেস পিরিয়ড শেষ হওয়ার পূর্বে বকেয়া নবায়ন ফি পরিশোধ না করলে সফটওয়্যার এক্সেস সাময়িকভাবে স্থগিত বা সীমাবদ্ধ করা হবে।'
      },
      {
        num: '৪.৬',
        heading: 'চিকিৎসাগত সিদ্ধান্তের দায়মুক্তি (Medical Disclaimer)',
        content: 'Doctor Booklet শুধুমাত্র একটি ডিজিটাল ম্যানেজমেন্ট ও প্র্যাকটিস অটোমেশন সফটওয়্যার। রোগীর চিকিৎসাগত সিদ্ধান্ত, পরামর্শ, প্রেসক্রিপশন কিংবা কোনো ক্লিনিক্যাল জটিলতার সম্পূর্ণ পেশাগত ও আইনি দায়ভার সংশ্লিষ্ট সনদপ্রাপ্ত চিকিৎসকের। প্ল্যাটফর্ম কোনো প্রকার চিকিৎসাগত অবহেলার (Medical Negligence) জন্য দায়ী থাকবে না।'
      },
      {
        num: '৪.৭',
        heading: 'চুক্তি সমাপ্তি ও ডেটা এক্সপোর্ট অধিকার',
        content: 'যেকোনো পক্ষ ৩০ দিনের লিখিত নোটিশে সাবস্ক্রিপশন বাতিল করতে পারবে। চুক্তি সমাপ্তির পর গ্রাহক ৯০ দিন পর্যন্ত তাদের সংরক্ষিত সকল মেডিকেল ও প্রেসক্রিপশন ডেটা স্ট্যান্ডার্ড ফরম্যাটে এক্সপোর্ট বা ব্যাকআপ নেওয়ার অধিকার পাবেন।'
      }
    ]
  }

  const defaultBilling = {
    title: 'বিলিং, পেমেন্ট ও প্রোরেশন নীতিমালা (Enterprise Billing Policy)',
    subtitle: 'সাবস্ক্রিপশন চার্জ, ৫% সরকারি ভ্যাট, অনলাইন/ম্যানুয়াল পেমেন্ট ভেরিফিকেশন এবং প্যাকেজ আপগ্রেড প্রোরেশনের সুস্পষ্ট নিয়মাবলী।',
    notice: 'বাংলাদেশ সরকারের অর্থ আইন ও জাতীয় রাজস্ব বোর্ডের (NBR) মূসক নির্দেশিকা অনুযায়ী এই বিলিং পলিসি পরিচালিত হয়। প্রতিটি সফল পেমেন্টে স্বয়ংক্রিয়ভাবে অডিট-রেডি ডিজিটাল ভ্যাট ইনভয়েস ইস্যু করা হয়।',
    sections: [
      {
        num: '৫.১',
        heading: 'কারেন্সি ও সরকারি ৫% মূসক/ভ্যাট অন্তর্ভুক্তি',
        content: 'প্ল্যাটফর্মের সকল সেবা মূল্য ও সাবস্ক্রিপশন ফি বাংলাদেশী টাকা (BDT)-তে নির্ধারিত। জাতীয় রাজস্ব বোর্ডের প্রচলিত নিয়ম অনুযায়ী প্ল্যাটফর্মের প্রতিটি লেনদেনে ৫% সরকারি ভ্যাট (Value Added Tax) প্রযোজ্য হবে এবং চূড়ান্ত চেকআউটে তা প্রদর্শিত ও ইনভয়েসে সংযোজিত হবে।'
      },
      {
        num: '৫.২',
        heading: 'প্রোরেশন ইঞ্জিন ও প্যাকেজ পরিবর্তনের গাণিতিক নিয়ম',
        content: 'চলমান সাবস্ক্রিপশনের মেয়াদ থাকাকালীন গ্রাহক উচ্চতর কোনো প্যাকেজে আপগ্রেড করলে সিস্টেমের স্বয়ংক্রিয় Proration Engine কাজ করে। বর্তমান প্ল্যানের অব্যবহৃত দিনগুলোর সমমূল্যের টাকা (Unused Proration Credit) হিসাব করে নতুন প্যাকেজের মূল বিল থেকে তাৎক্ষণিকভাবে বাদ দেওয়া হয়, ফলে গ্রাহককে শুধুমাত্র পার্থক্যকৃত নেট চার্জ প্রদান করতে হয়।'
      },
      {
        num: '৫.৩',
        heading: 'পেমেন্ট মেথড ও ভেরিফিকেশন প্রোটোকল',
        content: 'গ্রাহক অনলাইন গেটওয়ে (SSLCommerz, bKash Checkout, Nagad Direct) কিংবা অফলাইন মার্চেন্ট ট্রান্সফারের (বিকাশ, নগদ, রকেট এবং কর্পোরেট ব্যাংক অ্যাকাউন্ট) মাধ্যমে পেমেন্ট করতে পারবেন। অফলাইন পেমেন্টের ক্ষেত্রে ট্রানজ্যাকশন আইডি ও রসিদ আপলোডের পর কেন্দ্রীয় অডিট টিম কর্তৃক সর্বোচ্চ ২৪ ঘণ্টার মধ্যে যাচাই ও অনুমোদন সম্পন্ন হয়।'
      },
      {
        num: '৫.৪',
        heading: 'ডিজিটাল ইনভয়েসিং ও প্রাতিষ্ঠানিক ট্যাক্স রেকর্ড',
        content: 'লেনদেন সফল হওয়ামাত্রই গ্রাহক প্যানেল থেকে ইউনিক ইনভয়েস নম্বর (যেমন: INV-২০২৬-XXXXXX), কোম্পানির ট্যাক্স আইডেন্টিফিকেশন (BIN) ও বিশদ হিসাব সম্বলিত অফিশিয়াল পিডিএফ ইনভয়েস ডাউনলোড করা যাবে যা গ্রাহকের কর রেয়াত ও অডিটের জন্য সম্পূর্ণ বৈধ।'
      },
      {
        num: '৫.৫',
        heading: 'মেয়াদোত্তীর্ণ নবায়ন ও কিউ শিডিউলার নোটিফিকেশন',
        content: 'সাবস্ক্রিপশনের মেয়াদ শেষ হওয়ার ৭ দিন, ৩ দিন এবং ১ দিন পূর্বে গ্রাহকের নিবন্ধিত মোবাইল ও ইমেইলে স্বয়ংক্রিয় রিমাইন্ডার প্রেরিত হবে। নির্ধারিত সময়ের মধ্যে নবায়ন না হলে ৭ দিনের গ্রেস পিরিয়ড শেষে স্বয়ংক্রিয় ব্যাকগ্রাউন্ড কিউ অ্যাকাউন্ট রেস্ট্রিক্ট করবে।'
      },
      {
        num: '৫.৬',
        heading: 'রিফান্ড ও ক্যান্সেলেশন নীতিমালা (Refund Terms)',
        content: 'ডিজিটাল সফটওয়্যার লাইসেন্স তাৎক্ষণিকভাবে সক্রিয় হয়ে যাওয়ায় এবং ট্রায়াল সুবিধা বিদ্যমান থাকায় সাধারণত কোনো রিফান্ড প্রযোজ্য নয়। তবে কারিগরি ত্রুটির কারণে দ্বৈত পেমেন্ট (Double Deduction) হলে ব্যাংক স্টেটমেন্ট যাচাইপূর্বক ৫ থেকে ৭ কার্যদিবসের মধ্যে মূল একাউন্টে সম্পূর্ণ টাকা ফেরত দেওয়া হবে।'
      }
    ]
  }

  const legalContent = {
    terms: cms.legal_terms || defaultTerms,
    privacy: cms.legal_privacy || defaultPrivacy,
    refund: cms.legal_refund || defaultRefund,
    subscription: cms.legal_subscription || defaultSubscription,
    billing: cms.legal_billing || defaultBilling
  }

  const activeContent = legalContent[activeTab] || legalContent.terms
  const activeTabMeta = tabs.find(t => t.id === activeTab)

  return (
    <div className="page-wrapper" style={{ background: 'var(--mc-bg, #F8FAFC)', paddingBottom: 100, minHeight: '80vh' }}>
      <Container className="pt-4">
        {/* Breadcrumb */}
        <BreadcrumbHUD links={[{ label: 'আইনি ও পলিসি কেন্দ্র' }]} />

        {/* Hero Banner Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          borderRadius: 5,
          padding: '40px 36px',
          color: 'white',
          marginTop: 20,
          marginBottom: 36,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)'
        }}>
          {/* Subtle Glows */}
          <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, background: 'radial-gradient(circle, rgba(0,212,175,0.25) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -40, width: 220, height: 220, background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: 800 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 5, background: 'rgba(0,212,175,0.12)', border: '1px solid rgba(0,212,175,0.3)', color: '#00D4AF', fontSize: 13, fontWeight: 800, marginBottom: 16 }}>
              <IconShieldCheck size={16} /> Doctor Booklet Legal Documentation
            </div>
            <h1 style={{ fontWeight: 900, fontSize: 'clamp(26px, 4vw, 36px)', color: 'white', marginBottom: 12, letterSpacing: '-0.5px' }}>
              আইনি ও অফিসিয়াল পলিসি কেন্দ্র
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
              আমাদের প্ল্যাটফর্মের ব্যবহারবিধি, গোপনীয়তা সুরক্ষা এবং বাতিলকরণ নীতি সম্পর্কিত বিস্তারিত দিকনির্দেশনা নিচে প্রদান করা হলো।
            </p>
          </div>
        </div>

        <Row className="g-4">
          {/* Sidebar Tabs */}
          <Col lg={4} xl={3}>
            <div style={{ 
              background: theme === 'dark' ? '#1E293B' : '#FFFFFF', 
              borderRadius: 5, 
              padding: 20, 
              border: '1px solid var(--mc-border, rgba(0,0,0,0.08))',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              position: 'sticky',
              top: 110
            }}>
              <h6 style={{ 
                fontSize: 12, 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em', 
                color: 'var(--mc-text-muted, #64748B)',
                marginBottom: 16,
                paddingLeft: 8
              }}>
                নীতিসূচি (Policies)
              </h6>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabSelect(tab.id)}
                      style={{
                        textAlign: 'left',
                        padding: '16px 18px',
                        borderRadius: 5,
                        border: isActive ? '1px solid #00D4AF' : '1px solid transparent',
                        background: isActive 
                          ? (theme === 'dark' ? 'rgba(0,212,175,0.15)' : '#ECFDF5') 
                          : (theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC'),
                        color: isActive ? (theme === 'dark' ? '#00D4AF' : '#047857') : 'var(--mc-text, #1E293B)',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: 14,
                        transition: 'all 0.25s ease',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        gap: 12,
                        width: '100%'
                      }}
                    >
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 36, 
                        height: 36, 
                        borderRadius: 5, 
                        background: isActive ? '#00A88C' : 'rgba(0,0,0,0.05)', 
                        color: isActive ? 'white' : 'var(--mc-text-muted, #64748B)',
                        flexShrink: 0,
                        transition: 'all 0.25s ease'
                      }}>
                        {tab.icon}
                      </span>
                      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 14, fontWeight: isActive ? 800 : 700, lineHeight: 1.3 }}>
                          {tab.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--mc-text-muted, #64748B)', marginTop: 2, fontWeight: 500 }}>
                          {tab.englishTitle}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Quick Contact Box */}
              <div style={{ 
                marginTop: 24, 
                padding: 16, 
                borderRadius: 5, 
                background: 'linear-gradient(135deg, rgba(0,168,140,0.08) 0%, rgba(0,168,140,0.02) 100%)', 
                border: '1px solid rgba(0,168,140,0.2)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00A88C', fontWeight: 800, fontSize: 13, marginBottom: 6 }}>
                  <IconInfoCircle size={18} /> সহায়তার জন্য
                </div>
                <p style={{ fontSize: 12, color: 'var(--mc-text-muted, #475569)', margin: 0, lineHeight: 1.5 }}>
                  যেকোনো আইনি প্রশ্ন বা সহায়তার জন্য ইমেইল করুন:
                </p>
                <a href="mailto:legal@doctorbooklet.com.bd" style={{ fontSize: 12, fontWeight: 800, color: '#00A88C', textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
                  legal@doctorbooklet.com.bd
                </a>
              </div>
            </div>
          </Col>

          {/* Main Content Area */}
          <Col lg={8} xl={9}>
            <div style={{ 
              background: theme === 'dark' ? '#1E293B' : '#FFFFFF', 
              borderRadius: 5, 
              padding: 'clamp(24px, 4vw, 48px)', 
              border: '1px solid var(--mc-border, rgba(0,0,0,0.08))', 
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)' 
            }}>
              {/* Document Header */}
              <div style={{ borderBottom: '1px solid var(--mc-border, rgba(0,0,0,0.08))', paddingBottom: 24, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: 5, 
                      background: '#ECFDF5', 
                      color: '#047857', 
                      fontSize: 12, 
                      fontWeight: 800, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6 
                    }}>
                      <IconCheck size={14} /> অফিসিয়াল পলিসি
                    </span>
                    <span style={{ 
                      fontSize: 13, 
                      color: 'var(--mc-text-muted, #64748B)', 
                      fontWeight: 600, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6 
                    }}>
                      <IconClock size={14} /> সর্বশেষ হালনাগাদ: {activeTabMeta?.updatedDate}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 5,
                      border: '1px solid var(--mc-border, rgba(0,0,0,0.15))',
                      background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                      color: 'var(--mc-text, #0F172A)',
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: 'pointer'
                    }}
                  >
                    <IconPrinter size={15} /> প্রিন্ট / সেভ করুন
                  </button>
                </div>

                <h2 style={{ 
                  fontWeight: 900, 
                  fontSize: 'clamp(22px, 3vw, 30px)', 
                  color: 'var(--mc-text, #0F172A)', 
                  marginBottom: 10,
                  letterSpacing: '-0.5px'
                }}>
                  {activeContent.title}
                </h2>
                
                <p style={{ fontSize: 16, color: 'var(--mc-text-muted, #475569)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                  {activeContent.subtitle}
                </p>
              </div>

              {/* Callout Notice */}
              <div style={{ 
                padding: '18px 22px', 
                borderRadius: 5, 
                background: 'rgba(0, 168, 140, 0.05)', 
                borderLeft: '4px solid #00A88C', 
                marginBottom: 36 
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <IconFileText size={22} color="#00A88C" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--mc-text, #1E293B)', lineHeight: 1.6, fontWeight: 600 }}>
                    {activeContent.notice}
                  </p>
                </div>
              </div>

              {/* Policy Clauses / Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {activeContent.sections.map((section, index) => (
                  <div 
                    key={index}
                    style={{ 
                      paddingBottom: index !== activeContent.sections.length - 1 ? 28 : 0,
                      borderBottom: index !== activeContent.sections.length - 1 ? '1px dashed var(--mc-border, rgba(0,0,0,0.08))' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 900, 
                        color: '#00A88C', 
                        background: 'rgba(0,168,140,0.1)', 
                        padding: '2px 8px', 
                        borderRadius: 5 
                      }}>
                        ধারাক্রম {section.num}
                      </span>
                      <h4 style={{ 
                        fontWeight: 800, 
                        fontSize: 18, 
                        color: 'var(--mc-text, #0F172A)', 
                        margin: 0 
                      }}>
                        {section.heading}
                      </h4>
                    </div>
                    
                    <p style={{ 
                      fontSize: 15, 
                      color: 'var(--mc-text-muted, #334155)', 
                      lineHeight: 1.8, 
                      fontWeight: 500, 
                      margin: 0 
                    }}>
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Document Footer Verification */}
              <div style={{ 
                marginTop: 48, 
                padding: '24px 28px', 
                borderRadius: 5, 
                background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC', 
                border: '1px solid var(--mc-border, rgba(0,0,0,0.06))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 5, background: 'linear-gradient(135deg, #00E5BC 0%, #00967D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <IconShieldCheck size={24} />
                  </div>
                  <div>
                    <h6 style={{ margin: 0, fontWeight: 800, fontSize: 14, color: 'var(--mc-text, #0F172A)' }}>Doctor Booklet Legal Compliance Team</h6>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--mc-text-muted, #64748B)', fontWeight: 500 }}>ঢাকা, বাংলাদেশ • সর্বস্বত্ব সংরক্ষিত</p>
                  </div>
                </div>

                <a 
                  href="mailto:legal@doctorbooklet.com.bd"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 5,
                    background: '#00A88C',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <IconMail size={16} /> সরাসরি যোগাযোগ করুন
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import BreadcrumbHUD from '../../components/common/BreadcrumbHUD'
import { getContent } from '../../utils/contentService'
import { 
  ShieldCheck, 
  Lock, 
  RotateCcw, 
  Mail, 
  CheckCircle2, 
  FileText, 
  Clock, 
  FileCheck2, 
  CreditCard, 
  Printer,
  Search,
  Check,
  Copy,
  ExternalLink,
  Building2,
  AlertCircle,
  HelpCircle,
  Scale
} from 'lucide-react'

export default function LegalPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['terms', 'privacy', 'refund', 'subscription', 'billing']
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam && validTabs.includes(tabParam) ? tabParam : 'terms')
  const [cms, setCms] = useState(getContent())
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedClause, setCopiedClause] = useState(null)

  useEffect(() => {
    const target = tabParam && validTabs.includes(tabParam) ? tabParam : 'terms'
    if (target !== activeTab) {
      setActiveTab(target)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
    setSearchQuery('')
  }

  const handleCopyClause = (clauseNum, text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(`${clauseNum}: ${text}`)
    }
    setCopiedClause(clauseNum)
    setTimeout(() => setCopiedClause(null), 2500)
  }

  const tabs = [
    { 
      id: 'terms', 
      title: 'ব্যবহারের শর্তাবলী', 
      englishTitle: 'Terms of Service',
      category: 'সাধারণ ও রোগী',
      icon: <ShieldCheck size={18} />,
      updatedDate: cms.legal_terms?.updated_date || 'অক্টোবর ২০২৬'
    },
    { 
      id: 'privacy', 
      title: 'গোপনীয়তা ও ডেটা সুরক্ষা', 
      englishTitle: 'Privacy & Data Protection',
      category: 'তথ্য নিরাপত্তা',
      icon: <Lock size={18} />,
      updatedDate: cms.legal_privacy?.updated_date || 'অক্টোবর ২০২৬'
    },
    { 
      id: 'refund', 
      title: 'রিফান্ড ও বাতিলকরণ নীতি', 
      englishTitle: 'Refund & Cancellation Policy',
      category: 'পেমেন্ট ও রিফান্ড',
      icon: <RotateCcw size={18} />,
      updatedDate: cms.legal_refund?.updated_date || 'অক্টোবর ২০২৬'
    },
    { 
      id: 'subscription', 
      title: 'মাস্টার সাবস্ক্রিপশন চুক্তি (B2B)', 
      englishTitle: 'Master Subscription Agreement',
      category: 'ডাক্তার ও হাসপাতাল',
      icon: <FileCheck2 size={18} />,
      updatedDate: cms.legal_subscription?.updated_date || 'অক্টোবর ২০২৬'
    },
    { 
      id: 'billing', 
      title: 'বিলিং, মূসক ও প্রোরেশন নীতি', 
      englishTitle: 'Enterprise Billing & Tax Policy',
      category: 'অর্থ ও ট্যাক্স',
      icon: <CreditCard size={18} />,
      updatedDate: cms.legal_billing?.updated_date || 'অক্টোবর ২০২৬'
    }
  ]

  // Default Comprehensive Legal Documents for Doctor Booklet
  const defaultTerms = {
    title: 'ব্যবহারের শর্তাবলী (Terms of Service)',
    subtitle: 'Doctor Booklet ডিজিটাল স্বাস্থ্যসেবা ইকোসিস্টেম ব্যবহারের আইনি ও পরিচালনা সংক্রান্ত নিয়মাবলী।',
    effective_date: '০১ অক্টোবর, ২০২৬',
    notice: 'গুরুত্বপূর্ণ বিজ্ঞপ্তি: Doctor Booklet প্ল্যাটফর্ম ব্যবহারের পূর্বে অনুগ্রহপূর্বক এই ব্যবহারের শর্তাবলী মনোযোগ সহকারে পাঠ করুন। প্ল্যাটফর্মে অ্যাকাউন্ট খোলা, ডাক্তারের সিরিয়াল গ্রহণ কিংবা সেবা ব্যবহারের মাধ্যমে আপনি এই শর্তাবলীতে আইনত আবদ্ধ বলে গণ্য হবেন।',
    sections: [
      {
        num: '১.১',
        heading: 'ভূমিকা ও সেবা পরিচিতি (Scope of Service)',
        content: 'Doctor Booklet বাংলাদেশ সরকারের ডিজিটাল স্বাস্থ্যসেবা আধুনিকীকরণ নীতিমালার আওতায় পরিচালিত একটি কেন্দ্রীয় হেলথ-টেক প্ল্যাটফর্ম। প্ল্যাটফর্মটি রোগী, বিএমডিসি (BMDC) সনদপ্রাপ্ত অভিজ্ঞ চিকিৎসক এবং নিবন্ধিত হাসপাতাল/ক্লিনিকসমূহের মধ্যে নিরবচ্ছিন্ন ও স্বচ্ছ সংযোগ স্থাপন করে। প্ল্যাটফর্মের মূল সেবাসমূহের মধ্যে রয়েছে অনলাইন ডাক্তার সিরিয়াল ম্যানেজমেন্ট, তাৎক্ষণিক টিকিট ইস্যু, ইলেকট্রনিক হেলথ রেকর্ড (EHR) সংরক্ষণ এবং ওপিডি ডিজিটাল ডিসপ্লে বোর্ড প্রযুক্তি।'
      },
      {
        num: '১.২',
        heading: 'অ্যাকাউন্ট নিবন্ধন, নিরাপত্তা ও তথ্যের সত্যতা',
        content: 'সেবা গ্রহণের জন্য ব্যবহারকারীকে তার নিজস্ব জাতীয় পরিচয়পত্র (NID) বা জন্মনিবন্ধন ও সক্রিয় মোবাইল নম্বর ব্যবহারের মাধ্যমে অ্যাকাউন্ট খুলতে হবে। ব্যবহারকারী তার অ্যাকাউন্টের ওটিপি (OTP) ও পাসওয়ার্ডের গোপনীয়তার জন্য সম্পূর্ণ দায়ী থাকবেন। কোনো ভুল, ভুয়া বা অন্যের পরিচয় ব্যবহার করে সিরিয়াল নিলে বা বিভ্রান্তিকর তথ্য দিলে সংশ্লিষ্ট অ্যাকাউন্ট তাৎক্ষণিকভাবে স্থগিত বা বাতিল করার আইনি অধিকার প্ল্যাটফর্ম সংরক্ষণ করে।'
      },
      {
        num: '১.৩',
        heading: 'ডাক্তারের সিরিয়াল বুকিং ও ডিজিটাল টিকিট বৈধতা',
        content: 'Doctor Booklet প্ল্যাটফর্মের মাধ্যমে সিরিয়াল সফলভাবে সম্পন্ন হওয়ামাত্রই সিস্টেম একটি ইউনিক কিউআর কোড ও বারকোডযুক্ত ডিজিটাল সিরিয়াল টিকিট ইস্যু করে এবং রোগীর মোবাইলে এসএমএস অ্যালার্ট পাঠায়। নির্ধারিত সময়ে চেম্বার বা ওপিডি কাউন্টারে উপস্থিত থাকা রোগীর দায়িত্ব। কোনো বিশেষ জরুরি অস্ত্রোপচার, ট্রাফিক বা চিকিৎসকের জরুরি কল-আউটের কারণে চেম্বারের সময়সূচিতে সাময়িক পরিবর্তন ঘটলে তা প্ল্যাটফর্মের মাধ্যমে রোগীকে অবহিত করা হবে।'
      },
      {
        num: '১.৪',
        heading: 'মেডিকেল ডিসক্লেইমার ও জরুরি সেবা সংক্রান্ত সীমাবদ্ধতা',
        content: 'Doctor Booklet একটি স্বাস্থ্যসেবা সমন্বয়কারী প্রযুক্তিগত প্ল্যাটফর্ম (Technology Enabler), কোনো প্রত্যক্ষ হাসপাতাল বা জরুরি সেবা প্রদানকারী প্রতিষ্ঠান নয়। প্ল্যাটফর্মের মাধ্যমে প্রদত্ত পরামর্শ সংশ্লিষ্ট চিকিৎসকের পেশাগত বিবেচনার ওপর নির্ভর করে। তীব্র শারীরিক জটিলতা, স্ট্রোক, সড়ক দুর্ঘটনা, বিষক্রিয়া বা যেকোনো লাইফ-থ্রেটেনিং জরুরি পরিস্থিতিতে প্ল্যাটফর্মে অপেক্ষা না করে অবিলম্বে নিকটস্থ হাসপাতালের জরুরি বিভাগে (Emergency Department) যোগাযোগ করার নির্দেশ দেওয়া যাচ্ছে।'
      },
      {
        num: '১.৫',
        heading: 'টেলিমেডিসিন ও ডিজিটাল প্রেসক্রিপশনের আইনি মানদণ্ড',
        content: 'প্ল্যাটফর্মে সংরক্ষিত ও প্রস্তুতকৃত প্রতিটি ডিজিটাল প্রেসক্রিপশন বিএমডিসি (BMDC) সনদপ্রাপ্ত চিকিৎসকের স্বতন্ত্র রেজিস্ট্রেশন নম্বরের সাথে সমন্বিত। চিকিৎসকের পরামর্শ ব্যতীত প্রেসক্রিপশনের কোনো ওষুধ নিজে নিজে পরিবর্তন বা অতিরিক্ত গ্রহণ করা আইনত ও স্বাস্থ্যগতভাবে অনুচিত।'
      },
      {
        num: '১.৬',
        heading: 'মেধা সম্পত্তি ও প্ল্যাটফর্মের স্বত্বাধিকার (Intellectual Property)',
        content: 'Doctor Booklet-এর ট্রেডমার্ক, ব্র্যান্ড লোগো, কোডবেস, ইউজার ইন্টারফেস আর্কিটেকচার, ডেটাবেস ডিজাইন ও কনটেন্ট আন্তর্জাতিক মেধা সম্পত্তি আইন ও বাংলাদেশের কপিরাইট আইনের অধীনে সংরক্ষিত। অনুমতি ব্যতীত প্ল্যাটফর্মের কোনো অংশ নকল করা, রিভার্স ইঞ্জিনিয়ারিং বা অননুমোদিত বাণিজ্যিক উদ্দেশ্যে ব্যবহার কঠোরভাবে আইনত দণ্ডনীয়।'
      }
    ]
  }

  const defaultPrivacy = {
    title: 'গোপনীয়তা ও ডেটা সুরক্ষা নীতি (Privacy & Data Protection)',
    subtitle: 'আপনার ব্যক্তিগত ও সংবেদনশীল মেডিকেল তথ্যের নিরাপত্তা, সুরক্ষা এবং বিশ্বমানের গোপনীয়তা রক্ষার অঙ্গীকার।',
    effective_date: '০১ অক্টোবর, ২০২৬',
    notice: 'Doctor Booklet প্ল্যাটফর্মে আপনার তথ্যের সুরক্ষা আমাদের প্রধান অগ্রাধিকার। আমরা ২৫৬-বিট SSL/TLS ডাটা এনক্রিপশন প্রোটোকল অনুসরণ করি এবং কোনো ব্যবহারকারীর তথ্য বাণিজ্যিক উদ্দেশ্যে কোনো তৃতীয় পক্ষের কাছে বিক্রি করি না।',
    sections: [
      {
        num: '২.১',
        heading: 'সংগৃহীত তথ্যের ধরন ও উৎস (Information Collected)',
        content: 'মানসম্মত স্বাস্থ্যসেবা প্রদানের স্বার্থে আমরা ব্যবহারকারীর নাম, মোবাইল নম্বর, ইমেইল, বয়স, লিঙ্গ, রক্তের গ্রুপ এবং রোগীর অনুমোদন সাপেক্ষে পূর্ববর্তী প্রেসক্রিপশন ও ডায়াগনস্টিক রিপোর্ট সংগ্রহ ও সংরক্ষণ করি। ডাক্তার ও হাসপাতালের ক্ষেত্রে বিএমডিসি সনদ নম্বর, ডিগ্রি, চেম্বার শিডিউল এবং প্রাতিষ্ঠানিক ঠিকানা যাচাইপূর্বক সংগ্রহ করা হয়।'
      },
      {
        num: '২.২',
        heading: 'তথ্য ব্যবহারের উদ্দেশ্য ও সীমা (Purpose of Processing)',
        content: 'সংগৃহীত তথ্য কেবল ডাক্তার অ্যাপয়েন্টমেন্ট শিডিউলিং, লাইভ সিরিয়াল স্ট্যাটাস ট্র্যাকিং, জরুরি এসএমএস নোটিফিকেশন, ডিজিটাল টিকিট জেনারেশন এবং রোগীর নিজের সুবিধার্থে প্রেসক্রিপশন হিস্ট্রি প্রদর্শনের জন্য ব্যবহার করা হয়। ব্যবহারকারীর স্পষ্ট সম্মতি ব্যতীত কোনো ব্যক্তিগত তথ্য বিজ্ঞাপন সংস্থা বা তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।'
      },
      {
        num: '২.৩',
        heading: 'এন্ড-টু-এন্ড এনক্রিপশন ও ক্লাউড ডেটা নিরাপত্তা',
        content: 'প্ল্যাটফর্মে সংরক্ষিত সকল ডেটা ট্রানজিটে (In Transit) এবং বিশ্রামে (At Rest) আন্তর্জাতিক মানের AES-256 বিট এনক্রিপশন স্ট্যান্ডার্ড দ্বারা সুরক্ষিত থাকে। সার্ভারগুলোতে কঠোর ফায়ারওয়াল, ব্যাকআপ রেপ্লিকেশন এবং রোল-বেসড এক্সেস কন্ট্রোল (RBAC) বাস্তবায়িত আছে।'
      },
      {
        num: '২.৪',
        heading: 'রোগীর ডেটা মালিকানা ও অধিকার (Patient Data Rights)',
        content: 'রোগী যে কোনো সময় তার প্রোফাইলে সংরক্ষিত প্রেসক্রিপশন ও মেডিকেল হিস্ট্রি বিনামূল্যে পিডিএফ ফরম্যাটে ডাউনলোড বা প্রিন্ট করার অধিকার রাখেন। রোগী চাইলে তার ডেটা স্থায়ীভাবে নিষ্ক্রিয় (Delete/Archive) করার জন্য আমাদের সাপোর্ট ডেস্কে লিখিত অনুরোধ পাঠাতে পারেন।'
      },
      {
        num: '২.৫',
        heading: 'কুকি ও সিকিউর সেশন ট্র্যাকিং পলিসি',
        content: 'ব্যবহারকারীর নিরবচ্ছিন্ন লগইন সেশন চালু রাখতে এবং প্ল্যাটফর্মের পারফরম্যান্স বিশ্লেষণে আমরা নিরাপদ ও এনক্রিপ্টেড কুকি ব্যবহার করি। কোনো কুকি ব্যবহারকারীর ব্যক্তিগত আর্থিক তথ্য বা পাসওয়ার্ড ট্র্যাক করে না।'
      }
    ]
  }

  const defaultRefund = {
    title: 'রিফান্ড ও বাতিলকরণ নীতি (Refund & Cancellation Policy)',
    subtitle: 'অনলাইন সিরিয়াল বুকিং বাতিল, চেম্বার পুনঃনির্ধারণ এবং অর্থ ফেরতের স্বচ্ছ ও সুস্পষ্ট নির্দেশিকা।',
    effective_date: '০১ অক্টোবর, ২০২৬',
    notice: 'বুকিং সংক্রান্ত যেকোনো বাতিলকরণের ক্ষেত্রে আর্থিক স্বচ্ছতা বজায় রাখতে এই নীতিমালা প্রযোজ্য। অনুমোদিত রিফান্ডের অর্থ সরাসরি গ্রাহকের মূল পেমেন্ট মাধ্যমে ফেরত দেওয়া হয়।',
    sections: [
      {
        num: '৩.১',
        heading: 'রোগী কর্তৃক অ্যাপয়েন্টমেন্ট বাতিল ও সময়সীমা',
        content: 'নির্ধারিত অ্যাপয়েন্টমেন্ট সময়ের অন্তত ৪ (চার) ঘণ্টা পূর্বে রোগী তার ড্যাশবোর্ড থেকে সহজেই অ্যাপয়েন্টমেন্ট বাতিল করতে পারবেন। সময়সীমা মেনে বাতিল করলে পরিশোধিত সার্ভিস ফি সম্পূর্ণ রিফান্ড পাওয়ার যোগ্য হবেন।'
      },
      {
        num: '৩.২',
        heading: 'ডাক্তার বা হাসপাতাল কর্তৃক বাতিলকরণে শতভাগ রিফান্ড',
        content: 'যদি অনাকাঙ্ক্ষিত কোনো কারণে সংশ্লিষ্ট চিকিৎসক অনুপস্থিত থাকেন, চেম্বার বন্ধ থাকে বা হাসপাতাল কর্তৃপক্ষ সেবাটি স্থগিত করে, তবে রোগী তাৎক্ষণিকভাবে ১০০% রিফান্ড পাবেন অথবা তার সুবিধাজনক পরবর্তী যেকোনো স্লটে ফ্রিতে সিরিয়াল রিশিডিউল (Reschedule) করতে পারবেন।'
      },
      {
        num: '৩.৩',
        heading: 'রিফান্ড প্রসেসিং সময় ও চ্যানেল (Settlement Timeline)',
        content: 'অনুমোদিত রিফান্ডের টাকা ডিজিটাল পেমেন্ট গেটওয়ের মাধ্যমে ৩ থেকে ৭ কর্মদিবসের (Working Days) মধ্যে ব্যবহারকারীর মূল বিকাশ, নগদ, রকেট বা ব্যাংক অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে ক্রেডিট হয়ে যাবে। প্রতিটি রিফান্ডের সাথে একটি ইউনিক রিফান্ড ট্র্যাকিং আইডি প্রদান করা হয়।'
      },
      {
        num: '৩.৪',
        heading: 'অফেরতযোগ্য ক্ষেত্রসমূহ (Non-Refundable Cases)',
        content: 'যদি রোগী নির্ধারিত সময়ে চেম্বারে উপস্থিত না হন (No-Show) এবং অ্যাপয়েন্টমেন্টের নির্ধারিত সময়ের ৪ ঘণ্টা পূর্বে সিস্টেমের মাধ্যমে বাতিল না করেন, তবে সংশ্লিষ্ট স্লটের বুকিং ফি অফেরতযোগ্য বলে গণ্য হবে।'
      },
      {
        num: '৩.৫',
        heading: 'রিফান্ড বিরোধ নিষ্পত্তি ও হেল্পডেস্ক',
        content: 'রিফান্ড প্রক্রিয়ায় কোনো ব্যাংকিং বিলম্ব বা সমস্যা হলে ট্রানজ্যাকশন আইডি ও বুকিং রেফারেন্স সহ আমাদের রিফান্ড হেল্পডেস্কে (refund@doctorbooklet.com.bd) যোগাযোগ করার অনুরোধ করা যাচ্ছে। আমাদের ফাইন্যান্স টিম সর্বোচ্চ ২৪ ঘণ্টার মধ্যে বিষয়টি নিষ্পত্তি করবে।'
      }
    ]
  }

  const defaultSubscription = {
    title: 'মাস্টার সাবস্ক্রিপশন চুক্তি (Master Subscription Agreement - B2B)',
    subtitle: 'Doctor Booklet প্ল্যাটফর্মে নিবন্ধিত চিকিৎসক, স্বাস্থ্য ক্লিনিক ও হাসপাতালগুলোর প্রাতিষ্ঠানিক সেবা ও সফটওয়্যার চুক্তি।',
    effective_date: '০১ অক্টোবর, ২০২৬',
    notice: 'আইনি নোটিশ: এটি স্বাস্থ্যসেবা প্রদানকারী (ডাক্তার / হাসপাতাল প্রশাসন) এবং Doctor Booklet Technologies-এর মধ্যকার একটি দ্বিপাক্ষিক প্রাতিষ্ঠানিক চুক্তি। কোনো প্যাকেজ সক্রিয় করার মাধ্যমে সংশ্লিষ্ট পক্ষ এই চুক্তির শর্তাবলীতে আইনত দায়বদ্ধ থাকবেন।',
    sections: [
      {
        num: '৪.১',
        heading: 'চুক্তির পক্ষসমূহ ও প্রাতিষ্ঠানিক সুযোগ-সুবিধা',
        content: 'এই সেবা চুক্তিটি Doctor Booklet Technologies ("প্ল্যাটফর্ম") এবং সাবস্ক্রিপশন গ্রহণকারী নিবন্ধিত চিকিৎসক বা হাসপাতাল/ক্লিনিক কর্তৃপক্ষ ("গ্রাহক")-এর মধ্যে কার্যকর হবে। প্ল্যাটফর্মের ডিজিটাল চেম্বার সফটওয়্যার, ওপিডি সিরিয়াল ডিসপ্লে বোর্ড, প্রেসক্রিপশন প্যাড জেনারেটর এবং প্রাতিষ্ঠানিক সিট ডিরেক্টরি ব্যবহারের ক্ষেত্রে এই শর্তাবলী প্রযোজ্য।'
      },
      {
        num: '৪.২',
        heading: 'রোগীর মেডিকেল রেকর্ডের শতভাগ মালিকানা ও পেশাগত মর্যাদা',
        content: 'প্ল্যাটফর্মে সংরক্ষিত সকল প্রেসক্রিপশন, রোগী তালিকা এবং ক্লিনিক্যাল হিস্ট্রির অবিসংবাদিত মালিক সংশ্লিষ্ট চিকিৎসক বা হাসপাতাল কর্তৃপক্ষ। Doctor Booklet কেবল আন্তর্জাতিক মানসম্পন্ন এনক্রিপ্টেড ক্লাউড ডাটা প্রসেসর হিসেবে দায়িত্ব পালন করে। চিকিৎসকের পূর্বানুমতি ব্যতীত প্ল্যাটফর্ম কখনোই কোনো রোগীর স্বাস্থ্য সংক্রান্ত তথ্য তৃতীয় পক্ষের নিকট বিক্রয়, বাণিজ্যিক বিপণন বা প্রকাশ করবে না।'
      },
      {
        num: '৪.৩',
        heading: 'সার্ভিস লেভেল অ্যাগ্রিমেন্ট (SLA) ও ৯৯.৯% আপটাইম প্রতিশ্রুতি',
        content: 'Doctor Booklet গ্রাহকদের সার্বক্ষণিক স্বাস্থ্যসেবা নিশ্চিত করতে ৯৯.৯% সিস্টেম আপটাইম বজায় রাখতে প্রতিশ্রুতিবদ্ধ। নিয়মিত ব্যাকআপ ও সিডিউল রক্ষণাবেক্ষণের কাজ সাধারণত রাত ২:০০টা থেকে ভোর ৪:০০টার মধ্যে পরিচালিত হয় এবং গ্রাহককে পূর্বেই ড্যাশবোর্ড নোটিফিকেশনের মাধ্যমে অবহিত করা হয়।'
      },
      {
        num: '৪.৪',
        heading: 'হাসপাতাল সিট কোটা ও বিএমডিসি ভেরিফিকেশন বাধ্যবাধকতা',
        content: 'হাসপাতাল কর্তৃপক্ষ তাদের কেনা প্যাকেজের ডাক্তার সিট কোটার (Doctor Seat Allocation) আওতায় বিশেষজ্ঞ চিকিৎসকদের সংযুক্ত করতে পারবেন। প্রতিটি চিকিৎসকের নাম, ডিগ্রি ও বিএমডিসি (BMDC) রেজিস্ট্রেশন নম্বরের প্রাথমিক সত্যতা যাচাইয়ের দায়ভার সংশ্লিষ্ট হাসপাতাল প্রশাসনের ওপর বর্তাবে।'
      },
      {
        num: '৪.৫',
        heading: 'ফ্রি ট্রায়াল (১৪ দিন), নবায়ন ও সহনশীল গ্রেস পিরিয়ড (৭ দিন)',
        content: 'নতুন ডাক্তার ও হাসপাতালের জন্য ১৪ দিনের ফুল-ফিচার ফ্রি ট্রায়াল প্রদান করা হয়। সাবস্ক্রিপশনের মেয়াদ শেষ হওয়ার পর সেবা সচল রাখতে ৭ দিনের গ্রেস পিরিয়ড দেওয়া হয়। নির্ধারিত সময়ের মধ্যে নবায়ন না হলে সফটওয়্যার অ্যাক্সেস সীমিত করা হতে পারে, তবে গ্রাহকের পূর্বে সংরক্ষিত ডেটা সম্পূর্ণ অক্ষত থাকবে।'
      },
      {
        num: '৪.৬',
        heading: 'চিকিৎসাগত সিদ্ধান্তের দায়মুক্তি (Medical Negligence Disclaimer)',
        content: 'Doctor Booklet শুধুমাত্র একটি ডিজিটাল ম্যানেজমেন্ট ও প্র্যাকটিস অটোমেশন সফটওয়্যার। রোগীর চিকিৎসাগত পরামর্শ, ওষুধ নির্বাচন বা ক্লিনিক্যাল সিদ্ধান্তের সম্পূর্ণ পেশাগত ও আইনি দায়ভার সংশ্লিষ্ট সনদপ্রাপ্ত চিকিৎসকের। প্ল্যাটফর্ম কোনো প্রকার চিকিৎসাগত অবহেলার (Medical Negligence) জন্য আইনত দায়ী থাকবে না।'
      },
      {
        num: '৪.৭',
        heading: 'চুক্তি সমাপ্তি ও ডেটা এক্সপোর্ট অধিকার (Exit & Portability)',
        content: 'উভয় পক্ষ ৩০ দিনের লিখিত নোটিশে সাবস্ক্রিপশন সমাপ্ত করতে পারবে। সাবস্ক্রিপশন সমাপ্ত হলেও গ্রাহক পরবর্তী ৯০ দিন পর্যন্ত তাদের প্ল্যাটফর্মে সংরক্ষিত সকল পেশেন্ট ও প্রেসক্রিপশন রেকর্ড স্ট্যান্ডার্ড ফরম্যাটে ডাউনলোড বা ব্যাকআপ নেওয়ার আইনগত অধিকার রাখবেন।'
      }
    ]
  }

  const defaultBilling = {
    title: 'বিলিং, পেমেন্ট, মূসক ও প্রোরেশন নীতিমালা (Enterprise Billing Policy)',
    subtitle: 'সাবস্ক্রিপশন চার্জ, ৫% সরকারি ভ্যাট, অনলাইন/ম্যানুয়াল পেমেন্ট অনুমোদন এবং প্যাকেজ আপগ্রেড প্রোরেশনের গাণিতিক নিয়ম।',
    effective_date: '০১ অক্টোবর, ২০২৬',
    notice: 'বাংলাদেশ সরকারের অর্থ আইন ও জাতীয় রাজস্ব বোর্ডের (NBR) মূসক নির্দেশিকা অনুযায়ী এই বিলিং পলিসি পরিচালিত হয়। প্রতিটি সফল পেমেন্টে স্বয়ংক্রিয়ভাবে অডিট-রেডি ডিজিটাল ভ্যাট ইনভয়েস ইস্যু করা হয়।',
    sections: [
      {
        num: '৫.১',
        heading: 'কারেন্সি ও সরকারি ৫% মূসক/ভ্যাট অন্তর্ভুক্তি (NBR Compliant)',
        content: 'প্ল্যাটফর্মের সকল সেবা মূল্য ও সাবস্ক্রিপশন ফি বাংলাদেশী টাকা (BDT)-তে নির্ধারিত। জাতীয় রাজস্ব বোর্ডের প্রচলিত নিয়ম অনুযায়ী প্ল্যাটফর্মের প্রতিটি বাণিজ্যিক লেনদেনে ৫% সরকারি ভ্যাট প্রযোজ্য হবে এবং চূড়ান্ত চেকআউটে তা প্রদর্শিত ও অফিশিয়াল ইনভয়েসে সংযোজিত হবে।'
      },
      {
        num: '৫.২',
        heading: 'স্মার্ট প্রোরেশন ইঞ্জিন ও প্যাকেজ পরিবর্তনের গাণিতিক নিয়ম',
        content: 'চলমান সাবস্ক্রিপশনের মেয়াদ থাকাকালীন গ্রাহক উচ্চতর কোনো প্যাকেজে আপগ্রেড করলে সিস্টেমের স্বয়ংক্রিয় Proration Engine কাজ করে। বর্তমান প্ল্যানের অব্যবহৃত দিনগুলোর সমমূল্যের টাকা (Unused Proration Credit) হিসাব করে নতুন প্যাকেজের মূল বিল থেকে তাৎক্ষণিকভাবে বাদ দেওয়া হয়, ফলে গ্রাহককে শুধুমাত্র পার্থক্যকৃত নেট চার্জ প্রদান করতে হয়।'
      },
      {
        num: '৫.৩',
        heading: 'অনলাইন ও অফলাইন পেমেন্ট মেথড ভেরিফিকেশন',
        content: 'গ্রাহক অনলাইন গেটওয়ে (bKash Direct, Nagad Checkout, Rocket, ভিসা/মাস্টারকার্ড) কিংবা অফলাইন মার্চেন্ট ব্যাংকিংয়ের মাধ্যমে পেমেন্ট করতে পারবেন। অফলাইন পেমেন্টের ক্ষেত্রে ট্রানজ্যাকশন আইডি ও রসিদ আপলোডের পর কেন্দ্রীয় অডিট টিম কর্তৃক সর্বোচ্চ ১২ থেকে ২৪ ঘণ্টার মধ্যে যাচাই ও অনুমোদন সম্পন্ন হয়।'
      },
      {
        num: '৫.৪',
        heading: 'ডিজিটাল ইনভয়েসিং ও প্রাতিষ্ঠানিক ট্যাক্স রেকর্ড',
        content: 'লেনদেন সফল হওয়ামাত্রই গ্রাহক প্যানেল থেকে ইউনিক ইনভয়েস নম্বর (যেমন: INV-২০২৬-XXXXXX), কোম্পানির ট্যাক্স আইডেন্টিফিকেশন (BIN) ও বিশদ হিসাব সম্বলিত অফিশিয়াল পিডিএফ ইনভয়েস ডাউনলোড করা যাবে যা গ্রাহকের কর রেয়াত ও অডিটের জন্য সম্পূর্ণ বৈধ।'
      },
      {
        num: '৫.৫',
        heading: 'নবায়ন কিউ শিডিউলার ও এসএমএস রিমাইন্ডার',
        content: 'সাবস্ক্রিপশনের মেয়াদ শেষ হওয়ার ৭ দিন, ৩ দিন এবং ১ দিন পূর্বে গ্রাহকের নিবন্ধিত মোবাইল ও ইমেইলে স্বয়ংক্রিয় রিমাইন্ডার প্রেরিত হবে। কোনো গোপন অটো-ডেবিট চার্জ কাটা হবে না; গ্রাহকের ম্যানুয়াল অনুমোদন ব্যতীত কোনো অর্থ কর্তন করা হয় না।'
      },
      {
        num: '৫.৬',
        heading: 'দ্বৈত চার্জ বা কারিগরি ত্রুটিতে রিফান্ড নিশ্চয়তা',
        content: 'ডিজিটাল সফটওয়্যার লাইসেন্স তাৎক্ষণিকভাবে সক্রিয় হওয়ায় সাধারণ রিফান্ড প্রযোজ্য নয়। তবে কারিগরি ত্রুটির কারণে দ্বৈত পেমেন্ট (Double Deduction) হলে ব্যাংক স্টেটমেন্ট যাচাইপূর্বক ৫ থেকে ৭ কার্যদিবসের মধ্যে মূল অ্যাকাউন্টে সম্পূর্ণ টাকা ফেরত দেওয়া হবে।'
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

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return activeContent.sections
    const q = searchQuery.toLowerCase()
    return activeContent.sections.filter(s => 
      s.num.toLowerCase().includes(q) ||
      s.heading.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q)
    )
  }, [activeContent, searchQuery])

  return (
    <div className="page-wrapper legal-page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 90 }}>
      <style>{`
        /* ── HERO & AMBIENT HEADER ── */
        .legal-hero {
          background: radial-gradient(130% 100% at 50% 0%, #064E3B 0%, #022C22 55%, #011C15 100%);
          padding-bottom: 75px;
          position: relative;
          overflow: hidden;
          color: white;
        }
        @media (max-width: 768px) {
          .legal-hero {
            padding-bottom: 45px;
          }
        }
        .legal-hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 50%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 50%, transparent 100%);
          pointer-events: none;
        }
        .legal-hero-glow-1 {
          position: absolute;
          top: -140px;
          right: 5%;
          width: 550px;
          height: 550px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 184, 117, 0.24) 0%, rgba(6, 78, 59, 0.06) 50%, transparent 70%);
          filter: blur(40px);
          pointer-events: none;
        }
        .legal-hero-glow-2 {
          position: absolute;
          top: 15%;
          left: -100px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, rgba(6, 78, 59, 0.04) 50%, transparent 70%);
          filter: blur(45px);
          pointer-events: none;
        }

        /* ── MOBILE HORIZONTAL PILL NAV ── */
        .legal-mobile-nav {
          display: none;
          gap: 8px;
          overflow-x: auto;
          padding: 12px 4px 6px;
          margin-top: -30px;
          margin-bottom: 24px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          position: relative;
          z-index: 10;
        }
        @media (max-width: 991px) {
          .legal-mobile-nav {
            display: flex;
          }
        }
        .legal-mobile-nav::-webkit-scrollbar {
          height: 4px;
        }
        .legal-mobile-nav::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }

        /* ── SIDEBAR DESKTOP ── */
        .legal-sidebar-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 20px 16px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          position: sticky;
          top: 100px;
        }
        @media (max-width: 991px) {
          .legal-sidebar-card {
            display: none;
          }
        }

        .legal-tab-btn {
          width: 100%;
          text-align: left;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1.5px solid transparent;
          background: #F8FAFC;
          color: #334155;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
          position: relative;
        }
        .legal-tab-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
          transform: translateX(3px);
        }
        .legal-tab-btn.active {
          background: #ECFDF5;
          border-color: #A7F3D0;
          color: #064E3B;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.12);
        }
        .legal-tab-btn.active .tab-icon-box {
          background: #00B875;
          color: white;
        }

        /* ── MAIN DOCUMENT CONTAINER ── */
        .legal-doc-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 38px 36px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 12px 36px rgba(15, 23, 42, 0.04);
          position: relative;
        }
        @media (max-width: 768px) {
          .legal-doc-card {
            padding: 24px 18px;
            border-radius: 20px;
          }
        }

        .clause-item {
          padding: 20px 22px;
          border-radius: 16px;
          background: #FFFFFF;
          border: 1.5px solid #F1F5F9;
          transition: all 0.2s ease;
        }
        .clause-item:hover {
          border-color: #CBD5E1;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.03);
        }

        /* ── SEARCH INPUT ── */
        .legal-search-box {
          position: relative;
          width: 100%;
          margin-bottom: 24px;
        }
        .legal-search-box input {
          width: 100%;
          padding: 12px 18px 12px 44px;
          border-radius: 14px;
          border: 1.5px solid #E2E8F0;
          background: #F8FAFC;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
        }
        .legal-search-box input:focus {
          border-color: #00B875;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(0, 184, 117, 0.15);
        }
        .legal-search-box .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
        }
      `}</style>

      {/* ── HERO SECTION ── */}
      <section className="legal-hero">
        <div className="legal-hero-grid" />
        <div className="legal-hero-glow-1" />
        <div className="legal-hero-glow-2" />

        {/* Subtle Wave Lines */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none', overflow: 'hidden' }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 380" fill="none" preserveAspectRatio="none">
            <path d="M-100 260 C300 380, 700 100, 1100 230 C1300 300, 1500 160, 1600 180" stroke="rgba(52, 211, 153, 0.45)" strokeWidth="1.5" fill="none" />
            <path d="M-100 210 C350 330, 750 60, 1150 180 C1350 250, 1550 120, 1600 140" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1" strokeDasharray="6 6" fill="none" />
          </svg>
        </div>

        <BreadcrumbHUD links={[{ label: 'আইনি ও পলিসি কেন্দ্র' }]} variant="light" />

        <Container style={{ position: 'relative', zIndex: 2, marginTop: 12 }}>
          <Row className="align-items-center g-4">
            <Col lg={8} md={12}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: 12.5,
                fontWeight: 700,
                marginBottom: 16,
                color: '#ECFDF5',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}>
                <Scale size={15} color="#34D399" />
                <span>গণপ্রজাতন্ত্রী বাংলাদেশের প্রচলিত আইন ও তথ্য সুরক্ষা নীতি সমর্থিত</span>
              </div>

              <h1 style={{ 
                color: 'white', 
                fontWeight: 900, 
                fontSize: 'clamp(26px, 4.5vw, 42px)', 
                lineHeight: 1.25, 
                marginBottom: 14,
                letterSpacing: '-0.3px',
                textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)'
              }}>
                আইনি ও অফিসিয়াল পলিসি ফ্রেমওয়ার্ক
              </h1>

              <p style={{ 
                color: 'rgba(255,255,255,0.92)', 
                fontSize: 'clamp(14px, 1.8vw, 16px)', 
                lineHeight: 1.7, 
                marginBottom: 24, 
                maxWidth: 640,
                fontWeight: 400
              }}>
                Doctor Booklet ডিজিটাল স্বাস্থ্যসেবা ইকোসিস্টেমের ব্যবহারের শর্তাবলী, রোগীর তথ্যের সর্বোচ্চ গোপনীয়তা, রিফান্ড ও প্রাতিষ্ঠানিক সাবস্ক্রিপশন সংক্রান্ত পূর্ণাঙ্গ আইনি নথি।
              </p>

              {/* Legal Standards Highlights */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 10,
                maxWidth: 600
              }}>
                {[
                  { icon: <ShieldCheck size={16} />, title: 'আইনি কাঠামো', desc: 'আইসিটি ও বিএমডিসি সমর্থিত' },
                  { icon: <Lock size={16} />, title: 'ডেটা নিরাপত্তা', desc: '২৫৬-বিট এনক্রিপশন' },
                  { icon: <CreditCard size={16} />, title: 'অডিট রেডি', desc: 'জাতীয় রাজস্ব বোর্ড (NBR) ৫% ভ্যাট' }
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: 14,
                    padding: '8px 14px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: 10,
                      background: 'rgba(52, 211, 153, 0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#34D399', flexShrink: 0
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Col>

            {/* Desktop Verification Box */}
            <Col lg={4} className="d-none d-lg-block text-end">
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 24,
                padding: '24px 22px',
                textAlign: 'left',
                display: 'inline-block',
                maxWidth: 320,
                color: 'white',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 12, 
                    background: 'rgba(52, 211, 153, 0.2)', 
                    color: '#34D399', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <FileCheck2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>আইনি কমপ্লায়েন্স সেল</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>Doctor Booklet Technologies</div>
                  </div>
                </div>

                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.25)', 
                  borderRadius: 12, 
                  padding: '10px 12px', 
                  fontSize: 12, 
                  lineHeight: 1.5, 
                  marginBottom: 12,
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ color: '#34D399', fontWeight: 700, marginBottom: 2 }}>● সক্রিয় ডকুমেন্টেশন</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.85)' }}>সকল শর্তাবলী বাংলাদেশের সাইবার নিরাপত্তা ও স্বাস্থ্য মন্ত্রণালয়ের নির্দেশিকা অনুসরণ করে প্রণীত।</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>
                  <span>সংস্করণ: v২.৪ (২০২৬)</span>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>যাচাইকৃত নথি</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── MOBILE HORIZONTAL PILL NAV (TOUCH-OPTIMIZED) ── */}
      <Container>
        <div className="legal-mobile-nav">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabSelect(tab.id)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '10px 16px',
                  borderRadius: 14,
                  fontSize: 13.5,
                  fontWeight: 800,
                  border: isActive ? '1.5px solid #00B875' : '1.5px solid #E2E8F0',
                  background: isActive ? '#064E3B' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#475569',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: isActive ? '0 4px 14px rgba(6, 78, 59, 0.25)' : 'none',
                  fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
                }}
              >
                {tab.icon}
                <span>{tab.title}</span>
              </button>
            )
          })}
        </div>
      </Container>

      {/* ── MAIN CONTENT SECTION ── */}
      <Container style={{ marginTop: 20 }}>
        <Row className="g-4">
          {/* DESKTOP SIDEBAR */}
          <Col lg={4} xl={3}>
            <div className="legal-sidebar-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 4px' }}>
                <span style={{ 
                  fontSize: 11.5, 
                  fontWeight: 900, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  color: '#64748B' 
                }}>
                  আইনি নথিসমূহ (Policies)
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 99 }}>
                  ৫টি বিভাগ
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabSelect(tab.id)}
                      className={`legal-tab-btn ${isActive ? 'active' : ''}`}
                    >
                      <div className="tab-icon-box" style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: 10, 
                        background: isActive ? '#00B875' : '#F1F5F9', 
                        color: isActive ? '#FFFFFF' : '#64748B', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}>
                        {tab.icon}
                      </div>
                      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 14, fontWeight: isActive ? 800 : 700, color: isActive ? '#064E3B' : '#0F172A', lineHeight: 1.3 }}>
                          {tab.title}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2, fontWeight: 500 }}>
                          {tab.englishTitle}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Quick Legal Help Desk Box */}
              <div style={{
                marginTop: 24,
                padding: '16px 16px',
                borderRadius: 16,
                background: '#F0FDF4',
                border: '1.5px solid #BBF7D0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065F46', fontWeight: 800, fontSize: 13, marginBottom: 6 }}>
                  <HelpCircle size={16} color="#00B875" />
                  <span>আইনি উপদেষ্টা ডেস্ক</span>
                </div>
                <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.5 }}>
                  শর্তাবলী বা চুক্তির বিষয়ে যেকোনো প্রাতিষ্ঠানিক ব্যাখ্যার জন্য ইমেইল করুন:
                </p>
                <a 
                  href="mailto:legal@doctorbooklet.com.bd" 
                  style={{ 
                    fontSize: 12.5, 
                    fontWeight: 800, 
                    color: '#00B875', 
                    textDecoration: 'none', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 4, 
                    marginTop: 6 
                  }}
                >
                  <Mail size={13} />
                  <span>legal@doctorbooklet.com.bd</span>
                </a>
              </div>
            </div>
          </Col>

          {/* MAIN DOCUMENT VIEWER */}
          <Col lg={8} xl={9}>
            <div className="legal-doc-card">
              {/* Document Header Bar */}
              <div style={{ borderBottom: '1.5px solid #E2E8F0', paddingBottom: 24, marginBottom: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: 99, 
                      background: '#ECFDF5', 
                      color: '#065F46', 
                      border: '1px solid #A7F3D0',
                      fontSize: 12, 
                      fontWeight: 800, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6 
                    }}>
                      <CheckCircle2 size={14} color="#00B875" /> অফিসিয়াল সনদপ্রাপ্ত নথি
                    </span>
                    <span style={{ 
                      fontSize: 12.5, 
                      color: '#64748B', 
                      fontWeight: 700, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6,
                      background: '#F1F5F9',
                      padding: '4px 10px',
                      borderRadius: 99
                    }}>
                      <Clock size={13} /> কার্যকর: {activeContent.effective_date || activeTabMeta?.updatedDate}
                    </span>
                  </div>

                  {/* Print / Save Button */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 16px',
                      borderRadius: 12,
                      border: '1.5px solid #E2E8F0',
                      background: '#F8FAFC',
                      color: '#0F172A',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
                    }}
                    title="এই নথিটি প্রিন্ট বা সংরক্ষণ করুন"
                  >
                    <Printer size={15} />
                    <span>প্রিন্ট / সেভ করুন</span>
                  </button>
                </div>

                <h2 style={{ 
                  fontWeight: 900, 
                  fontSize: 'clamp(22px, 3vw, 28px)', 
                  color: '#0F172A', 
                  marginBottom: 8,
                  letterSpacing: '-0.3px'
                }}>
                  {activeContent.title}
                </h2>
                
                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                  {activeContent.subtitle}
                </p>
              </div>

              {/* Callout Notice */}
              <div style={{ 
                padding: '18px 22px', 
                borderRadius: 16, 
                background: '#F0FDF4', 
                borderLeft: '4px solid #00B875',
                borderTop: '1px solid #BBF7D0',
                borderRight: '1px solid #BBF7D0',
                borderBottom: '1px solid #BBF7D0',
                marginBottom: 28 
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <FileText size={22} color="#00B875" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: 13.5, color: '#064E3B', lineHeight: 1.65, fontWeight: 600 }}>
                    {activeContent.notice}
                  </p>
                </div>
              </div>

              {/* Interactive In-Document Search */}
              <div className="legal-search-box">
                <Search size={17} className="search-icon" />
                <input 
                  type="text"
                  placeholder="এই নথির ধারাসমূহে খুঁজুন (যেমন: রিফান্ড, প্রেসক্রিপশন, ভ্যাট, গোপনীয়তা)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    মুছে ফেলুন
                  </button>
                )}
              </div>

              {/* Policy Clauses */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredSections.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px', 
                    background: '#F8FAFC', 
                    borderRadius: 16, 
                    border: '1.5px dashed #CBD5E1' 
                  }}>
                    <AlertCircle size={32} color="#94A3B8" style={{ marginBottom: 10 }} />
                    <h5 style={{ fontWeight: 800, color: '#0F172A', fontSize: 16, marginBottom: 4 }}>
                      কোনো ধারা পাওয়া যায়নি
                    </h5>
                    <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
                      "{searchQuery}" সম্পর্কিত কোনো ধারা এই নথিতে খুঁজে পাওয়া যায়নি। অনুগ্রহ করে অন্য কোনো কি-ওয়ার্ড দিয়ে চেষ্টা করুন।
                    </p>
                  </div>
                ) : (
                  filteredSections.map((section, index) => (
                    <div key={index} className="clause-item">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ 
                            fontSize: 12, 
                            fontWeight: 900, 
                            color: '#064E3B', 
                            background: '#ECFDF5', 
                            border: '1px solid #A7F3D0',
                            padding: '3px 10px', 
                            borderRadius: 8 
                          }}>
                            ধারা {section.num}
                          </span>
                          <h4 style={{ 
                            fontWeight: 800, 
                            fontSize: 17, 
                            color: '#0F172A', 
                            margin: 0 
                          }}>
                            {section.heading}
                          </h4>
                        </div>

                        {/* Copy Clause Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyClause(section.num, section.content)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: copiedClause === section.num ? '#00B875' : '#94A3B8',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="এই ধারাটি কপি করুন"
                        >
                          {copiedClause === section.num ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedClause === section.num ? 'কপি হয়েছে' : 'কপি'}</span>
                        </button>
                      </div>
                      
                      <p style={{ 
                        fontSize: 14.5, 
                        color: '#334155', 
                        lineHeight: 1.8, 
                        fontWeight: 500, 
                        margin: 0 
                      }}>
                        {section.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Document Official Footer & Verification */}
              <div style={{ 
                marginTop: 36, 
                padding: '24px 26px', 
                borderRadius: 18, 
                background: '#F8FAFC', 
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ 
                    width: 44, height: 44, borderRadius: 12, 
                    background: '#00B875', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: 'white',
                    boxShadow: '0 6px 16px rgba(0, 184, 117, 0.25)' 
                  }}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h6 style={{ margin: 0, fontWeight: 900, fontSize: 14.5, color: '#0F172A' }}>
                      Doctor Booklet Legal & Compliance Authority
                    </h6>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                      ধানমন্ডি, ঢাকা, বাংলাদেশ • সর্বস্বত্ব সংরক্ষিত ২০২৬
                    </p>
                  </div>
                </div>

                <a 
                  href="mailto:legal@doctorbooklet.com.bd"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 12,
                    background: '#00B875',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(0, 184, 117, 0.25)',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
                  }}
                >
                  <Mail size={16} /> 
                  <span>আইনি সেলে সরাসরি যোগাযোগ</span>
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

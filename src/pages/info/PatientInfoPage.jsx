import React, { useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { 
  Users, Calendar, Clock, FileText, 
  ShieldCheck, ArrowRight, Sparkles, TrendingUp, CheckCircle2,
  Laptop, ChevronDown, ChevronUp, Activity, 
  HelpCircle, Award, Database, Bell, Shield, Lock, Check,
  HeartPulse, MapPin, Search, Smartphone, Heart, Smile, Plus, Minus,
  Stethoscope, Building2
} from 'lucide-react'

export default function PatientInfoPage() {
  const [activeTab, setActiveTab] = useState('booking')
  const [openFaq, setOpenFaq] = useState(0)

  // 6 Core Patient Benefits & Services
  const patientServices = [
    {
      id: 'booking',
      icon: <Calendar size={26} />,
      badge: 'সহজ সিরিয়াল বুকিং',
      title: 'ঘরে বসেই বিশেষজ্ঞ ডাক্তার অ্যাপয়েন্টমেন্ট',
      desc: 'ভোরের আলো ফোটার আগেই চেম্বারে গিয়ে লাইনে দাঁড়িয়ে সিরিয়াল নেওয়ার দিন শেষ। যেকোনো স্থান থেকে মাত্র ১ ক্লিকে সিরিয়াল নিন।',
      highlights: [
        'পছন্দমতো তারিখ, সকাল/বিকাল শিফট ও সময় স্লট নির্বাচন',
        'তাৎক্ষণিক এসএমএস বুকিং কনফার্মেশন ও ডিজিটাল টোকেন স্লিপ',
        'কোনো দীর্ঘ লাইনে দাঁড়িয়ে সময় ও শ্রম নষ্ট করার প্রয়োজন নেই',
        'জরুরি প্রয়োজনে খুব সহজেই অ্যাপয়েন্টমেন্ট শিডিউল পরিবর্তন'
      ],
      color: '#00B875',
      bg: '#F0FDF4',
      border: '#DCFCE7'
    },
    {
      id: 'livequeue',
      icon: <Clock size={26} />,
      badge: 'লাইভ সিরিয়াল কিউ',
      title: 'মোবাইলে রিয়েল-টাইম লাইভ সিরিয়াল ট্র্যাকার',
      desc: 'চেম্বারের ওয়েটিং রুমে ঘণ্টার পর ঘণ্টা বসে না থেকে আপনার মোবাইলেই দেখুন ডাক্তার সাহেব এখন কত নম্বর রোগী দেখছেন।',
      highlights: [
        'চেম্বারের চলমান ডাক নম্বর ও পরবর্তী সিরিয়াল রিয়েল-টাইম আপডেট',
        'নিজের সিরিয়াল আসতে আনুমানিক কত মিনিট বাকি তা স্পষ্ট দেখা',
        'বাসা থেকে দেরিতে ও নিখুঁত সময়ে চেম্বারে পৌঁছানোর সুবিধা',
        'উপচে পড়া ভিড়, হইচই ও হাসপাতাল ইনফেকশনের ঝুঁকি নির্মূল'
      ],
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#DBEAFE'
    },
    {
      id: 'vault',
      icon: <FileText size={26} />,
      badge: 'আজীবন প্রেসক্রিপশন ক্লাউড',
      title: 'ডিজিটাল প্রেসক্রিপশন ও মেডিকেল হিস্ট্রি ভল্ট',
      desc: 'পুরোনো প্রেসক্রিপশন হারিয়ে যাওয়া, নষ্ট হওয়া বা ফেলে আসার দিন শেষ। আপনার সমস্ত ব্যবস্থাপত্র ও রিপোর্ট সারাজীবন সেভ থাকবে।',
      highlights: [
        'ডাক্তারের দেওয়া ডিজিটাল প্রেসক্রিপশন সরাসরি আপনার প্রোফাইলে যুক্ত',
        'স্মার্টফোন থেকে যেকোনো সময় যেকোনো চিকিৎসকের কাছে হিস্ট্রি প্রদর্শন',
        'রক্তের গ্রুপ, এলার্জি ও ক্রনিক রোগের তথ্য এক নজরে সংরক্ষিত',
        'ব্যাংক-লেভেল ২৫৬-বিট এনক্রিপশনে স্বাস্থ্য তথ্যের সর্বোচ্চ গোপনীয়তা'
      ],
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#EDE9FE'
    },
    {
      id: 'location',
      icon: <MapPin size={26} />,
      badge: 'স্মার্ট লোকাল সার্চ',
      title: 'বিভাগ, জেলা ও উপজেলা অনুযায়ী ডাক্তার খুঁজুন',
      desc: 'আপনার নিকটস্থ বিভাগ, জেলা, উপজেলা ও ইউনিয়ন বাছাই করে বিশেষজ্ঞ ডাক্তার ও আধুনিক হাসপাতালের তালিকা সহজে খুঁজে নিন।',
      highlights: [
        '৮টি বিভাগ ও ৬৪টি জেলার উপজেলা ভিত্তিক সরাসরি ফিল্টারিং',
        'মেডিসিন, কার্ডিওলজি, গাইনি, শিশু ইত্যাদি স্পেশালিটি অনুযায়ী সার্চ',
        'BMDC ভেরিফাইড চিকিৎসকদের সঠিক ডিগ্রি, অভিজ্ঞতা ও চেম্বার রুটিন',
        'স্বচ্ছ ভিজিটিং ফি ও কোনো গোপন বা অপ্রত্যাশিত চার্জ নেই'
      ],
      color: '#0D9488',
      bg: '#F0FDFA',
      border: '#CCFBF1'
    },
    {
      id: 'family',
      icon: <Users size={26} />,
      badge: 'ফ্যামিলি হেলথ কেয়ার',
      title: 'এক অ্যাকাউন্টে পুরো পরিবারের স্বাস্থ্য সুরক্ষা',
      desc: 'একটি মাত্র মোবাইল নম্বর দিয়ে নিজের একাউন্ট থেকে বাবা-মা, সন্তান কিংবা পরিবারের যেকোনো সদস্যের জন্য সিরিয়াল ও প্রেসক্রিপশন ম্যানেজ করুন।',
      highlights: [
        'পরিবারের সকল সদস্যের জন্য আলাদা আলাদা মেডিকেল প্রোফাইল',
        'বয়োজ্যেষ্ঠ পিতা-মাতার জন্য দূর থেকেও নিশ্চিন্তে ডাক্তার অ্যাপয়েন্টমেন্ট',
        'ছোট শিশুদের টিকাদান ও পূর্ববর্তী প্রেসক্রিপশন সহজে দেখা',
        'একই ড্যাশবোর্ড থেকে একাধিক সদস্যের সিরিয়াল ও রিপোর্ট হ্যান্ডেলিং'
      ],
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FEF3C7'
    },
    {
      id: 'emergency',
      icon: <HeartPulse size={26} />,
      badge: 'জরুরি সেবা ও সহায়তা',
      title: 'জরুরি বিভাগ, অ্যাম্বুলেন্স ও হাসপাতাল হটলাইন',
      desc: 'যেকোনো আকস্মিক স্বাস্থ্য সংকট বা ইমার্জেন্সিতে নিকটস্থ হাসপাতালের জরুরি হটলাইন ও জীবনরক্ষাকারী তথ্য হাতের কাছেই।',
      highlights: [
        'হাসপাতালের জরুরি বিভাগ, আইসিইউ ও ডায়াগনস্টিক সেন্টারের ফোন নম্বর',
        'ওয়ান-ট্যাপ জরুরি ডায়ালিং ও সরাসরি লোকেশন ডিরেকশন',
        'চেম্বারের ছুটি ও ডাক্তারের আকস্মিক অনুপস্থিতির ইনস্ট্যান্ট এসএমএস অ্যালার্ট',
        'সপ্তাহের ৭ দিন সার্বক্ষণিক গ্রাহক সেবা ও পেশেন্ট সাপোর্ট'
      ],
      color: '#E11D48',
      bg: '#FFF1F2',
      border: '#FFE4E6'
    }
  ]

  // Interactive Tab Showcase Data
  const tabShowcases = {
    booking: {
      tag: 'অনলাইন সিরিয়াল বুকিং',
      title: 'মাত্র ২ মিনিটে পছন্দের ডাক্তারের অ্যাপয়েন্টমেন্ট',
      desc: 'কাঙ্ক্ষিত বিশেষজ্ঞ ডাক্তার নির্বাচন করুন, চেম্বারের স্থান ও সময়সূচী দেখে আপনার জন্য সুবিধাজনক দিনের স্লট বেছে নিন। কনফার্মেশন এসএমএস পেয়ে যাবেন তৎক্ষণাৎ।',
      points: [
        'বিশেষজ্ঞ বিভাগ ও রোগের ধরন অনুযায়ী দ্রুত ডাক্তার বাছাই',
        'চেম্বারের লোকেশন, সকাল বা সন্ধ্যার শিফট ও ফি স্পষ্ট প্রদর্শন',
        'বুকিং সম্পূর্ণ হলেই মোবাইলে ডিজিটাল বুকিং আইডি ও এসএমএস প্রেরণ',
        'কোনো দীর্ঘ লাইনে দাঁড়িয়ে সময় ও টাকা নষ্ট করার প্রয়োজন নেই'
      ],
      badgeColor: '#00B875',
      mockupBg: '#064E3B',
      mockupTitle: 'লাইভ বুকিং কনফার্মেশন',
      mockupSubtitle: 'ডাঃ তানভীর হাসান (এমবিবিএস, এফসিপিএস - কার্ডিওলজি)'
    },
    livequeue: {
      tag: 'লাইভ সিরিয়াল ট্র্যাকার',
      title: 'হাসপাতালের ওয়েটিং রুমে আর ঘণ্টার পর ঘণ্টা অপচয় নয়',
      desc: 'চেম্বারে বর্তমানে কত নম্বর সিরিয়ালের রোগী চিকিৎসা নিচ্ছেন তা আপনার স্মার্টফোনে লাইভ দেখা যাবে। সিরিয়াল এগিয়ে আসলে সময়মতো চেম্বারে পৌঁছে যান।',
      points: [
        'রিয়েল-টাইম কিউ আপডেট: চলমান সিরিয়াল ও ডাক নম্বর ডিসপ্লে',
        'নিজের সিরিয়াল আসতে আনুমানিক কত মিনিট লাগবে তার স্মার্ট ক্যালকুলেশন',
        'হাসপাতালের অতিরিক্ত ভিড়, অস্বস্তি ও ইনফেকশন থেকে পরিবার নিরাপদ',
        'দেরি হওয়ার আশঙ্কা ছাড়াই সঠিক সময়ে ডাক্তারের সাথে সাক্ষাৎ'
      ],
      badgeColor: '#2563EB',
      mockupBg: '#1E3A8A',
      mockupTitle: 'লাইভ সিরিয়াল কিউ মনিটর',
      mockupSubtitle: 'পপুলার ডায়াগনস্টিক সেন্টার (চেম্বার ৩)'
    },
    vault: {
      tag: 'ডিজিটাল প্রেসক্রিপশন',
      title: 'সব প্রেসক্রিপশন ও ডায়াগনস্টিক রিপোর্ট আজীবন নিরাপদ',
      desc: 'কাগজের প্রেসক্রিপশন ভিজে নষ্ট হওয়া কিংবা পুরনো টেস্ট রিপোর্ট হারিয়ে যাওয়ার চিন্তা চিরতরে শেষ। আপনার ফোনে লগইন করলেই অতীত চিকিৎসার সবকিছু এক স্ক্রিনে হাজির।',
      points: [
        'ডাক্তারের দেওয়া ই-প্রেসক্রিপশন সরাসরি ডিজিটাল ফাইলে সেভ',
        'ঔষধের নাম, সেবনের নিয়ম ও পরবর্তী ফলো-আপ ডেট সহজে দেখা',
        'নতুন কোনো চিকিৎসকের কাছে গেলে এক ক্লিকে পূর্ববর্তী হিস্ট্রি দেখানো',
        '২৫৬-বিট এনক্রিপশনের মাধ্যমে স্বাস্থ্য তথ্যের নিশ্ছিদ্র গোপনীয়তা'
      ],
      badgeColor: '#7C3AED',
      mockupBg: '#4C1D95',
      mockupTitle: 'স্মার্ট হেলথ রেকর্ড ভল্ট',
      mockupSubtitle: 'আপনার সকল প্রেসক্রিপশন ও রিপোর্ট সুরক্ষিত'
    },
    family: {
      tag: 'ফ্যামিলি কেয়ার',
      title: 'পরিবারের সবার স্বাস্থ্য সুরক্ষায় একটি মাত্র ড্যাশবোর্ড',
      desc: 'গ্রামের বাড়িতে থাকা বৃদ্ধ মা-বাবা কিংবা বাসার ছোট সন্তানের জন্য নিজের মোবাইল থেকেই সহজেই বিশেষজ্ঞ ডাক্তারের সিরিয়াল নেওয়া ও তাদের প্রেসক্রিপশন সংরক্ষণ সম্ভব।',
      points: [
        'একাধিক সদস্যের প্রোফাইল দ্রুত তৈরি ও সুইচ করার সুবিধা',
        'পিতা-মাতা ও সন্তানের জন্য আলাদা প্রেসক্রিপশন ও ডায়াগনস্টিক ফাইল',
        'বয়স্কদের ক্ষেত্রে দূর থেকেই অ্যাপয়েন্টমেন্ট ও টিকিট নিয়ন্ত্রণ',
        'পরিবারের পুরো মেডিকেল হিস্ট্রি সবসময় সাজানো ও পরিপাটি'
      ],
      badgeColor: '#0D9488',
      mockupBg: '#134E4A',
      mockupTitle: 'পারিবারিক স্বাস্থ্য প্রোফাইল',
      mockupSubtitle: 'মা, বাবা ও সন্তানের একক স্বাস্থ্য ড্যাশবোর্ড'
    }
  }

  // 3 Easy Steps to Get Healthcare
  const steps = [
    {
      num: '১',
      title: 'ফ্রি অ্যাকাউন্ট খুলুন',
      desc: 'আপনার মোবাইল নম্বর ও সাধারণ তথ্য দিয়ে মাত্র ১ মিনিটে একটি ফ্রি পেশেন্ট অ্যাকাউন্ট তৈরি করুন।'
    },
    {
      num: '২',
      title: 'ডাক্তার বা হাসপাতাল বাছুন',
      desc: 'আপনার এলাকা, বিশেষায়িত রোগ বা ডাক্তারের নাম দিয়ে সার্চ করে সুবিধাজনক দিন ও সময় স্লট বুক করুন।'
    },
    {
      num: '৩',
      title: 'লাইভ সিরিয়াল ট্র্যাক করুন',
      desc: 'মোবাইলে চলমান কিউ ট্র্যাক করে সময়মতো চেম্বারে পৌঁছে যান এবং নিশ্চিন্তে সেবা গ্রহণ করুন।'
    }
  ]

  // FAQs for Patients
  const faqs = [
    {
      q: 'Doctor Booklet-এ রোগী হিসেবে রেজিস্ট্রেশন করতে কি কোনো টাকা লাগবে?',
      a: 'না, রেজিস্ট্রেশন সম্পূর্ণ বিনামূল্যে। রোগীরা কোনো প্রকার রেজিস্ট্রেশন চার্জ ছাড়াই একাউন্ট খুলতে পারবেন, ডাক্তার খুঁজতে পারবেন এবং সিরিয়াল বুক করতে পারবেন।'
    },
    {
      q: 'আমি কি নিজের একাউন্ট থেকে মা-বাবা বা অন্য কারও জন্য সিরিয়াল নিতে পারব?',
      a: 'হ্যাঁ, অবশ্যই। Doctor Booklet-এ "ফ্যামিলি মেম্বার" ফিচার রয়েছে। আপনি আপনার প্রোফাইল থেকে পরিবারের যেকোনো সদস্যের নাম ও বয়স যুক্ত করে তাদের নামে ডাক্তার সিরিয়াল নিতে পারবেন এবং তাদের প্রেসক্রিপশন আলাদা সংরক্ষণ করতে পারবেন।'
    },
    {
      q: 'লাইভ সিরিয়াল কিউ কীভাবে কাজ করে?',
      a: 'ডাক্তারের চেম্বারে সহকারী যখন একজন রোগী দেখার পর পরবর্তী রোগীকে ডাকেন, তখন সিস্টেম স্বয়ংক্রিয়ভাবে আপডেট হয়। আপনার মোবাইল স্ক্রিনে আপনি দেখতে পাবেন কত নম্বর রোগী এখন ভেতরে আছেন এবং আপনার নম্বর আসতে আনুমানিক কতক্ষণ বাকি।'
    },
    {
      q: 'সিরিয়াল বুক করার পর কোনো জরুরি কারণে যেতে না পারলে কী করব?',
      a: 'আপনার ড্যাশবোর্ডের "My Appointments" থেকে খুব সহজেই অ্যাপয়েন্টমেন্ট বাতিল কিংবা অন্য কোনো তারিখে রিশিডিউল করতে পারবেন। কোনো বাড়তি চার্জ কাটা হবে না।'
    },
    {
      q: 'আমার প্রেসক্রিপশন ও মেডিকেল তথ্যের গোপনীয়তা কি নিশ্চিত?',
      a: 'হ্যাঁ, শতভাগ। আমাদের প্ল্যাটফর্মে আন্তর্জাতিক মানসম্পন্ন এনক্রিপশন ও ডেটা সুরক্ষা নীতিমালা অনুসরণ করা হয়। আপনার চিকিৎসকের পরামর্শ ও স্বাস্থ্য তথ্য আপনার অনুমতি ছাড়া তৃতীয় কোনো পক্ষের দেখার সুযোগ নেই।'
    },
    {
      q: 'ডাক্তারের ভিজিটিং ফি কীভাবে পরিশোধ করতে হবে?',
      a: 'ডাক্তারের প্রোফাইলে নির্ধারিত ভিজিটিং ফি স্পষ্টভাবে উল্লেখ থাকে। আপনি চাইলে চেম্বারে সরাসরি উপস্থিত হয়ে ক্যাশ দিতে পারেন অথবা অনলাইন পেমেন্টের অপশন থাকলে ডিজিটাল পেমেন্ট সম্পন্ন করতে পারেন।'
    }
  ]

  return (
    <div className="patient-info-page" style={{ background: '#F8FAFC', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ── RESPONSIVE COMPACT STYLING ── */}
      <style>{`
        .patient-hero-section {
          position: relative;
          background: linear-gradient(145deg, #022C22 0%, #064E3B 45%, #0B3B32 100%);
          padding: 135px 0 85px;
          color: white;
          overflow: hidden;
        }
        .patient-hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(52, 211, 153, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(52, 211, 153, 0.07) 1px, transparent 1px);
          background-size: 38px 38px;
          pointer-events: none;
        }
        .patient-hero-glow-1 {
          position: absolute;
          top: -120px;
          right: -80px;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 184, 117, 0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .patient-hero-glow-2 {
          position: absolute;
          bottom: -150px;
          left: -100px;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, transparent 70%);
          pointer-events: none;
        }
        .patient-hero-badge {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 6px 18px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 20px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #DCFCE7;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .patient-hero-title {
          font-size: clamp(30px, 4.5vw, 54px);
          font-weight: 950;
          line-height: 1.25;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
          color: #FFFFFF !important;
        }
        .patient-hero-title-accent {
          background: linear-gradient(90deg, #34D399 0%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        .patient-hero-desc {
          font-size: clamp(14.5px, 1.8vw, 17.5px);
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.9);
          max-width: 780px;
          margin: 0 auto 36px;
          font-weight: 450;
        }
        .patient-hero-cta-btn {
          background: #00B875;
          color: white;
          padding: 14px 34px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 16px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 25px rgba(0, 184, 117, 0.4);
          transition: all 0.25s ease;
          border: 1px solid #34D399;
        }
        .patient-hero-cta-btn:hover {
          background: #059669;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(0, 184, 117, 0.5);
        }
        .patient-hero-secondary-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 15.5px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(8px);
          transition: all 0.25s ease;
        }
        .patient-hero-secondary-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-color: rgba(255, 255, 255, 0.45);
        }
        .patient-hero-trust-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          font-size: 13px;
          color: #A7F3D0;
          font-weight: 600;
          flex-wrap: wrap;
        }
        .patient-hero-trust-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* Trust Bar */
        .patient-trust-bar {
          margin-top: -36px;
          position: relative;
          z-index: 10;
        }
        .patient-trust-card {
          background: white;
          border-radius: 20px;
          padding: 22px 24px;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.06);
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 20px;
        }
        .patient-stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .patient-stat-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .patient-stat-val {
          font-size: 22px;
          font-weight: 950;
          color: #0F172A;
          line-height: 1;
        }
        .patient-stat-lbl {
          font-size: 12px;
          color: #64748B;
          font-weight: 700;
          margin-top: 3px;
        }

        /* Service Cards */
        .patient-services-section {
          padding: 75px 0 60px;
        }
        .patient-service-card {
          background: white;
          border-radius: 22px;
          padding: 28px 24px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.3s ease;
        }
        .patient-service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px rgba(0, 184, 117, 0.1);
          border-color: #A7F3D0;
        }
        .patient-service-icon-box {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .patient-service-title {
          font-size: 17.5px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 10px;
          line-height: 1.35;
        }
        .patient-service-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.6;
          margin-bottom: 18px;
        }
        .patient-service-points {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .patient-service-point-text {
          font-size: 12.5px;
          color: #334155;
          font-weight: 600;
          line-height: 1.45;
        }

        /* Tabs Showcase */
        .patient-tab-section {
          padding: 65px 0;
          background: white;
          border-top: 1px solid #E2E8F0;
          border-bottom: 1px solid #E2E8F0;
        }
        .patient-tab-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          background: #F1F5F9;
          padding: 6px;
          border-radius: 18px;
          max-width: 680px;
          margin: 0 auto 32px;
        }
        .patient-tab-btn {
          padding: 12px 20px;
          border-radius: 14px;
          border: none;
          background: transparent;
          color: #475569;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .patient-tab-btn.active {
          background: #00B875;
          color: white;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.3);
        }
        .patient-tab-box {
          background: #F8FAFC;
          border-radius: 28px;
          border: 1px solid #E2E8F0;
          padding: clamp(24px, 4vw, 42px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
        }
        .patient-tab-content-title {
          font-size: clamp(20px, 2.5vw, 28px);
          font-weight: 950;
          color: #0F172A;
          margin-bottom: 14px;
        }
        .patient-tab-content-desc {
          color: #475569;
          font-size: 14.5px;
          line-height: 1.7;
          margin-bottom: 22px;
        }
        .patient-tab-points {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 26px;
        }
        .patient-tab-point-text {
          font-size: 13.5px;
          color: #1E293B;
          font-weight: 700;
        }
        .patient-mockup-card {
          border-radius: 22px;
          padding: 26px 22px;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.15);
        }

        /* Steps Section */
        .patient-steps-section {
          padding: 70px 0 60px;
        }
        .patient-step-card {
          background: white;
          border-radius: 20px;
          padding: 26px 22px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.03);
          height: 100%;
          position: relative;
        }
        .patient-step-num {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #00B875;
          color: white;
          font-size: 20px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 6px 16px rgba(0, 184, 117, 0.3);
        }
        .patient-step-title {
          font-size: 17px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 10px;
        }
        .patient-step-desc {
          font-size: 13.5px;
          color: #64748B;
          line-height: 1.6;
          margin: 0;
        }

        /* Comparison Section */
        .patient-comparison-section {
          padding: 65px 0;
          background: #F8FAFC;
        }
        .patient-compare-box {
          background: white;
          border-radius: 24px;
          padding: 32px 28px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }

        /* Security Section (Soft Mint & Emerald Trust Card) */
        .patient-security-section {
          padding: 55px 0;
          background: #F8FAFC;
        }
        .patient-security-card {
          background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 50%, #E6FFFA 100%);
          border: 1.5px solid #A7F3D0;
          border-radius: 26px;
          padding: clamp(24px, 4vw, 42px);
          box-shadow: 0 10px 30px rgba(0, 184, 117, 0.08);
          position: relative;
          overflow: hidden;
        }
        .patient-security-inner {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .patient-lock-icon-box {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          background: #FFFFFF;
          color: #00B875;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #34D399;
          box-shadow: 0 8px 20px rgba(0, 184, 117, 0.16);
          flex-shrink: 0;
        }
        .patient-security-content {
          flex: 1;
        }
        .patient-security-title {
          font-size: clamp(20px, 2.5vw, 25px);
          font-weight: 950;
          margin-bottom: 10px;
          color: #064E3B;
          line-height: 1.35;
        }
        .patient-security-desc {
          color: #334155;
          font-size: 14.5px;
          line-height: 1.65;
          margin: 0 0 16px 0;
        }
        .patient-security-badges {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .patient-security-pill {
          background: #FFFFFF;
          border: 1px solid #A7F3D0;
          padding: 5px 14px;
          border-radius: 99px;
          font-size: 12.5px;
          font-weight: 750;
          color: #065F46;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 6px rgba(0, 184, 117, 0.06);
        }

        /* FAQ Section */
        @keyframes patientFaqFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .patient-faq-section {
          padding: 70px 0 60px;
        }
        .patient-faq-btn {
          width: 100%;
          padding: 16px 24px;
          background: transparent;
          border: none;
          text-align: left;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          outline: none;
        }
        .patient-faq-q-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13.5px;
          font-weight: 800;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .patient-faq-question {
          font-weight: 600;
          font-size: 15.5px;
          line-height: 1.4;
          flex: 1;
          transition: color 0.2s ease;
        }
        .patient-faq-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .patient-faq-answer {
          padding: 0 24px 20px;
          animation: patientFaqFadeIn 0.3s ease;
        }
        .patient-faq-answer p {
          margin: 0;
          color: #475569;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.6;
        }

        /* Bottom CTA */
        .patient-bottom-cta {
          padding: 80px 0;
          background: linear-gradient(145deg, #022C22 0%, #064E3B 100%);
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .patient-bottom-cta-title {
          color: #FFFFFF !important;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          font-weight: 950 !important;
          font-size: clamp(24px, 3.8vw, 38px);
          margin-bottom: 14px;
        }
        .patient-bottom-cta-desc {
          color: rgba(255, 255, 255, 0.85);
          font-size: 15.5px;
          max-width: 640px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }
        .patient-bottom-cta-btn {
          background: #00B875;
          color: white;
          padding: 14px 36px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 16px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 25px rgba(0, 184, 117, 0.4);
          border: 1px solid #34D399;
          transition: all 0.25s ease;
        }
        .patient-bottom-cta-btn:hover {
          background: #059669;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(0, 184, 117, 0.5);
        }
        .patient-bottom-secondary-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          padding: 14px 30px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 15.5px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(8px);
          transition: all 0.25s ease;
        }
        .patient-bottom-secondary-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-color: rgba(255, 255, 255, 0.45);
        }

        /* ── RESPONSIVE MOBILE TWEAKS (max-width: 768px) ── */
        @media (max-width: 768px) {
          .patient-hero-section {
            padding: 105px 0 55px !important;
          }
          .patient-hero-badge {
            font-size: 11.5px !important;
            padding: 5px 14px !important;
            margin-bottom: 14px !important;
          }
          .patient-hero-title {
            font-size: 26px !important;
            line-height: 1.3 !important;
            margin-bottom: 14px !important;
          }
          .patient-hero-desc {
            font-size: 13.5px !important;
            line-height: 1.6 !important;
            margin-bottom: 24px !important;
          }
          .patient-hero-cta-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 12px 18px !important;
            font-size: 14.5px !important;
            border-radius: 12px !important;
          }
          .patient-hero-secondary-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 11px 18px !important;
            font-size: 14px !important;
            border-radius: 12px !important;
          }
          .patient-hero-trust-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 7px !important;
            font-size: 11.5px !important;
            margin-top: 14px !important;
          }
          .patient-trust-bar {
            margin-top: -20px !important;
            padding: 0 10px !important;
          }
          .patient-trust-card {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            padding: 10px !important;
            border-radius: 16px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05) !important;
          }
          .patient-stat-item {
            width: 100% !important;
            background: #F8FAFC !important;
            border: 1px solid #E2E8F0 !important;
            border-radius: 12px !important;
            padding: 10px 8px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
          }
          .patient-stat-icon-wrap {
            width: 32px !important;
            height: 32px !important;
            border-radius: 9px !important;
          }
          .patient-stat-val {
            font-size: 16px !important;
          }
          .patient-stat-lbl {
            font-size: 10.5px !important;
            margin-top: 2px !important;
          }
          .patient-services-section {
            padding: 36px 0 24px !important;
          }
          .patient-service-card {
            padding: 18px 15px !important;
            border-radius: 16px !important;
          }
          .patient-tab-section {
            padding: 34px 0 !important;
          }
          .patient-tab-nav {
            overflow-x: auto !important;
            justify-content: flex-start !important;
            padding: 4px !important;
            gap: 5px !important;
            scrollbar-width: none !important;
            border-radius: 12px !important;
            margin-bottom: 18px !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .patient-tab-btn {
            padding: 7px 12px !important;
            font-size: 12px !important;
            border-radius: 9px !important;
            flex-shrink: 0 !important;
          }
          .patient-tab-box {
            padding: 16px 13px !important;
            border-radius: 18px !important;
          }
          .patient-steps-section {
            padding: 34px 0 26px !important;
          }
          .patient-step-card {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 14px 12px !important;
            border-radius: 14px !important;
          }
          .patient-step-num {
            width: 34px !important;
            height: 34px !important;
            border-radius: 10px !important;
            font-size: 16px !important;
            margin-bottom: 0 !important;
            flex-shrink: 0 !important;
          }
          .patient-comparison-section {
            padding: 30px 0 !important;
          }
          .patient-compare-box {
            padding: 18px 14px !important;
            border-radius: 18px !important;
          }
          .patient-security-section {
            padding: 24px 0 !important;
          }
          .patient-security-card {
            padding: 22px 14px !important;
            border-radius: 20px !important;
            text-align: center !important;
          }
          .patient-security-inner {
            flex-direction: column !important;
            align-items: center !important;
            gap: 12px !important;
          }
          .patient-lock-icon-box {
            width: 54px !important;
            height: 54px !important;
            border-radius: 16px !important;
            margin: 0 auto !important;
          }
          .patient-lock-icon-box svg {
            width: 26px !important;
            height: 26px !important;
          }
          .patient-security-title {
            font-size: 17.5px !important;
            margin-bottom: 8px !important;
            text-align: center !important;
          }
          .patient-security-desc {
            font-size: 12.5px !important;
            line-height: 1.55 !important;
            margin-bottom: 14px !important;
            text-align: center !important;
          }
          .patient-security-badges {
            justify-content: center !important;
            gap: 6px !important;
          }
          .patient-security-pill {
            font-size: 11px !important;
            padding: 4px 10px !important;
          }
          .patient-faq-section {
            padding: 34px 0 !important;
          }
          .patient-bottom-cta {
            padding: 44px 0 90px !important;
          }
        }
      `}</style>

      {/* ── 1. HERO SECTION ── */}
      <section className="patient-hero-section">
        <div className="patient-hero-grid" />
        <div className="patient-hero-glow-1" />
        <div className="patient-hero-glow-2" />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="justify-content-center text-center">
            <Col lg={10} md={12}>
              <div className="patient-hero-badge">
                <Sparkles size={15} color="#34D399" />
                <span className="d-none d-sm-inline">রোগী ও পরিবারের জন্য ডিজিটাল স্বাস্থ্যসেবা | Doctor Booklet Health</span>
                <span className="d-sm-none">রোগীদের আধুনিক স্বাস্থ্য পোর্টাল</span>
              </div>

              <h1 className="patient-hero-title">
                সুস্থ জীবনের স্মার্ট সমাধান — <br />
                <span className="patient-hero-title-accent">ঘরে বসেই বিশেষজ্ঞ ডাক্তার ও সেবা</span>
              </h1>

              <p className="patient-hero-desc">
                আর ঘণ্টার পর ঘণ্টা চেম্বারে দীর্ঘ লাইনে দাঁড়িয়ে থাকার দিন শেষ। সঠিক বিশেষজ্ঞ ডাক্তার খুঁজে নিন, সুবিধাজনক শিফটে সিরিয়াল বুক করুন এবং লাইভ সিরিয়াল ট্র্যাক করে সময়মতো চিকিৎসা নিন।
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                <Link to="/register/patient" className="patient-hero-cta-btn">
                  <Users size={18} />
                  <span>ফ্রি একাউন্ট খুলুন</span>
                  <ArrowRight size={17} />
                </Link>

                <Link to="/doctors" className="patient-hero-secondary-btn">
                  <Stethoscope size={17} />
                  <span>ডাক্তার খুঁজুন</span>
                </Link>
              </div>

              <div className="patient-hero-trust-row">
                <span className="patient-hero-trust-item">
                  <CheckCircle2 size={15} color="#34D399" /> ১০০% ফ্রি রেজিস্ট্রেশন
                </span>
                <span className="patient-hero-trust-item">
                  <CheckCircle2 size={15} color="#34D399" /> BMDC ভেরিফাইড ডাক্তার ও হাসপাতাল
                </span>
                <span className="patient-hero-trust-item">
                  <CheckCircle2 size={15} color="#34D399" /> লাইভ সিরিয়াল কিউ ট্র্যাকিং
                </span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── 2. TRUST METRICS STRIP ── */}
      <Container className="patient-trust-bar">
        <div className="patient-trust-card">
          <div className="patient-stat-item">
            <div className="patient-stat-icon-wrap" style={{ background: '#F0FDF4', color: '#00B875' }}>
              <Users size={20} />
            </div>
            <div>
              <div className="patient-stat-val">৫০,০০০+</div>
              <div className="patient-stat-lbl">সেবাগ্রহণকারী রোগী</div>
            </div>
          </div>

          <div className="patient-stat-item">
            <div className="patient-stat-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Stethoscope size={20} />
            </div>
            <div>
              <div className="patient-stat-val">১,৫০০+</div>
              <div className="patient-stat-lbl">ভেরিফাইড বিশেষজ্ঞ ডাক্তার</div>
            </div>
          </div>

          <div className="patient-stat-item">
            <div className="patient-stat-icon-wrap" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <Building2 size={20} />
            </div>
            <div>
              <div className="patient-stat-val">২৫০+</div>
              <div className="patient-stat-lbl">হাসপাতাল ও ডায়াগনস্টিক সেন্টার</div>
            </div>
          </div>

          <div className="patient-stat-item">
            <div className="patient-stat-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Award size={20} />
            </div>
            <div>
              <div className="patient-stat-val">৯৯.৮%</div>
              <div className="patient-stat-lbl">সন্তুষ্ট সেবাগ্রহীতা</div>
            </div>
          </div>
        </div>
      </Container>

      {/* ── 3. CORE SERVICES GRID (6 CARDS) ── */}
      <section className="patient-services-section">
        <Container>
          <div className="text-center mb-5">
            <span style={{ 
              background: 'rgba(0, 184, 117, 0.1)', 
              color: '#00B875', 
              padding: '6px 16px', 
              borderRadius: '99px', 
              fontSize: '13px', 
              fontWeight: 800,
              display: 'inline-block',
              marginBottom: '10px'
            }}>
              রোগীদের জন্য বিশেষ সুবিধাসমূহ
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 950, color: '#0F172A', marginBottom: '12px' }}>
              Doctor Booklet কেন রোগীদের প্রথম পছন্দ?
            </h2>
            <p style={{ color: '#64748B', maxWidth: '640px', margin: '0 auto', fontSize: '15px' }}>
              রোগীদের সময়, কষ্ট ও ব্যয় বাঁচিয়ে সর্বোচ্চ ডিজিটাল স্বাচ্ছন্দ্য দিতে তৈরি আধুনিক হেলথকেয়ার নেটওয়ার্ক।
            </p>
          </div>

          <Row className="g-4">
            {patientServices.map((service) => (
              <Col lg={4} md={6} sm={12} key={service.id}>
                <div className="patient-service-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                      <div className="patient-service-icon-box" style={{ background: service.bg, color: service.color, border: `1px solid ${service.border}` }}>
                        {service.icon}
                      </div>
                      <span style={{ 
                        fontSize: '11.5px', 
                        fontWeight: 800, 
                        color: service.color, 
                        background: service.bg, 
                        padding: '4px 12px', 
                        borderRadius: '99px',
                        border: `1px solid ${service.border}`
                      }}>
                        {service.badge}
                      </span>
                    </div>

                    <h3 className="patient-service-title">{service.title}</h3>
                    <p className="patient-service-desc">{service.desc}</p>
                  </div>

                  <div className="patient-service-points">
                    {service.highlights.map((point, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <CheckCircle2 size={15} color={service.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span className="patient-service-point-text">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── 4. INTERACTIVE TAB SHOWCASE ── */}
      <section className="patient-tab-section">
        <Container>
          <div className="text-center mb-4">
            <span style={{ 
              background: 'rgba(37, 99, 235, 0.1)', 
              color: '#2563EB', 
              padding: '6px 16px', 
              borderRadius: '99px', 
              fontSize: '13px', 
              fontWeight: 800,
              display: 'inline-block',
              marginBottom: '10px'
            }}>
              ইন্টারেক্টিভ অভিজ্ঞতা
            </span>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 950, color: '#0F172A', marginBottom: '8px' }}>
              ক্লিনিক্যাল সেবা এখন আপনার নিয়ন্ত্রণে
            </h2>
            <p style={{ color: '#64748B', maxWidth: '580px', margin: '0 auto', fontSize: '14.5px' }}>
              ট্যাব পরিবর্তন করে দেখুন কীভাবে Doctor Booklet রোগীদের প্রতিটি পদক্ষেপকে করে তোলে সহজ ও স্বাচ্ছন্দ্যময়।
            </p>
          </div>

          <div className="patient-tab-nav">
            <button 
              className={`patient-tab-btn ${activeTab === 'booking' ? 'active' : ''}`}
              onClick={() => setActiveTab('booking')}
            >
              <Calendar size={16} />
              <span>অনলাইন বুকিং</span>
            </button>

            <button 
              className={`patient-tab-btn ${activeTab === 'livequeue' ? 'active' : ''}`}
              onClick={() => setActiveTab('livequeue')}
            >
              <Clock size={16} />
              <span>লাইভ কিউ ট্র্যাকার</span>
            </button>

            <button 
              className={`patient-tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
              onClick={() => setActiveTab('vault')}
            >
              <FileText size={16} />
              <span>প্রেসক্রিপশন ভল্ট</span>
            </button>

            <button 
              className={`patient-tab-btn ${activeTab === 'family' ? 'active' : ''}`}
              onClick={() => setActiveTab('family')}
            >
              <Users size={16} />
              <span>ফ্যামিলি প্রোফাইল</span>
            </button>
          </div>

          <div className="patient-tab-box">
            <Row className="align-items-center g-4">
              <Col lg={7} md={12}>
                <span style={{ 
                  color: tabShowcases[activeTab].badgeColor, 
                  fontSize: '13px', 
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {tabShowcases[activeTab].tag}
                </span>

                <h3 className="patient-tab-content-title">
                  {tabShowcases[activeTab].title}
                </h3>

                <p className="patient-tab-content-desc">
                  {tabShowcases[activeTab].desc}
                </p>

                <div className="patient-tab-points">
                  {tabShowcases[activeTab].points.map((pt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '50%', 
                        background: tabShowcases[activeTab].badgeColor, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="patient-tab-point-text">{pt}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Link to="/register/patient" style={{ 
                    background: tabShowcases[activeTab].badgeColor,
                    color: 'white',
                    padding: '11px 24px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '14.5px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: `0 8px 20px ${tabShowcases[activeTab].badgeColor}33`
                  }}>
                    <span>এখনই শুরু করুন</span>
                    <ArrowRight size={16} />
                  </Link>

                  <Link to="/doctors" style={{ 
                    background: 'white',
                    color: '#334155',
                    padding: '11px 20px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '14px',
                    textDecoration: 'none',
                    border: '1.5px solid #CBD5E1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>ডাক্তার তালিকা দেখুন</span>
                  </Link>
                </div>
              </Col>

              <Col lg={5} md={12}>
                <div className="patient-mockup-card" style={{ background: tabShowcases[activeTab].mockupBg }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                    </div>
                    <span style={{ fontSize: '11.5px', background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '99px', fontWeight: 700 }}>
                      Doctor Booklet Live
                    </span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(255,255,255,0.12)', marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', color: '#A7F3D0', fontWeight: 800, marginBottom: '4px' }}>
                      {tabShowcases[activeTab].mockupTitle}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 900, marginBottom: '10px' }}>
                      {tabShowcases[activeTab].mockupSubtitle}
                    </div>

                    {activeTab === 'livequeue' && (
                      <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>চলমান সিরিয়াল</div>
                          <div style={{ fontSize: '24px', fontWeight: 950, color: '#38BDF8' }}>#১২</div>
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }} />
                        <div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>আপনার সিরিয়াল</div>
                          <div style={{ fontSize: '24px', fontWeight: 950, color: '#34D399' }}>#১৫</div>
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }} />
                        <div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>বাকি সময়</div>
                          <div style={{ fontSize: '24px', fontWeight: 950, color: '#FBBF24' }}>১৫ মি.</div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'booking' && (
                      <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                          <span style={{ color: '#CBD5E1' }}>তারিখ ও সময়:</span>
                          <span style={{ fontWeight: 800, color: '#34D399' }}>আজ, বিকাল ৫:৩০</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                          <span style={{ color: '#CBD5E1' }}>সিরিয়াল টোকেন:</span>
                          <span style={{ fontWeight: 800, color: '#FFFFFF' }}>#DB-8492</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                          <span style={{ color: '#CBD5E1' }}>স্ট্যাটাস:</span>
                          <span style={{ fontWeight: 800, color: '#38BDF8' }}>✓ নিশ্চিত করা হয়েছে</span>
                        </div>
                      </div>
                    )}

                    {activeTab === 'vault' && (
                      <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <FileText size={18} color="#C084FC" />
                          <div style={{ fontSize: '13px', fontWeight: 800 }}>কার্ডিওলজি ই-প্রেসক্রিপশন</div>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#CBD5E1', lineHeight: '1.4' }}>
                          Rx: Tab. Rosuvastatin 10mg (০+০+১) <br />
                          পরবর্তী ভিজিট: ৪ সপ্তাহ পর
                        </div>
                      </div>
                    )}

                    {activeTab === 'family' && (
                      <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399' }} />
                          <span style={{ fontSize: '12.5px', fontWeight: 800 }}>আবুল কালাম (পিতা, বয়স: ৬২)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38BDF8' }} />
                          <span style={{ fontSize: '12.5px', fontWeight: 800 }}>সামিয়া রহমান (কন্যা, বয়স: ৭)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                    <span>সুরক্ষিত সার্ভার সংযোগ</span>
                    <span>২৫৬-বিট SSL সক্রিয়</span>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* ── 5. HOW IT WORKS (3 SIMPLE STEPS) ── */}
      <section className="patient-steps-section">
        <Container>
          <div className="text-center mb-5">
            <span style={{ 
              background: 'rgba(0, 184, 117, 0.1)', 
              color: '#00B875', 
              padding: '6px 16px', 
              borderRadius: '99px', 
              fontSize: '13px', 
              fontWeight: 800,
              display: 'inline-block',
              marginBottom: '10px'
            }}>
              ব্যবহার প্রণালী
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 950, color: '#0F172A', marginBottom: '12px' }}>
              সহজ ৩টি ধাপে সেবা গ্রহণ করুন
            </h2>
            <p style={{ color: '#64748B', maxWidth: '580px', margin: '0 auto', fontSize: '15px' }}>
              কোনো জটিলতা ছাড়াই মাত্র কয়েক মিনিটেই পছন্দের বিশেষজ্ঞ ডাক্তারের অ্যাপয়েন্টমেন্ট নিশ্চিত করুন।
            </p>
          </div>

          <Row className="g-4">
            {steps.map((st, idx) => (
              <Col lg={4} md={6} sm={12} key={idx}>
                <div className="patient-step-card">
                  <div className="patient-step-num">{st.num}</div>
                  <div>
                    <h3 className="patient-step-title">{st.title}</h3>
                    <p className="patient-step-desc">{st.desc}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── 6. COMPARISON (TRADITIONAL VS DOCTOR BOOKLET) ── */}
      <section className="patient-comparison-section">
        <Container>
          <div className="patient-compare-box">
            <div className="text-center mb-4">
              <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 32px)', fontWeight: 950, color: '#0F172A', marginBottom: '8px' }}>
                চিরাচরিত চেম্বার বনাম Doctor Booklet
              </h2>
              <p style={{ color: '#64748B', fontSize: '14.5px' }}>
                কেন হাজারো সচেতন মানুষ প্রতিদিন Doctor Booklet ব্যবহার করছেন?
              </p>
            </div>

            <Row className="g-4">
              <Col md={6}>
                <div style={{ background: '#FFF1F2', borderRadius: '18px', padding: '24px', border: '1px solid #FFE4E6', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E11D48', fontWeight: 900, fontSize: '16px', marginBottom: '14px' }}>
                    <Minus size={20} />
                    <span>ঐতিহ্যবাহী সাধারণ পদ্ধতি</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: '#475569' }}>
                    <div>❌ ভোরে চেম্বারে গিয়ে লাইনে দাঁড়িয়ে সিরিয়াল পাওয়ার অনিশ্চয়তা</div>
                    <div>❌ ডাক্তার কখন শুরু করবেন বা দেরি হবে কিনা জানা থাকে না</div>
                    <div>❌ ওয়েটিং রুমে ঘণ্টার পর ঘণ্টা বসে সময় ও শক্তি অপচয়</div>
                    <div>❌ পুরোনো প্রেসক্রিপশন ও টেস্ট রিপোর্ট হারিয়ে যাওয়ার উচ্চ ঝুঁকি</div>
                    <div>❌ দূরবর্তী এলাকার ডাক্তারের প্রকৃত ফি ও ডিগ্রি যাচাইয়ের সুযোগ নেই</div>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div style={{ background: '#F0FDF4', borderRadius: '18px', padding: '24px', border: '1px solid #DCFCE7', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00B875', fontWeight: 900, fontSize: '16px', marginBottom: '14px' }}>
                    <Plus size={20} />
                    <span>Doctor Booklet স্মার্ট সমাধান</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: '#166534', fontWeight: 600 }}>
                    <div>✓ ঘরে বসেই মোবাইল থেকে ১ ক্লিকে নিশ্চিত অ্যাপয়েন্টমেন্ট</div>
                    <div>✓ মোবাইলেই লাইভ সিরিয়াল কিউ ট্র্যাকিং ও আনুমানিক সময়ের হিসেব</div>
                    <div>✓ অযথা অপেক্ষা ছাড়া সময়মতো হাসপাতালে পৌঁছে সেবা গ্রহণ</div>
                    <div>✓ ডিজিটাল প্রেসক্রিপশন ক্লাউডে সারাজীবন নিরাপদ ও সহজে অ্যাক্সেসযোগ্য</div>
                    <div>✓ BMDC ভেরিফাইড ডাক্তারের প্রোফাইল, ডিগ্রি ও স্বচ্ছ ভিজিটিং ফি</div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* ── 7. DATA SECURITY GUARANTEE ── */}
      <section className="patient-security-section">
        <Container>
          <div className="patient-security-card">
            <div className="patient-security-inner">
              <div className="patient-lock-icon-box">
                <ShieldCheck size={36} strokeWidth={2.2} />
              </div>

              <div className="patient-security-content">
                <h3 className="patient-security-title">
                  আপনার স্বাস্থ্য তথ্যের পূর্ণ গোপনীয়তা ও সুরক্ষা
                </h3>
                <p className="patient-security-desc">
                  আপনার প্রেসক্রিপশন, ডায়াগনস্টিক রিপোর্ট এবং ব্যক্তিগত স্বাস্থ্য ইতিহাস আন্তর্জাতিক হেলথকেয়ার ডেটা প্রোটেকশন স্ট্যান্ডার্ড এবং ২৫৬-বিট এসএসএল (SSL) এনক্রিপশন দ্বারা সম্পূর্ণ নিরাপদ। আপনার অনুমতি ছাড়া কোনো তৃতীয় পক্ষ এই তথ্য দেখতে পারে না।
                </p>

                <div className="patient-security-badges">
                  <span className="patient-security-pill">
                    <CheckCircle2 size={14} color="#00B875" />
                    <span>২৫৬-বিট SSL এনক্রিপশন</span>
                  </span>
                  <span className="patient-security-pill">
                    <CheckCircle2 size={14} color="#00B875" />
                    <span>আন্তর্জাতিক ডেটা প্রটোকল</span>
                  </span>
                  <span className="patient-security-pill">
                    <CheckCircle2 size={14} color="#00B875" />
                    <span>১০০% তথ্য সুরক্ষা</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 8. PATIENT FAQS ── */}
      <section className="patient-faq-section">
        <Container>
          <div className="text-center mb-5">
            <span style={{ 
              background: 'rgba(0, 184, 117, 0.1)', 
              color: '#00B875', 
              padding: '6px 16px', 
              borderRadius: '99px', 
              fontSize: '13px', 
              fontWeight: 800,
              display: 'inline-block',
              marginBottom: '10px'
            }}>
              সাধারণ জিজ্ঞাসা
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 950, color: '#0F172A', marginBottom: '12px' }}>
              রোগীদের সচরাচর প্রশ্ন ও উত্তর
            </h2>
            <p style={{ color: '#64748B', maxWidth: '560px', margin: '0 auto', fontSize: '15px' }}>
              Doctor Booklet ব্যবহারে রোগীদের সবচেয়ে বেশি করা প্রশ্নগুলোর স্পষ্ট উত্তর নিচে দেওয়া হলো।
            </p>
          </div>

          <Row className="justify-content-center">
            <Col lg={9} md={11}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx
                  return (
                    <div 
                      key={idx}
                      style={{ 
                        background: 'white',
                        borderRadius: '16px',
                        border: isOpen ? '1.5px solid #00B875' : '1px solid #E2E8F0',
                        overflow: 'hidden',
                        boxShadow: isOpen ? '0 8px 24px rgba(0, 184, 117, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <button 
                        className="patient-faq-btn"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                          <span 
                            className="patient-faq-q-badge"
                            style={{ 
                              background: isOpen ? '#00B875' : '#F1F5F9',
                              color: isOpen ? 'white' : '#64748B'
                            }}
                          >
                            ?
                          </span>
                          <span 
                            className="patient-faq-question"
                            style={{ color: isOpen ? '#00B875' : '#0F172A' }}
                          >
                            {faq.q}
                          </span>
                        </div>

                        <div 
                          className="patient-faq-icon"
                          style={{ 
                            background: isOpen ? '#DCFCE7' : '#F8FAFC',
                            color: isOpen ? '#00B875' : '#94A3B8'
                          }}
                        >
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="patient-faq-answer">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── 9. BOTTOM CTA BANNER ── */}
      <section className="patient-bottom-cta">
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="patient-bottom-cta-title">
            আজই যুক্ত হোন Doctor Booklet স্বাস্থ্য পরিবারে
          </h2>
          <p className="patient-bottom-cta-desc">
            মাত্র ১ মিনিটে বিনামূল্যে আপনার রোগীর অ্যাকাউন্ট তৈরি করুন এবং নিজের ও পরিবারের জন্য আধুনিক ডিজিটাল স্বাস্থ্যসেবার অভিজ্ঞতা গ্রহণ করুন।
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register/patient" className="patient-bottom-cta-btn">
              <Users size={18} />
              <span>বিনামূল্যে রেজিস্টার করুন</span>
              <ArrowRight size={17} />
            </Link>

            <Link to="/login" className="patient-bottom-secondary-btn">
              <Laptop size={17} />
              <span>লগইন করুন</span>
            </Link>
          </div>
        </Container>
      </section>

    </div>
  )
}

import React, { useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { 
  Stethoscope, Calendar, Clock, Tv, FileText, Users, 
  ShieldCheck, ArrowRight, Sparkles, TrendingUp, CheckCircle2,
  PhoneCall, Laptop, ChevronDown, ChevronUp, Activity, 
  HelpCircle, Award, Database, Bell, Shield, Lock, Check, Plus, Minus
} from 'lucide-react'

export default function DoctorInfoPage() {
  const [activeTab, setActiveTab] = useState('chamber')
  const [openFaq, setOpenFaq] = useState(0)

  // 6 Core Enterprise Doctor Services
  const doctorServices = [
    {
      id: 'chamber',
      icon: <Calendar size={26} />,
      badge: 'চেম্বার ও সময়সূচী',
      title: 'মাল্টি-চেম্বার ও শিফট ম্যানেজমেন্ট',
      desc: 'আপনার একাধিক প্রাইভেট চেম্বার ও হাসপাতালের প্র্যাকটিস শিডিউল একই ড্যাশবোর্ড থেকে সহজেই নিয়ন্ত্রণ করুন।',
      highlights: [
        'সকাল, বিকাল ও সন্ধ্যার কাস্টম শিফট স্লট তৈরি',
        'দৈনিক সর্বোচ্চ রোগী লিমিট ও অটো-ক্লোজ স্লট',
        'এক ক্লিকে জরুরি ছুটি / অফ-ডে সক্রিয়করণ ও রোগীদের এসএমএস অ্যালার্ট',
        'সহকারী (PA/Compounder) এর জন্য আলাদা অপারেটর অ্যাক্সেস'
      ],
      color: '#00B875',
      bg: '#F0FDF4',
      border: '#DCFCE7'
    },
    {
      id: 'display',
      icon: <Tv size={26} />,
      badge: 'লাইভ সিরিয়াল কিউ',
      title: 'চেম্বার স্মার্ট টিভি ডিসপ্লে বোর্ড',
      desc: 'ওয়েটিং রুমে অযথা ভিড় ও বিশৃঙ্খলা দূর করতে স্মার্ট টিভি বা ট্যাবলেটে স্বয়ংক্রিয় লাইভ সিরিয়াল ডিসপ্লে সিস্টেম।',
      highlights: [
        'অ্যাসিস্ট্যান্টের এক ক্লিকে "পরবর্তী রোগী কল" (Next Patient)',
        'চেম্বারের বাইরে টিভি স্ক্রিনে চলমান সিরিয়াল ও ডাক নম্বর প্রদর্শন',
        'রোগীর নিজস্ব মোবাইলেও লাইভ সিরিয়াল ও সম্ভাব্য সময় আপডেট',
        'কোনো বাড়তি হার্ডওয়্যার ছাড়াই সাধারণ যেকোনো টিভি/ল্যাপটপে চলে'
      ],
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#DBEAFE'
    },
    {
      id: 'prescription',
      icon: <FileText size={26} />,
      badge: 'স্মার্ট ই-প্রেসক্রিপশন',
      title: 'ক্লিনিক্যাল ডিজিটাল প্রেসক্রিপশন বিল্ডার',
      desc: '৫০,০০০+ ব্র্যান্ড ও জেনেরিক ঔষধের সমন্বিত ডাটাবেজ সহ মাত্র ২ মিনিটে নির্ভুল ও আধুনিক প্রেসক্রিপশন তৈরি।',
      highlights: [
        'ড্রপডাউন ঔষধ সার্চ, অটো ডোজ ও খাবার নিয়ম নির্বাচন',
        'চিফ কমপ্লেইন্টস, ক্লিনিক্যাল নোট ও ইনভেস্টিগেশন টেমপ্লেট',
        'রোগীর হোয়াটসঅ্যাপ ও এসএমএসে তাৎক্ষণিক প্রেসক্রিপশন কপি প্রেরণ',
        'ডাক্তারের নিজস্ব অফিসিয়াল হেডার ও প্যাড ফরম্যাটে প্রিন্ট সুবিধা'
      ],
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#EDE9FE'
    },
    {
      id: 'records',
      icon: <Database size={26} />,
      badge: 'মেডিকেল ক্লাউড',
      title: 'রোগীর আজীবন হেলথ রেকর্ড ও হিস্ট্রি',
      desc: 'রোগীদের পূর্ববর্তী ভিজিট, পুরোনো প্রেসক্রিপশন এবং ডায়াগনস্টিক রিপোর্ট সংরক্ষিত থাকে নিরাপদ ক্লাউড সার্ভারে।',
      highlights: [
        'রোগীর মোবাইল নম্বর বা কিউআর স্ক্যান করলেই পূর্ব ইতিহাস এক নজরে',
        'দীর্ঘমেয়াদী ক্রনিক রোগীর ফলো-আপ ও হিস্ট্রি ট্র্যাকিং',
        'কাগজের পুরোনো ফাইল খোঁজার ঝামেলা চিরতরে নির্মূল',
        '২৪/৭ নিরবচ্ছিন্ন ব্যাকআপ ও চিকিৎসকের অনুমতি ছাড়া তথ্য অপ্রাপ্য'
      ],
      color: '#0D9488',
      bg: '#F0FDFA',
      border: '#CCFBF1'
    },
    {
      id: 'growth',
      icon: <TrendingUp size={26} />,
      badge: 'ডিজিটাল ভিজিবিলিটি',
      title: 'ভেরিফাইড ডাক্তার প্রোফাইল ও রোগী বৃদ্ধি',
      desc: 'প্রতিদিন হাজার হাজার রোগী আপনার অভিজ্ঞতা, যোগ্যতা ও চেম্বার সম্পর্কে জানতে পারবে বিশ্বস্ত প্ল্যাটফর্মে।',
      highlights: [
        'BMDC ভেরিফাইড সিল সহ প্রিমিয়াম পাবলিক পোর্টফোলিও পেজ',
        'গুগল ও লোকাল সার্চে চেম্বারের সহজ উপস্থিতি (SEO Boosted)',
        'রোগীদের সরাসরি অনলাইন বুকিং ও সিরিয়াল গ্রহণের সুযোগ',
        'রোগীদের পজিটিভ রিভিউ ও রেটিং প্রদর্শনের মাধ্যমে বিশ্বাসযোগ্যতা'
      ],
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FEF3C7'
    },
    {
      id: 'analytics',
      icon: <Activity size={26} />,
      badge: 'অ্যানালিটিক্স ও রিপোর্ট',
      title: 'প্র্যাকটিস অ্যানালিটিক্স ও ইনকাম ট্র্যাকার',
      desc: 'আপনার প্র্যাকটিসের প্রবৃদ্ধি, রোগী দেখার গড় সময় এবং চেম্বার ফি সংক্রান্ত বিস্তারিত গ্রাফিকাল রিপোর্ট।',
      highlights: [
        'দৈনিক, সাপ্তাহিক ও মাসিক রোগী সংখ্যা এবং চেম্বারভিত্তিক রিপোর্ট',
        'রোগীর বয়স, লিঙ্গ ও রোগের ধরন অনুযায়ী পরিসংখ্যান',
        'সহকারীর ক্যাশ কালেকশন রিকনসিলিয়েশন ও স্বচ্ছ হিসাবরক্ষণ',
        'এক ক্লিকে এক্সেল বা পিডিএফ ডাউনলোড সুবিধা'
      ],
      color: '#E11D48',
      bg: '#FFF1F2',
      border: '#FFE4E6'
    }
  ]

  // Interactive Tab Showcase Data
  const tabShowcases = {
    chamber: {
      tag: 'চেম্বার নিয়ন্ত্রণ',
      title: 'সব চেম্বার এখন একটি স্ক্রিনে',
      desc: 'হাসপাতালের কনসালটেন্সি হোক বা নিজস্ব ব্যক্তিগত চেম্বার—দিন, শিফট, সময়সূচী ও সর্বোচ্চ রোগী সংখ্যা নির্ধারণ করুন সহজেই। হঠাৎ কোথাও যেতে হলে এক ক্লিকেই চেম্বার অফ করে রোগীদের এসএমএসে জানিয়ে দিন।',
      points: [
        'মাল্টি-লোকেশন ও শিফট ভিত্তিক স্মার্ট স্লট',
        'অটোমেটেড এসএমএস কনফার্মেশন ও রিমাইন্ডার',
        'অ্যাসিস্ট্যান্টের জন্য সুরক্ষিত সাব-অ্যাকাউন্ট',
        'ভিজিটিং ফি ও ফলো-আপ ফি স্বয়ংক্রিয় কনফিগারেশন'
      ],
      badgeColor: '#00B875',
      mockupBg: '#064E3B'
    },
    display: {
      tag: 'স্মার্ট টিভি সিরিয়াল',
      title: 'চেম্বারের ওয়েটিং রুমে ডিজিটাল শৃঙ্খলা',
      desc: 'রোগীদের অযথা দরজায় নক করা বন্ধ করুন। রিসেপশন বা আপনার মোবাইল থেকে "পরবর্তী রোগী" চাপলেই ওয়েটিং রুমের স্মার্ট টিভি পর্দায় শব্দ সহ সিরিয়াল নম্বর এবং রোগীর নাম ভেসে উঠবে।',
      points: [
        'কোনো অ্যাপ ইন্সটল ছাড়া যেকোনো স্মার্ট টিভিতে ফুল-স্ক্রিন ডিসপ্লে',
        'রোগী ডাকার সময় অডিও/ভয়েস নোটিফিকেশন অ্যালার্ট',
        'রোগীর মোবাইলেও নিজের সিরিয়ালের লাইভ অগ্রগতি দেখার সুযোগ',
        'সহকারী সরাসরি রিসেপশন ডেস্ক থেকে সিরিয়াল ম্যানেজ করতে পারবেন'
      ],
      badgeColor: '#2563EB',
      mockupBg: '#1E3A8A'
    },
    prescription: {
      tag: 'ডিজিটাল প্রেসক্রিপশন',
      title: 'প্রেসক্রিপশন লিখুন দ্বিগুণ গতিতে',
      desc: 'হাতে লেখার অস্পষ্টতা পরিহার করে ব্র্যান্ডেড ও আধুনিক ই-প্রেসক্রিপশন দিন। ৫০ হাজারেরও বেশি দেশি-বিদেশি ঔষধের তালিকা ড্রপডাউনে থাকায় টাইপিং ছাড়াই দ্রুত সিলেক্ট করা যায়।',
      points: [
        'আপনার নিজস্ব লেটারহেড ও ভিজিটিং কার্ড প্যাটার্নে প্রিন্ট',
        'এক ক্লিকে সচরাচর ব্যবহৃত ওষুধ সেট ও ডোজ টেমপ্লেট',
        'রোগীর হোয়াটসঅ্যাপ ও এসএমএসে ডিজিটাল পিডিএফ প্রেসক্রিপশন',
        'ড্রাগ ইন্টারেকশন ও সেফটি প্রোটোকল মেনে নির্ভুল পরামর্শ'
      ],
      badgeColor: '#7C3AED',
      mockupBg: '#4C1D95'
    },
    records: {
      tag: 'রোগীর ইতিহাস',
      title: 'রোগীর পুরোনো প্রেসক্রিপশন আর হারাবে না',
      desc: 'রোগী দ্বিতীয়বার চেম্বারে এলেই তার সম্পূর্ণ পূর্ববর্তী ইতিহাস, পূর্বের প্রেসক্রিপশন ও টেস্ট রেজাল্ট আপনার চোখের সামনে থাকবে। সঠিক ডায়াগনোসিস হবে আরও দ্রুত ও নির্ভুল।',
      points: [
        'রোগীর ফোন নম্বর বা বিএমডিসি আইডি দিয়ে তাৎক্ষণিক প্রোফাইল সার্চ',
        'রোগীর আপলোড করা টেস্ট রিপোর্ট ও প্রেসক্রিপশন ডিজিটাল ভিউ',
        'সম্পূর্ণ এনক্রিপ্টেড ও আন্তর্জাতিক ডেটা নিরাপত্তা মানসম্মত',
        'চিকিৎসকের অনুমোদন ব্যতীত রোগীর তথ্য সম্পূর্ণ সুরক্ষিত'
      ],
      badgeColor: '#0D9488',
      mockupBg: '#134E4A'
    }
  }

  // 3 Easy Steps to Join
  const steps = [
    {
      num: '১',
      title: 'ফ্রি রেজিস্ট্রেশন করুন',
      desc: 'আপনার মোবাইল নম্বর, নাম এবং ইমেইল দিয়ে মাত্র ২ মিনিটে অ্যাকাউন্ট তৈরি করুন।'
    },
    {
      num: '২',
      title: 'ডিগ্রি ও চেম্বার যুক্ত করুন',
      desc: 'আপনার BMDC রেজিস্ট্রেশন নম্বর, ডিগ্রিসমূহ এবং চেম্বারের সময়সূচী প্রোফাইলে যুক্ত করুন।'
    },
    {
      num: '৩',
      title: 'তাৎক্ষণিক ভেরিফিকেশন ও লাইভ',
      desc: 'আমাদের সাপোর্ট টিম দ্রুত BMDC যাচাই করে অ্যাকাউন্ট সক্রিয় করবে এবং রোগীরা সরাসরি সিরিয়াল দেওয়া শুরু করবে।'
    }
  ]

  // FAQs
  const faqs = [
    {
      q: 'Doctor Booklet-এ ডাক্তার হিসেবে রেজিস্ট্রেশন করতে কি কোনো ফি লাগে?',
      a: 'না, রেজিস্ট্রেশন সম্পূর্ণ বিনামূল্যে। ডাক্তাররা বিনামূল্যে প্রোফাইল তৈরি করতে পারেন এবং মূল ফিচারগুলো ট্রায়াল দিতে পারেন।'
    },
    {
      q: 'আমার চেম্বারের সহকারী বা কম্পাউন্ডার কি এই সিস্টেম ব্যবহার করতে পারবে?',
      a: 'হ্যাঁ, অবশ্যই। ডাক্তার অ্যাকাউন্টের পাশাপাশি রিসেপশনিস্ট বা সহকারীর জন্য আলাদা "অপারেটর রোল" সুবিধা রয়েছে। তিনি রোগীদের ফোন কল ও সরাসরি উপস্থিত রোগীদের সিরিয়াল এন্ট্রি এবং টিভি ডিসপ্লে অপারেট করতে পারবেন, কিন্তু আপনার গোপনীয় ক্লিনিক্যাল তথ্য দেখতে পারবেন না।'
    },
    {
      q: 'আমি একাধিক হাসপাতালে ও চেম্বারে বসি, সবগুলো কি একসাথে চালানো সম্ভব?',
      a: 'হ্যাঁ, Doctor Booklet বিশেষভাবে মাল্টি-চেম্বার সাপোর্ট করে। আপনি যত ইচ্ছা চেম্বার বা হাসপাতাল যোগ করতে পারবেন এবং প্রতিটি চেম্বারের আলাদা দিন ও সময় নির্ধারণ করতে পারবেন।'
    },
    {
      q: 'লাইভ সিরিয়াল ডিসপ্লে বোর্ডের জন্য কি আলাদা কোনো ব্যয়বহুল ডিভাইস কিনতে হবে?',
      a: 'একেবারেই না। চেম্বারের ওয়েটিং রুমে থাকা যেকোনো সাধারণ স্মার্ট টিভি, ট্যাবলেট বা ল্যাপটপের ব্রাউজারে একটি মাত্র লিংক ওপেন করলেই স্বয়ংক্রিয় ফুল-স্ক্রিন ডিসপ্লে বোর্ড চালু হয়ে যাবে।'
    },
    {
      q: 'আমার এবং আমার রোগীদের তথ্যের সুরক্ষা ও গোপনীয়তা কীভাবে নিশ্চিত করা হয়?',
      a: 'আমরা আন্তর্জাতিক হেলথকেয়ার ডেটা প্রোটেকশন স্ট্যান্ডার্ড এবং ২৫৬-বিট এসএসএল (SSL) এনক্রিপশন ব্যবহার করি। আপনার প্রেসক্রিপশন এবং রোগীদের তথ্য সম্পূর্ণ সুরক্ষিত এবং আপনার অনুমতি ব্যতীত কেউ প্রবেশ করতে পারে না।'
    }
  ]

  return (
    <div className="doctor-info-page" style={{ background: '#F8FAFC', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ── RESPONSIVE COMPACT STYLING ── */}
      <style>{`
        .doctor-hero-section {
          position: relative;
          background: linear-gradient(145deg, #022C22 0%, #064E3B 45%, #0B3B32 100%);
          padding: 135px 0 85px;
          color: white;
          overflow: hidden;
        }
        .doctor-hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(52, 211, 153, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(52, 211, 153, 0.07) 1px, transparent 1px);
          background-size: 38px 38px;
          pointer-events: none;
        }
        .doctor-hero-glow-1 {
          position: absolute;
          top: -120px;
          right: -80px;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 184, 117, 0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .doctor-hero-glow-2 {
          position: absolute;
          bottom: -150px;
          left: -100px;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, transparent 70%);
          pointer-events: none;
        }
        .doctor-hero-badge {
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
        .doctor-hero-title {
          font-size: clamp(30px, 4.5vw, 54px);
          font-weight: 950;
          line-height: 1.25;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
          color: #FFFFFF !important;
        }
        .doctor-hero-title-accent {
          background: linear-gradient(90deg, #34D399 0%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        .doctor-hero-desc {
          font-size: clamp(14.5px, 1.8vw, 17.5px);
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.9);
          max-width: 780px;
          margin: 0 auto 36px;
          font-weight: 450;
        }
        .doctor-hero-cta-btn {
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
        .doctor-hero-cta-btn:hover {
          background: #059669;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(0, 184, 117, 0.5);
        }
        .doctor-hero-secondary-btn {
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
        .doctor-hero-secondary-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-color: rgba(255, 255, 255, 0.45);
        }
        .doctor-hero-trust-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          font-size: 13px;
          color: #A7F3D0;
          font-weight: 600;
          flex-wrap: wrap;
        }
        .doctor-hero-trust-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* Trust bar */
        .doctor-trust-bar {
          margin-top: -36px;
          position: relative;
          z-index: 10;
        }
        .doctor-trust-card {
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
        .doctor-stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .doctor-stat-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .doctor-stat-val {
          font-size: 22px;
          font-weight: 950;
          color: #0F172A;
          line-height: 1;
        }
        .doctor-stat-lbl {
          font-size: 12px;
          color: #64748B;
          font-weight: 700;
          margin-top: 3px;
        }

        /* Service Cards */
        .doctor-services-section {
          padding: 75px 0 60px;
        }
        .doctor-service-card {
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
        .doctor-service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px rgba(0, 184, 117, 0.1);
          border-color: #A7F3D0;
        }
        .doctor-service-icon-box {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .doctor-service-title {
          font-size: 17.5px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 10px;
          line-height: 1.35;
        }
        .doctor-service-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.6;
          margin-bottom: 18px;
        }
        .doctor-service-points {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .doctor-service-point-text {
          font-size: 12.5px;
          color: #334155;
          font-weight: 600;
          line-height: 1.45;
        }

        /* Tabs Showcase */
        .doctor-tab-section {
          padding: 65px 0;
          background: white;
          border-top: 1px solid #E2E8F0;
          border-bottom: 1px solid #E2E8F0;
        }
        .doctor-tab-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          background: #F1F5F9;
          padding: 6px;
          border-radius: 18px;
          max-width: 680px;
          margin: 0 auto 32px;
        }
        .doctor-tab-btn {
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
        .doctor-tab-btn.active {
          background: #00B875;
          color: white;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.3);
        }
        .doctor-tab-box {
          background: #F8FAFC;
          border-radius: 28px;
          border: 1px solid #E2E8F0;
          padding: clamp(24px, 4vw, 42px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
        }
        .doctor-tab-content-title {
          font-size: clamp(20px, 2.5vw, 28px);
          font-weight: 950;
          color: #0F172A;
          margin-bottom: 14px;
        }
        .doctor-tab-content-desc {
          color: #475569;
          font-size: 14.5px;
          line-height: 1.7;
          margin-bottom: 22px;
        }
        .doctor-tab-points {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 26px;
        }
        .doctor-tab-point-text {
          font-size: 13.5px;
          color: #1E293B;
          font-weight: 700;
        }
        .doctor-mockup-card {
          border-radius: 22px;
          padding: 26px 22px;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.15);
        }

        /* Steps Section */
        .doctor-steps-section {
          padding: 70px 0 60px;
        }
        .doctor-step-card {
          background: white;
          border-radius: 20px;
          padding: 26px 22px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.03);
          height: 100%;
          position: relative;
        }
        .doctor-step-num {
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
        .doctor-step-title {
          font-size: 17px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 10px;
        }
        .doctor-step-desc {
          font-size: 13.5px;
          color: #64748B;
          line-height: 1.6;
          margin: 0;
        }

        /* Security Section */
        .doctor-security-section {
          padding: 50px 0;
          background: #F1F5F9;
          border-top: 1px solid #E2E8F0;
          border-bottom: 1px solid #E2E8F0;
        }
        .doctor-security-card {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          border-radius: 24px;
          padding: clamp(24px, 4vw, 40px);
          color: white;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.15);
        }
        .doctor-security-title {
          font-size: clamp(20px, 2.5vw, 26px);
          font-weight: 900;
          margin-bottom: 10px;
          color: #FFFFFF;
        }
        .doctor-security-desc {
          color: rgba(255,255,255,0.8);
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }
        .doctor-lock-icon-box {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          background: rgba(52, 211, 153, 0.2);
          color: #34D399;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid rgba(52, 211, 153, 0.4);
        }

        /* FAQ Section */
        @keyframes doctorFaqFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .doctor-faq-section {
          padding: 70px 0 60px;
        }
        .doctor-faq-btn {
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
        .doctor-faq-q-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13.5px;
          font-weight: 800;
          font-family: 'Plus Jakarta Sans', 'Hind Siliguri', sans-serif;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .doctor-faq-question {
          font-weight: 600;
          font-size: 15.5px;
          line-height: 1.4;
          font-family: 'Hind Siliguri', sans-serif;
          flex: 1;
          transition: color 0.2s ease;
        }
        .doctor-faq-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .doctor-faq-answer {
          padding: 0 24px 20px;
          animation: doctorFaqFadeIn 0.3s ease;
        }
        .doctor-faq-answer p {
          margin: 0;
          color: #475569;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.6;
          font-family: 'Hind Siliguri', sans-serif;
        }

        /* Bottom CTA */
        .doctor-bottom-cta {
          padding: 80px 0;
          background: linear-gradient(145deg, #022C22 0%, #064E3B 100%);
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .doctor-bottom-cta h2,
        .doctor-bottom-cta-title {
          color: #FFFFFF !important;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          font-weight: 950 !important;
          font-size: clamp(24px, 3.8vw, 38px);
          margin-bottom: 14px;
        }
        .doctor-bottom-cta-desc {
          color: rgba(255, 255, 255, 0.85);
          font-size: 15.5px;
          max-width: 640px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }
        .doctor-bottom-cta-btn {
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
        .doctor-bottom-secondary-btn {
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

        /* ── MOBILE VIEW OPTIMIZATIONS (<= 768px) ── */
        @media (max-width: 768px) {
          .doctor-hero-section {
            padding: 95px 0 40px !important;
          }
          .doctor-hero-badge {
            font-size: 11px !important;
            padding: 5px 12px !important;
            gap: 6px !important;
            margin-bottom: 14px !important;
            white-space: nowrap !important;
            max-width: 100% !important;
          }
          .doctor-hero-title {
            font-size: 23px !important;
            line-height: 1.3 !important;
            margin-bottom: 12px !important;
          }
          .doctor-hero-desc {
            font-size: 13px !important;
            line-height: 1.55 !important;
            margin-bottom: 22px !important;
            padding: 0 2px !important;
          }
          .doctor-hero-cta-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 12px 18px !important;
            font-size: 14.5px !important;
            border-radius: 12px !important;
          }
          .doctor-hero-secondary-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 11px 18px !important;
            font-size: 14px !important;
            border-radius: 12px !important;
          }
          .doctor-hero-trust-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 7px !important;
            font-size: 11.5px !important;
            margin-top: 14px !important;
          }
          .doctor-hero-trust-item {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
          }

          /* Trust Bar (2x2 Grid) */
          .doctor-trust-bar {
            margin-top: -20px !important;
            padding: 0 10px !important;
          }
          .doctor-trust-card {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            padding: 10px !important;
            border-radius: 16px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05) !important;
          }
          .doctor-stat-item {
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
          .doctor-stat-icon-wrap {
            width: 32px !important;
            height: 32px !important;
            border-radius: 9px !important;
          }
          .doctor-stat-icon-wrap svg {
            width: 16px !important;
            height: 16px !important;
          }
          .doctor-stat-val {
            font-size: 16px !important;
            line-height: 1 !important;
          }
          .doctor-stat-lbl {
            font-size: 10.5px !important;
            line-height: 1.25 !important;
            margin-top: 2px !important;
          }

          /* Services Section */
          .doctor-services-section {
            padding: 36px 0 24px !important;
          }
          .doctor-section-header {
            margin-bottom: 22px !important;
          }
          .doctor-section-header h2 {
            font-size: 21px !important;
            margin-bottom: 8px !important;
          }
          .doctor-section-header p {
            font-size: 12.5px !important;
            line-height: 1.5 !important;
          }
          .doctor-service-card {
            padding: 18px 15px !important;
            border-radius: 16px !important;
          }
          .doctor-service-icon-box {
            width: 42px !important;
            height: 42px !important;
            border-radius: 12px !important;
          }
          .doctor-service-icon-box svg {
            width: 20px !important;
            height: 20px !important;
          }
          .doctor-service-title {
            font-size: 16px !important;
            margin-bottom: 6px !important;
          }
          .doctor-service-desc {
            font-size: 12px !important;
            line-height: 1.5 !important;
            margin-bottom: 14px !important;
          }
          .doctor-service-points {
            gap: 7px !important;
          }
          .doctor-service-point-text {
            font-size: 11.5px !important;
            line-height: 1.4 !important;
          }

          /* Tab Section */
          .doctor-tab-section {
            padding: 34px 0 !important;
          }
          .doctor-tab-nav {
            overflow-x: auto !important;
            justify-content: flex-start !important;
            padding: 4px !important;
            gap: 5px !important;
            scrollbar-width: none !important;
            border-radius: 12px !important;
            margin-bottom: 18px !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .doctor-tab-btn {
            padding: 7px 12px !important;
            font-size: 12px !important;
            border-radius: 9px !important;
            flex-shrink: 0 !important;
            gap: 6px !important;
          }
          .doctor-tab-btn svg {
            width: 14px !important;
            height: 14px !important;
          }
          .doctor-tab-box {
            padding: 16px 13px !important;
            border-radius: 18px !important;
          }
          .doctor-tab-content-title {
            font-size: 18px !important;
            margin-bottom: 8px !important;
          }
          .doctor-tab-content-desc {
            font-size: 12.5px !important;
            line-height: 1.55 !important;
            margin-bottom: 14px !important;
          }
          .doctor-tab-points {
            gap: 8px !important;
            margin-bottom: 16px !important;
          }
          .doctor-tab-point-text {
            font-size: 12px !important;
          }
          .doctor-mockup-card {
            padding: 14px 12px !important;
            border-radius: 16px !important;
            margin-top: 16px !important;
          }

          /* Steps Section */
          .doctor-steps-section {
            padding: 34px 0 26px !important;
          }
          .doctor-step-card {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 14px 12px !important;
            border-radius: 14px !important;
          }
          .doctor-step-num {
            width: 34px !important;
            height: 34px !important;
            border-radius: 10px !important;
            font-size: 16px !important;
            margin-bottom: 0 !important;
            flex-shrink: 0 !important;
          }
          .doctor-step-title {
            font-size: 15px !important;
            margin-bottom: 4px !important;
          }
          .doctor-step-desc {
            font-size: 12px !important;
            line-height: 1.5 !important;
          }

          /* Security Section */
          .doctor-security-section {
            padding: 24px 0 !important;
          }
          .doctor-security-card {
            padding: 18px 14px !important;
            border-radius: 18px !important;
          }
          .doctor-security-title {
            font-size: 17px !important;
            margin-bottom: 8px !important;
          }
          .doctor-security-desc {
            font-size: 12px !important;
            line-height: 1.5 !important;
          }
          .doctor-lock-icon-box {
            width: 48px !important;
            height: 48px !important;
            border-radius: 14px !important;
          }
          .doctor-lock-icon-box svg {
            width: 22px !important;
            height: 22px !important;
          }

          /* FAQ Section */
          .doctor-faq-section {
            padding: 34px 0 !important;
          }
          .doctor-faq-btn {
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          .doctor-faq-q-badge {
            width: 25px !important;
            height: 25px !important;
            font-size: 12.5px !important;
          }
          .doctor-faq-question {
            font-size: 14.2px !important;
            line-height: 1.38 !important;
            font-weight: 600 !important;
          }
          .doctor-faq-icon {
            width: 26px !important;
            height: 26px !important;
          }
          .doctor-faq-icon svg {
            width: 15px !important;
            height: 15px !important;
          }
          .doctor-faq-answer {
            padding: 0 14px 14px !important;
          }
          .doctor-faq-answer p {
            font-size: 13.5px !important;
            line-height: 1.55 !important;
          }

          /* Bottom CTA */
          .doctor-bottom-cta {
            padding: 44px 0 38px !important;
          }
          .doctor-bottom-cta-title {
            font-size: 20px !important;
            line-height: 1.35 !important;
            margin-bottom: 10px !important;
          }
          .doctor-bottom-cta-desc {
            font-size: 12.5px !important;
            line-height: 1.55 !important;
            margin-bottom: 20px !important;
          }
          .doctor-bottom-cta-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 12px 18px !important;
            font-size: 14.5px !important;
          }
          .doctor-bottom-secondary-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 11px 18px !important;
            font-size: 14px !important;
          }
        }
      `}</style>

      {/* ── 1. HERO SECTION ── */}
      <section className="doctor-hero-section">
        <div className="doctor-hero-grid" />
        <div className="doctor-hero-glow-1" />
        <div className="doctor-hero-glow-2" />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="justify-content-center text-center">
            <Col lg={10} md={12}>
              <div className="doctor-hero-badge">
                <Sparkles size={15} color="#34D399" />
                <span className="d-none d-sm-inline">চিকিৎসকদের জন্য আধুনিক ডিজিটাল ইকোসিস্টেম | Doctor Booklet Suite</span>
                <span className="d-sm-none">ডাক্তারদের স্মার্ট ডিজিটাল প্ল্যাটফর্ম</span>
              </div>

              <h1 className="doctor-hero-title">
                আপনার চিকিৎসা প্র্যাকটিসকে নিন <br />
                <span className="doctor-hero-title-accent">আধুনিক ডিজিটাল উচ্চতায়</span>
              </h1>

              <p className="doctor-hero-desc">
                অ্যাপয়েন্টমেন্ট জট নিরসন, রিয়েল-টাইম লাইভ সিরিয়াল টিভি ডিসপ্লে, ড্রপডাউন ড্রাগ ডাটাবেজ সহ স্মার্ট ই-প্রেসক্রিপশন এবং সমন্বিত পেশেন্ট হিস্ট্রি—সবকিছু এখন চিকিৎসকদের নিজস্ব ব্র্যান্ডেড পোর্টালে।
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                <Link to="/register/doctor" className="doctor-hero-cta-btn">
                  <Stethoscope size={18} />
                  <span>ডাক্তার হিসেবে যুক্ত হোন (ফ্রি)</span>
                  <ArrowRight size={17} />
                </Link>

                <Link to="/login/doctor" className="doctor-hero-secondary-btn">
                  <Laptop size={17} />
                  <span>ডাক্তার পোর্টাল লগইন</span>
                </Link>
              </div>

              <div className="doctor-hero-trust-row">
                <span className="doctor-hero-trust-item">
                  <CheckCircle2 size={15} color="#34D399" /> কোনো সেটআপ ফি নেই
                </span>
                <span className="doctor-hero-trust-item">
                  <CheckCircle2 size={15} color="#34D399" /> BMDC ভেরিফাইড চিকিৎসকদের অগ্রাধিকার
                </span>
                <span className="doctor-hero-trust-item">
                  <CheckCircle2 size={15} color="#34D399" /> ২৪/৭ ডেডিকেটেড ডক্টর সাপোর্ট
                </span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── 2. TRUST METRICS STRIP ── */}
      <Container className="doctor-trust-bar">
        <div className="doctor-trust-card">
          <div className="doctor-stat-item">
            <div className="doctor-stat-icon-wrap" style={{ background: '#F0FDF4', color: '#00B875' }}>
              <Stethoscope size={20} />
            </div>
            <div>
              <div className="doctor-stat-val">১,৫০০+</div>
              <div className="doctor-stat-lbl">রেজিস্টার্ড বিশেষজ্ঞ ডাক্তার</div>
            </div>
          </div>

          <div className="doctor-stat-item">
            <div className="doctor-stat-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Calendar size={20} />
            </div>
            <div>
              <div className="doctor-stat-val">১০০,০০০+</div>
              <div className="doctor-stat-lbl">সফল সিরিয়াল বুকিং</div>
            </div>
          </div>

          <div className="doctor-stat-item">
            <div className="doctor-stat-icon-wrap" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <Tv size={20} />
            </div>
            <div>
              <div className="doctor-stat-val">০ মিনিট</div>
              <div className="doctor-stat-lbl">সিরিয়াল বিভ্রান্তি ও জট</div>
            </div>
          </div>

          <div className="doctor-stat-item">
            <div className="doctor-stat-icon-wrap" style={{ background: '#FFFBEB', color: '#D97706' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="doctor-stat-val">১০০%</div>
              <div className="doctor-stat-lbl">ক্লাউড সিকিউরিটি ও এনক্রিপশন</div>
            </div>
          </div>
        </div>
      </Container>

      {/* ── 3. CORE SERVICES SUITE (কী কী সুবিধা পাচ্ছেন চিকিৎসকরা) ── */}
      <section className="doctor-services-section">
        <Container>
          <div className="text-center doctor-section-header" style={{ maxWidth: 740, margin: '0 auto 40px' }}>
            <span style={{ 
              background: '#DCFCE7', color: '#166534', 
              fontSize: 12, fontWeight: 800, padding: '4px 14px', 
              borderRadius: 99, display: 'inline-block', marginBottom: 10,
              border: '1px solid #BBF7D0'
            }}>
              ডাক্তারদের জন্য সমন্বিত সেবা
            </span>
            <h2 style={{ fontWeight: 900, color: '#0F172A', marginBottom: 12 }}>
              প্র্যাকটিস পরিচালনায় যা যা পাচ্ছেন চিকিৎসকরা
            </h2>
            <p style={{ color: '#64748B', margin: 0 }}>
              সিরিয়াল নেওয়া থেকে শুরু করে রোগী দেখা, প্রেসক্রিপশন প্রদান এবং ক্লিনিক্যাল হিস্ট্রি সংরক্ষণ—সবকিছুর একটি স্বয়ংক্রিয় প্রফেশনাল সমাধান।
            </p>
          </div>

          <Row className="g-3 g-md-4">
            {doctorServices.map((service) => (
              <Col lg={4} md={6} key={service.id}>
                <div className="doctor-service-card">
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div className="doctor-service-icon-box" style={{ 
                        background: service.bg, color: service.color, 
                        border: `1.5px solid ${service.border}`,
                        boxShadow: `0 6px 16px ${service.bg}`
                      }}>
                        {service.icon}
                      </div>
                      <span style={{ 
                        background: service.bg, color: service.color, 
                        fontSize: 11, fontWeight: 800, padding: '4px 10px', 
                        borderRadius: 99, border: `1px solid ${service.border}` 
                      }}>
                        {service.badge}
                      </span>
                    </div>

                    <h4 className="doctor-service-title">
                      {service.title}
                    </h4>

                    <p className="doctor-service-desc">
                      {service.desc}
                    </p>

                    {/* Bullet Points */}
                    <div className="doctor-service-points">
                      {service.highlights.map((point, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ 
                            width: 16, height: 16, borderRadius: '50%', 
                            background: service.bg, color: service.color, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            flexShrink: 0, marginTop: 2 
                          }}>
                            <Check size={10} strokeWidth={3} />
                          </div>
                          <span className="doctor-service-point-text">
                            {point}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                    <Link to="/register/doctor" style={{ 
                      fontSize: 12.5, fontWeight: 800, color: service.color, 
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 
                    }}>
                      <span>ব্যবহার শুরু করুন</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── 4. INTERACTIVE FEATURE SPOTLIGHT ── */}
      <section className="doctor-tab-section">
        <Container>
          <div className="text-center doctor-section-header" style={{ maxWidth: 700, margin: '0 auto 30px' }}>
            <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 8 }}>
              লাইভ ফিচার এক্সপ্লোরার
            </span>
            <h2 style={{ fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>
              চেম্বারের প্রতিটি কার্যক্রমের জন্য নির্ধারিত মডিউল
            </h2>
            <p style={{ color: '#64748B', margin: 0 }}>
              নিচের অপশনগুলোতে ক্লিক করে দেখুন Doctor Booklet চিকিৎসকের প্রতিদিনের সময় কীভাবে বাঁচায়।
            </p>
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="doctor-tab-nav">
            <button 
              onClick={() => setActiveTab('chamber')}
              className={`doctor-tab-btn ${activeTab === 'chamber' ? 'active' : ''}`}
            >
              <Calendar size={16} />
              <span>চেম্বার ও শিডিউল</span>
            </button>
            <button 
              onClick={() => setActiveTab('display')}
              className={`doctor-tab-btn ${activeTab === 'display' ? 'active' : ''}`}
            >
              <Tv size={16} />
              <span>টিভি ডিসপ্লে কিউ</span>
            </button>
            <button 
              onClick={() => setActiveTab('prescription')}
              className={`doctor-tab-btn ${activeTab === 'prescription' ? 'active' : ''}`}
            >
              <FileText size={16} />
              <span>ডিজিটাল প্রেসক্রিপশন</span>
            </button>
            <button 
              onClick={() => setActiveTab('records')}
              className={`doctor-tab-btn ${activeTab === 'records' ? 'active' : ''}`}
            >
              <Database size={16} />
              <span>পেশেন্ট রেকর্ডস</span>
            </button>
          </div>

          {/* Active Tab Showcase Box */}
          {tabShowcases[activeTab] && (
            <div className="doctor-tab-box">
              <Row className="align-items-center g-4">
                <Col lg={7}>
                  <span style={{ 
                    background: '#FFFFFF', color: tabShowcases[activeTab].badgeColor, 
                    fontSize: 12, fontWeight: 800, padding: '4px 14px', 
                    borderRadius: 99, display: 'inline-block', marginBottom: 12,
                    border: '1px solid #E2E8F0'
                  }}>
                    ● {tabShowcases[activeTab].tag}
                  </span>
                  <h3 className="doctor-tab-content-title">
                    {tabShowcases[activeTab].title}
                  </h3>
                  <p className="doctor-tab-content-desc">
                    {tabShowcases[activeTab].desc}
                  </p>

                  <div className="doctor-tab-points">
                    {tabShowcases[activeTab].points.map((pt, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span className="doctor-tab-point-text">{pt}</span>
                      </div>
                    ))}
                  </div>

                  <Link to="/register/doctor" style={{
                    background: '#00B875', color: 'white', padding: '10px 22px', borderRadius: 12,
                    fontWeight: 800, fontSize: 13.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 14px rgba(0, 184, 117, 0.3)'
                  }}>
                    <span>এখনই টেস্ট করুন</span>
                    <ArrowRight size={14} />
                  </Link>
                </Col>

                {/* Right Interactive Mockup Visual */}
                <Col lg={5}>
                  <div className="doctor-mockup-card" style={{ background: tabShowcases[activeTab].mockupBg }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                        Doctor Booklet Portal Live
                      </span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px', marginBottom: 10 }}>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.65)', marginBottom: 2 }}>চলমান সিরিয়াল স্টেটাস</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#34D399' }}>সিরিয়াল নং: #১২ (চলমান)</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>রোগী: তানভীর আহমেদ • ভিজিট: কনসাল্টেশন</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>মোট অপেক্ষমাণ</div>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>১৫ জন রোগী</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>গড় ভিজিট সময়</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#38BDF8' }}>৭.৫ মিনিট</div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Container>
      </section>

      {/* ── 5. HOW IT WORKS (৩টি সহজ ধাপ) ── */}
      <section className="doctor-steps-section">
        <Container>
          <div className="text-center doctor-section-header" style={{ maxWidth: 680, margin: '0 auto 32px' }}>
            <span style={{ background: '#DCFCE7', color: '#166534', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 8 }}>
              সহজ অনবোর্ডিং
            </span>
            <h2 style={{ fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>
              কীভাবে ডাক্তার হিসেবে যুক্ত হবেন?
            </h2>
            <p style={{ color: '#64748B', margin: 0 }}>
              মাত্র ৩টি সহজ ধাপে সম্পন্ন করুন আপনার রেজিস্ট্রেশন এবং শুরু করুন স্মার্ট ডিজিটাল প্র্যাকটিস।
            </p>
          </div>

          <Row className="g-3 g-md-4">
            {steps.map((st, idx) => (
              <Col lg={4} md={4} key={idx}>
                <div className="doctor-step-card">
                  <div className="doctor-step-num">{st.num}</div>
                  <div>
                    <h4 className="doctor-step-title">{st.title}</h4>
                    <p className="doctor-step-desc">{st.desc}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <div className="text-center" style={{ marginTop: 30 }}>
            <Link to="/register/doctor" style={{
              background: '#00B875', color: 'white', padding: '12px 28px', borderRadius: 12,
              fontWeight: 800, fontSize: 14.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 22px rgba(0, 184, 117, 0.3)'
            }}>
              <span>রেজিস্ট্রেশন শুরু করুন</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </Container>
      </section>

      {/* ── 6. SECURITY & COMPLIANCE SECTION ── */}
      <section className="doctor-security-section">
        <Container>
          <div className="doctor-security-card">
            <Row className="align-items-center g-3 g-md-4">
              <Col lg={8}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', padding: '4px 12px', borderRadius: 99, fontSize: 11.5, fontWeight: 800, marginBottom: 10 }}>
                  <ShieldCheck size={15} />
                  <span>ক্লিনিক্যাল ডেটা সুরক্ষা ও বিএমডিসি নিয়মাবলী</span>
                </div>
                <h3 className="doctor-security-title">
                  চিকিৎসকের স্বাধিকার ও রোগীর গোপনীয়তাই আমাদের মূল নীতি
                </h3>
                <p className="doctor-security-desc">
                  আপনার রোগীর প্রেসক্রিপশন ও তথ্যের সম্পূর্ণ মালিকানা শুধুই আপনার। কোনো তৃতীয় পক্ষের কাছে এই তথ্য হস্তান্তর করা হয় না। সকল ডেটা ২৫৬-বিট এসএসএল (SSL) ব্যাংক-গ্রেড এনক্রিপশনে সুরক্ষিত।
                </p>
              </Col>
              <Col lg={4} className="text-lg-end text-center mt-3 mt-lg-0">
                <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <div className="doctor-lock-icon-box">
                    <Lock size={26} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#DCFCE7' }}>
                    100% HIPAA ও BMDC রেগুলেশন ফ্রেন্ডলি
                  </span>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* ── 7. FREQUENTLY ASKED QUESTIONS (FAQ) ── */}
      <section className="doctor-faq-section">
        <Container style={{ maxWidth: 840 }}>
          <div className="text-center doctor-section-header" style={{ marginBottom: 28 }}>
            <span style={{ background: '#DCFCE7', color: '#166534', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 8 }}>
              সচরাচর জিজ্ঞাসা
            </span>
            <h2 style={{ fontWeight: 900, color: '#0F172A', margin: 0 }}>
              চিকিৎসকদের সাধারণ প্রশ্ন ও সমাধান
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div 
                  key={idx}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 12,
                    border: `1px solid ${isOpen ? '#86EFAC' : '#E2E8F0'}`,
                    overflow: 'hidden',
                    boxShadow: isOpen ? '0 4px 20px rgba(0, 184, 117, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="doctor-faq-btn"
                    aria-expanded={isOpen}
                  >
                    <span
                      className="doctor-faq-q-badge"
                      style={{
                        background: isOpen ? '#00B875' : '#F1F5F9',
                        color: isOpen ? '#FFFFFF' : '#64748B',
                        border: isOpen ? '1px solid #00B875' : '1px solid #E2E8F0'
                      }}
                    >
                      ?
                    </span>
                    <span className="doctor-faq-question" style={{ color: isOpen ? '#15803D' : '#1E293B' }}>
                      {faq.q}
                    </span>
                    <span
                      className="doctor-faq-icon"
                      style={{
                        background: isOpen ? '#ECFDF5' : '#F8FAFC',
                        color: isOpen ? '#00B875' : '#64748B',
                        border: isOpen ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    >
                      <ChevronDown size={17} strokeWidth={2.4} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="doctor-faq-answer">
                      <div style={{ height: 1, background: '#F1F5F9', marginBottom: 12 }} />
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* ── 8. BOTTOM HIGH-CONVERTING CTA ── */}
      <section className="doctor-bottom-cta">
        {/* Glow */}
        <div style={{
          position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300, background: 'radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="doctor-bottom-cta-title">
            আজই আপনার চেম্বারকে করুন <span style={{ color: '#34D399' }}>স্মার্ট ও পেপারলেস</span>
          </h2>
          <p className="doctor-bottom-cta-desc">
            হাজার হাজার বিশেষজ্ঞ চিকিৎসকের সাথে যুক্ত হয়ে আপনার রোগীদের দিন সময়নিষ্ঠ ও ঝামেলাহীন আধুনিক চেম্বার অভিজ্ঞতা।
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register/doctor" className="doctor-bottom-cta-btn">
              <Stethoscope size={18} />
              <span>ডাক্তার হিসেবে অ্যাকাউন্ট খুলুন</span>
              <ArrowRight size={16} />
            </Link>

            <Link to="/contact" className="doctor-bottom-secondary-btn">
              <PhoneCall size={16} />
              <span>হেল্পডেস্কে কথা বলুন</span>
            </Link>
          </div>
        </Container>
      </section>

    </div>
  )
}

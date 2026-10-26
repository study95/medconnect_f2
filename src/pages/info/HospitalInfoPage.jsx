import React, { useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { 
  Building2, Users, Calendar, Clock, Tv, FileText, 
  ShieldCheck, ArrowRight, Sparkles, TrendingUp, CheckCircle2,
  PhoneCall, Laptop, ChevronDown, ChevronUp, Activity, 
  HelpCircle, Award, Database, Bell, Shield, Lock, Check,
  Layers, UserCheck, Stethoscope, Ambulance, HeartPulse, Plus, Minus
} from 'lucide-react'

export default function HospitalInfoPage() {
  const [activeTab, setActiveTab] = useState('roster')
  const [openFaq, setOpenFaq] = useState(0)

  // 6 Core Enterprise Hospital Services
  const hospitalServices = [
    {
      id: 'roster',
      icon: <Users size={26} />,
      badge: 'সেন্ট্রাল ওপিডি রোস্টার',
      title: 'মাল্টি-ডিপার্টমেন্ট ও কনসালট্যান্ট শিডিউলিং',
      desc: 'আপনার হাসপাতালের সকল স্থায়ী ও ভিজিটিং চিকিৎসকদের ওপিডি রোস্টার, শিফট ও দৈনিক রোগী সংখ্যা কেন্দ্রীয় ড্যাশবোর্ড থেকে সহজেই পরিচালনা করুন।',
      highlights: [
        'মেডিসিন, সার্জারি, গাইনি সহ বিভাগভিত্তিক আলাদা স্লট তৈরি',
        'মর্নিং, ইভনিং ও নাইট শিফটের স্বয়ংক্রিয় রোগী লিমিট ও অটো-ক্লোজ',
        'ডাক্তার ছুটিতে থাকলে এক ক্লিকে বুকিং অফ ও রোগীদের বাল্ক এসএমএস',
        'ভিজিটিং কনসালট্যান্টদের অন-কল ও স্পেশাল শিডিউল নিয়ন্ত্রণ'
      ],
      color: '#00B875',
      bg: '#F0FDF4',
      border: '#DCFCE7'
    },
    {
      id: 'display',
      icon: <Tv size={26} />,
      badge: 'স্মার্ট টিভি নেটওয়ার্ক',
      title: 'ওয়েটিং লাউঞ্জ লাইভ টিভি সিরিয়াল ডিসপ্লে',
      desc: 'ওপিডি লাউঞ্জ ও করিডোরে অযথা ভিড় ও শোরগোল বন্ধ করতে সাধারণ স্মার্ট টিভি বা স্ক্রিনে রিয়েল-টাইম মাল্টি-চেম্বার কিউ বোর্ড চালু করুন।',
      highlights: [
        'রিসেপশন বা ডক্টরস রুম থেকে কল করলেই শব্দ সহ পর্দায় অ্যালার্ট',
        'ফ্লোর ও ডিপার্টমেন্ট অনুযায়ী আলাদা ফুল-স্ক্রিন ডিসপ্লে লিংক',
        'কোনো বাড়তি ডিভাইস ছাড়াই যেকোনো স্মার্ট টিভি বা ল্যাপটপে চলে',
        'রোগীর নিজস্ব মোবাইলেও লাইভ সিরিয়াল ও আনুমানিক সময় আপডেট'
      ],
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#DBEAFE'
    },
    {
      id: 'frontdesk',
      icon: <UserCheck size={26} />,
      badge: 'রিসিপশন ও কাউন্টার',
      title: 'মাল্টি-অপারেটর ফ্রন্টডেস্ক ও ক্যাশ কালেকশন',
      desc: 'হাসপাতালের রিসেপশনিস্ট, ক্যাশিয়ার ও হেল্পডেস্ক কর্মীদের জন্য আলাদা সুরক্ষিত অপারেটর অ্যাকাউন্ট দিয়ে দ্রুত রোগী হ্যান্ডেলিং।',
      highlights: [
        'সরাসরি আসা (Walk-in) ও ফোনে বুকিং করা রোগীদের তাৎক্ষণিক সিরিয়াল এন্ট্রি',
        'কাউন্টার ক্যাশ কালেকশন রিকনসিলিয়েশন ও দৈনিক শিফট হিসাব',
        'গোপনীয় মেডিকেল ডেটা সুরক্ষিত রেখে শুধুমাত্র সিরিয়াল এন্ট্রি এক্সেস',
        'রোগীর কাছে স্বয়ংক্রিয় এসএমএস কনফার্মেশন ও ডিজিটাল টোকেন স্লিপ'
      ],
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#EDE9FE'
    },
    {
      id: 'facilities',
      icon: <HeartPulse size={26} />,
      badge: 'সার্ভিস ও ফ্যাসিলিটিজ',
      title: 'জরুরি সেবা, প্যাথলজি ও আইসিইউ প্রোফাইল',
      desc: 'আপনার হাসপাতালের ২৪/৭ জরুরি বিভাগ, আইসিইউ/সিসিইউ, অ্যাম্বুলেন্স, ডায়ালাইসিস এবং ল্যাব টেস্টের প্যাকেজগুলো রোগীদের সামনে তুলে ধরুন।',
      highlights: [
        '২৪/৭ ইমার্জেন্সি ও অ্যাম্বুলেন্স হেল্পলাইনে ওয়ান-ট্যাপ ডায়ালিং',
        'প্যাথলজি ও রেডিওলজি টেস্টের তালিকা এবং সম্ভাব্য চার্জ প্রদর্শন',
        'কেবিন, জেনারেল ওয়ার্ড ও আইসিইউ বেড সুবিধার বিবরণ',
        'স্থানীয় রোগীদের সার্চে হাসপাতালের বিশেষ সেবাগুলো সবার আগে দৃশ্যমান'
      ],
      color: '#0D9488',
      bg: '#F0FDFA',
      border: '#CCFBF1'
    },
    {
      id: 'analytics',
      icon: <TrendingUp size={26} />,
      badge: 'ফাইন্যান্স ও অ্যানালিটিক্স',
      title: 'হসপিটাল ওপিডি রেভিনিউ ও প্রবৃদ্ধি ট্র্যাকার',
      desc: 'প্রতিটি ডিপার্টমেন্ট ও ডাক্তারের রোগী সংখ্যা, দৈনিক ফি কালেকশন এবং হাসপাতালের প্রবৃদ্ধির স্বচ্ছ ও বিস্তারিত গ্রাফিকাল রিপোর্ট।',
      highlights: [
        'ডিপার্টমেন্ট ও ডাক্তারভিত্তিক দৈনিক, সাপ্তাহিক ও মাসিক ওপিডি রিপোর্ট',
        'কাউন্টার কালেকশন ও হাসপাতাল ফি শেয়ারিংয়ের স্বচ্ছ হিসাবরক্ষণ',
        'এক ক্লিকে এক্সেল বা প্রিন্টেবল পিডিএফ স্টেটমেন্ট ডাউনলোড',
        'রোগী ট্রাফিকের পিক আওয়ার বিশ্লেষণ করে স্টাফ ম্যানেজমেন্ট অপ্টিমাইজেশন'
      ],
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FEF3C7'
    },
    {
      id: 'branding',
      icon: <Award size={26} />,
      badge: 'ডিজিটাল ব্র্যান্ডিং',
      title: 'ভেরিফাইড হসপিটাল প্রোফাইল ও রোগী প্রবৃদ্ধি',
      desc: 'প্রতিদিন হাজার হাজার রোগী আপনার হাসপাতালের বিশেষজ্ঞ ডাক্তার, আধুনিক সুযোগ-সুবিধা ও সেবা সম্পর্কে জানতে পারবে বিশ্বস্ত প্ল্যাটফর্মে।',
      highlights: [
        'ভেরিফাইড হেলথকেয়ার সীল সহ প্রিমিয়াম পাবলিক প্রোফাইল পেজ',
        'গুগল ও লোকাল ম্যাপ সার্চে হাসপাতালের সর্বোচ্চ উপস্থিতি (SEO Boosted)',
        'রোগীদের সরাসরি অনলাইন সিরিয়াল নেওয়ার সুবিধা ও ইতিবাচক রিভিউ সংগ্রহ',
        'সোশ্যাল মিডিয়া ও প্রেস রিলিজের জন্য শেয়ারযোগ্য ডিজিটাল পোর্টফোলিও'
      ],
      color: '#E11D48',
      bg: '#FFF1F2',
      border: '#FFE4E6'
    }
  ]

  // Interactive Tab Showcase Data
  const tabShowcases = {
    roster: {
      tag: 'সেন্ট্রাল ওপিডি কন্ট্রোল',
      title: 'সকল ডিপার্টমেন্টের শিডিউল এক নজরে',
      desc: 'মেডিসিন, কার্ডিওলজি, অর্থোপেডিক বা শিশু বিভাগ—প্রতিটি ডিপার্টমেন্টের স্থায়ী ও ভিজিটিং ডাক্তারদের সময়সূচী, ওপিডি রুম নম্বর ও দৈনিক সিরিয়াল কোটা এক ড্যাশবোর্ড থেকেই নির্ধারণ করুন। কোনো ডাক্তার জরুরি ছুটিতে থাকলে এক ক্লিকেই রোগীদের এসএমএস চলে যাবে।',
      points: [
        'ডিপার্টমেন্টভিত্তিক ডাক্তার ও রুম নম্বর অ্যাসাইনমেন্ট',
        'মর্নিং ও ইভনিং শিফটের জন্য অটোমেটেড স্লট ক্লোজিং',
        'ডাক্তারের অন-কল ও ইমার্জেন্সি রোস্টার অ্যালার্ট',
        'রোগীদের স্বয়ংক্রিয় এসএমএস কনফার্মেশন ও আপডেট'
      ],
      badgeColor: '#00B875',
      mockupBg: '#0A2540'
    },
    display: {
      tag: 'টিভি ডিসপ্লে সিস্টেম',
      title: 'ওয়েটিং লাউঞ্জে শব্দ ও ভিজ্যুয়াল শৃঙ্খলা',
      desc: 'ওয়েটিং এরিয়ায় রোগীদের গাদাগাদি আর দরজায় ধাক্কাধাক্কি চিরতরে নির্মূল করুন। সেন্ট্রাল রিসেপশন বা ডাক্তারের সহকারী "Next Patient" চাপলেই টিভি পর্দায় অডিও ঘোষণা সহ সিরিয়াল নম্বর এবং রুম নম্বর ভেসে উঠবে।',
      points: [
        'কোনো অ্যাপ ইনস্টল ছাড়াই যেকোনো স্মার্ট টিভিতে ফুল-স্ক্রিন রান',
        'রোগী ডাকার সময় পরিষ্কার অডিও নোটিফিকেশন বেল',
        'রোগীর মোবাইলেও নিজের সিরিয়ালের লাইভ অগ্রগতি দেখার সুবিধা',
        'একাধিক ফ্লোর বা লাউঞ্জের জন্য পৃথক টিভি ডিসপ্লে লিংক'
      ],
      badgeColor: '#2563EB',
      mockupBg: '#0F2B48'
    },
    frontdesk: {
      tag: 'কাউন্টার অপারেশন',
      title: 'রিসেপশনিস্টদের জন্য দ্রুততম সিরিয়াল এন্ট্রি',
      desc: 'হাসপাতালের ফ্রন্টডেস্ক বা টিকিট কাউন্টারের কর্মীরা সেকেন্ডের মধ্যে সরাসরি আসা (Walk-in) বা ফোনে বুকিং নেওয়া রোগীদের এন্ট্রি করতে পারবেন। দিনশেষে ক্যাশ কালেকশন মেলানো হবে নির্ভুল ও ঝামেলাহীন।',
      points: [
        'মাল্টিপল রিসেপশনিস্ট ও ক্যাশ কাউন্টার সাব-অ্যাকাউন্ট',
        'রোগীর ফোন নম্বর দিলেই তাৎক্ষণিক টোকেন প্রিন্ট ও এসএমএস',
        'কাউন্টার ক্যাশ রিকনসিলিয়েশন ও দৈনিক শিফট ব্যালেন্স রিপোর্ট',
        'ক্লিনিক্যাল গোপনীয়তা অক্ষুণ্ণ রেখে শুধু ফ্রন্টডেস্ক অ্যাক্সেস'
      ],
      badgeColor: '#7C3AED',
      mockupBg: '#2E1065'
    },
    analytics: {
      tag: 'রেভিনিউ ড্যাশবোর্ড',
      title: 'ওপিডি প্রবৃদ্ধি ও স্বচ্ছ হিসাবরক্ষণ',
      desc: 'আপনার হাসপাতালের কোন ডিপার্টমেন্টে রোগী বেশি, কোন ডাক্তারের ওপিডি ফুল এবং দৈনিক মোট কত ফি সংগ্রহ হলো—সবকিছুর লাইভ পাই-চার্ট ও বার-গ্রাফ রিপোর্ট পান। এক ক্লিকে এক্সেল বা অডিট শিট ডাউনলোড করুন।',
      points: [
        'দৈনিক, সাপ্তাহিক ও মাসিক ওপিডি পেশেন্ট ভলিউম গ্রাফ',
        'ডাক্তার ও হাসপাতাল ফি রিকনসিলিয়েশন হিস্ট্রি',
        'পিক-আওয়ার অ্যানালাইসিস করে স্টাফ ডিউটি বণ্টন',
        'এক ক্লিকে এক্সেল ও পিডিএফ স্টেটমেন্ট এক্সপোর্ট'
      ],
      badgeColor: '#D97706',
      mockupBg: '#1C1917'
    }
  }

  // 3 Easy Steps to Join
  const steps = [
    {
      num: '১',
      title: 'ফ্রি প্রাতিষ্ঠানিক রেজিস্ট্রেশন',
      desc: 'আপনার হাসপাতাল/ক্লিনিকের নাম, ঠিকানা, লাইসেন্স বা ডিরেক্টরের তথ্য দিয়ে মাত্র ২ মিনিটে অ্যাকাউন্ট তৈরি করুন।'
    },
    {
      num: '২',
      title: 'ডিপার্টমেন্ট ও ডাক্তার যুক্ত করুন',
      desc: 'হাসপাতালের বিভিন্ন বিভাগ (OPD), কর্মরত বিশেষজ্ঞ চিকিৎসকদের তালিকা ও চেম্বারের সময়সূচী ড্যাশবোর্ডে সেট করুন।'
    },
    {
      num: '৩',
      title: 'দ্রুত ভেরিফিকেশন ও লাইভ ওপিডি',
      desc: 'আমাদের এন্টারপ্রাইজ টিম তথ্য যাচাই করে অ্যাকাউন্ট সক্রিয় করবে এবং রোগীরা সরাসরি সিরিয়াল দেওয়া শুরু করবে।'
    }
  ]

  // FAQs
  const faqs = [
    {
      q: 'Doctor Booklet-এ হাসপাতাল বা ক্লিনিক যুক্ত করতে কি কোনো প্রারম্ভিক ফি লাগে?',
      a: 'না, প্রাতিষ্ঠানিক রেজিস্ট্রেশন ও প্রাথমিক প্রোফাইল তৈরি সম্পূর্ণ বিনামূল্যে। হাসপাতাল কর্তৃপক্ষ কোনো ফি ছাড়াই প্রোফাইল সেটআপ করতে পারেন এবং ওপিডি ফিচারগুলো ট্রায়াল দিয়ে দেখতে পারেন।'
    },
    {
      q: 'আমাদের হাসপাতালে একাধিক ওপিডি রুম ও ফ্লোর রয়েছে, আলাদা টিভি ডিসপ্লে চালানো যাবে কি?',
      a: 'হ্যাঁ, অবশ্যই। Doctor Booklet সেন্ট্রাল মাল্টি-ডিসপ্লে সাপোর্ট করে। প্রতিটি ফ্লোর, ওয়েটিং লাউঞ্জ বা ডিপার্টমেন্টের (যেমন: ওপিডি ব্লক-এ, ওপিডি ব্লক-বি) জন্য আলাদা টিভি ডিসপ্লে লিংক সেট করতে পারবেন।'
    },
    {
      q: 'হাসপাতালের ফ্রন্টডেস্ক বা টিকিট কাউন্টারের স্টাফদের জন্য আলাদা একাউন্ট দেওয়া যাবে?',
      a: 'হ্যাঁ। হাসপাতালের অ্যাডমিন ড্যাশবোর্ড থেকে রিসেপশনিস্ট, ক্যাশিয়ার বা ওপিডি অ্যাসিস্ট্যান্টদের জন্য আলাদা "অপারেটর রোল" তৈরি করা যায়। তারা রোগীদের সিরিয়াল বুক ও ফি কালেকশন করতে পারবে, কিন্তু হাসপাতালের গোপনীয় আর্থিক বা অ্যাডমিন সেটিংসে হাত দিতে পারবে না।'
    },
    {
      q: 'স্মার্ট টিভি ডিসপ্লে বোর্ডের জন্য কি কোনো বিশেষ সফটওয়্যার বা ডিভাইস কিনতে হবে?',
      a: 'একেবারেই না। আপনার ওয়েটিং রুমে থাকা যেকোনো সাধারণ স্মার্ট টিভি, ট্যাবলেট, কিংবা কম্পিউটারের ব্রাউজারে একটি ওয়েব লিংক ওপেন করলেই ফুল-স্ক্রিন আধুনিক ডিসপ্লে বোর্ড চালু হয়ে যাবে। কোনো বাড়তি হার্ডওয়্যার খরচ নেই।'
    },
    {
      q: 'হাসপাতাল ও রোগীদের তথ্যের নিরাপত্তা কীভাবে নিশ্চিত করা হয়?',
      a: 'আমরা আন্তর্জাতিক হেলথকেয়ার সিকিউরিটি স্ট্যান্ডার্ড, ২৫৬-বিট এসএসএল ব্যাংক-গ্রেড এনক্রিপশন এবং অটোমেটেড ক্লাউড ব্যাকআপ ব্যবহার করি। আপনার হাসপাতালের তথ্য সম্পূর্ণ সুরক্ষিত এবং তৃতীয় কোনো পক্ষের সাথে শেয়ার করা হয় না।'
    }
  ]

  return (
    <div className="hospital-info-page" style={{ background: '#F8FAFC', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ── RESPONSIVE COMPACT STYLING ── */}
      <style>{`
        .hospital-hero-section {
          position: relative;
          background: linear-gradient(145deg, #07192F 0%, #0B2545 45%, #082E3B 100%);
          padding: 135px 0 85px;
          color: white;
          overflow: hidden;
        }
        .hospital-hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(56, 189, 248, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.07) 1px, transparent 1px);
          background-size: 38px 38px;
          pointer-events: none;
        }
        .hospital-hero-glow-1 {
          position: absolute;
          top: -120px;
          right: -80px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 184, 117, 0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .hospital-hero-glow-2 {
          position: absolute;
          bottom: -150px;
          left: -100px;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .hospital-hero-badge {
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
          color: #E0F2FE;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .hospital-hero-title {
          font-size: clamp(30px, 4.5vw, 54px);
          font-weight: 950;
          line-height: 1.25;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
          color: #FFFFFF !important;
        }
        .hospital-hero-title-accent {
          background: linear-gradient(90deg, #38BDF8 0%, #34D399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        .hospital-hero-desc {
          font-size: clamp(14.5px, 1.8vw, 17.5px);
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.9);
          max-width: 800px;
          margin: 0 auto 36px;
          font-weight: 450;
        }
        .hospital-hero-cta-btn {
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
        .hospital-hero-cta-btn:hover {
          background: #059669;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(0, 184, 117, 0.5);
        }
        .hospital-hero-secondary-btn {
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
        .hospital-hero-secondary-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-color: rgba(255, 255, 255, 0.45);
        }
        .hospital-hero-trust-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          font-size: 13px;
          color: #BAE6FD;
          font-weight: 600;
          flex-wrap: wrap;
        }
        .hospital-hero-trust-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* Trust bar */
        .hospital-trust-bar {
          margin-top: -36px;
          position: relative;
          z-index: 10;
        }
        .hospital-trust-card {
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
        .hospital-stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hospital-stat-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hospital-stat-val {
          font-size: 22px;
          font-weight: 950;
          color: #0F172A;
          line-height: 1;
        }
        .hospital-stat-lbl {
          font-size: 12px;
          color: #64748B;
          font-weight: 700;
          margin-top: 3px;
        }

        /* Service Cards */
        .hospital-services-section {
          padding: 75px 0 60px;
        }
        .hospital-service-card {
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
        .hospital-service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px rgba(37, 99, 235, 0.09);
          border-color: #93C5FD;
        }
        .hospital-service-icon-box {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hospital-service-title {
          font-size: 17.5px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 10px;
          line-height: 1.35;
        }
        .hospital-service-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.6;
          margin-bottom: 18px;
        }
        .hospital-service-points {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .hospital-service-point-text {
          font-size: 12.5px;
          color: #334155;
          font-weight: 600;
          line-height: 1.45;
        }

        /* Tabs Showcase */
        .hospital-tab-section {
          padding: 65px 0;
          background: white;
          border-top: 1px solid #E2E8F0;
          border-bottom: 1px solid #E2E8F0;
        }
        .hospital-tab-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          background: #F1F5F9;
          padding: 6px;
          border-radius: 18px;
          max-width: 720px;
          margin: 0 auto 32px;
        }
        .hospital-tab-btn {
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
        .hospital-tab-btn.active {
          background: #00B875;
          color: white;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.3);
        }
        .hospital-tab-box {
          background: #F8FAFC;
          border-radius: 28px;
          border: 1px solid #E2E8F0;
          padding: clamp(24px, 4vw, 42px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
        }
        .hospital-tab-content-title {
          font-size: clamp(20px, 2.5vw, 28px);
          font-weight: 950;
          color: #0F172A;
          margin-bottom: 14px;
        }
        .hospital-tab-content-desc {
          color: #475569;
          font-size: 14.5px;
          line-height: 1.7;
          margin-bottom: 22px;
        }
        .hospital-tab-points {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 26px;
        }
        .hospital-tab-point-text {
          font-size: 13.5px;
          color: #1E293B;
          font-weight: 700;
        }
        .hospital-mockup-card {
          border-radius: 22px;
          padding: 26px 22px;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.15);
        }

        /* Steps Section */
        .hospital-steps-section {
          padding: 70px 0 60px;
        }
        .hospital-step-card {
          background: white;
          border-radius: 20px;
          padding: 26px 22px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.03);
          height: 100%;
          position: relative;
        }
        .hospital-step-num {
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
        .hospital-step-title {
          font-size: 17px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 10px;
        }
        .hospital-step-desc {
          font-size: 13.5px;
          color: #64748B;
          line-height: 1.6;
          margin: 0;
        }

        /* Security Section */
        .hospital-security-section {
          padding: 50px 0;
          background: #F1F5F9;
          border-top: 1px solid #E2E8F0;
          border-bottom: 1px solid #E2E8F0;
        }
        .hospital-security-card {
          background: linear-gradient(135deg, #0B2545 0%, #0F172A 100%);
          border-radius: 24px;
          padding: clamp(24px, 4vw, 40px);
          color: white;
          box-shadow: 0 16px 40px rgba(11, 37, 69, 0.2);
        }
        .hospital-security-title {
          font-size: clamp(20px, 2.5vw, 26px);
          font-weight: 900;
          margin-bottom: 10px;
          color: #FFFFFF;
        }
        .hospital-security-desc {
          color: rgba(255,255,255,0.85);
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }
        .hospital-lock-icon-box {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          background: rgba(56, 189, 248, 0.15);
          color: #38BDF8;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid rgba(56, 189, 248, 0.35);
        }

        /* FAQ Section */
        @keyframes hospitalFaqFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hospital-faq-section {
          padding: 70px 0 60px;
        }
        .hospital-faq-btn {
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
        .hospital-faq-q-badge {
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
        .hospital-faq-question {
          font-weight: 600;
          font-size: 15.5px;
          line-height: 1.4;
          font-family: 'Hind Siliguri', sans-serif;
          flex: 1;
          transition: color 0.2s ease;
        }
        .hospital-faq-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .hospital-faq-answer {
          padding: 0 24px 20px;
          animation: hospitalFaqFadeIn 0.3s ease;
        }
        .hospital-faq-answer p {
          margin: 0;
          color: #475569;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.6;
          font-family: 'Hind Siliguri', sans-serif;
        }

        /* Bottom CTA */
        .hospital-bottom-cta {
          padding: 80px 0;
          background: linear-gradient(145deg, #07192F 0%, #0B2545 100%);
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hospital-bottom-cta h2,
        .hospital-bottom-cta-title {
          color: #FFFFFF !important;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          font-weight: 950 !important;
          font-size: clamp(24px, 3.8vw, 38px);
          margin-bottom: 14px;
        }
        .hospital-bottom-cta-desc {
          color: rgba(255, 255, 255, 0.85);
          font-size: 15.5px;
          max-width: 680px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }
        .hospital-bottom-cta-btn {
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
        .hospital-bottom-secondary-btn {
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
          .hospital-hero-section {
            padding: 95px 0 40px !important;
          }
          .hospital-hero-badge {
            font-size: 11px !important;
            padding: 5px 12px !important;
            gap: 6px !important;
            margin-bottom: 14px !important;
            white-space: nowrap !important;
            max-width: 100% !important;
          }
          .hospital-hero-title {
            font-size: 23px !important;
            line-height: 1.3 !important;
            margin-bottom: 12px !important;
          }
          .hospital-hero-desc {
            font-size: 13px !important;
            line-height: 1.55 !important;
            margin-bottom: 22px !important;
            padding: 0 2px !important;
          }
          .hospital-hero-cta-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 12px 18px !important;
            font-size: 14.5px !important;
            border-radius: 12px !important;
          }
          .hospital-hero-secondary-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 11px 18px !important;
            font-size: 14px !important;
            border-radius: 12px !important;
          }
          .hospital-hero-trust-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 7px !important;
            font-size: 11.5px !important;
            margin-top: 14px !important;
          }
          .hospital-hero-trust-item {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
          }

          /* Trust Bar (2x2 Grid) */
          .hospital-trust-bar {
            margin-top: -20px !important;
            padding: 0 10px !important;
          }
          .hospital-trust-card {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            padding: 10px !important;
            border-radius: 16px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05) !important;
          }
          .hospital-stat-item {
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
          .hospital-stat-icon-wrap {
            width: 32px !important;
            height: 32px !important;
            border-radius: 9px !important;
          }
          .hospital-stat-icon-wrap svg {
            width: 16px !important;
            height: 16px !important;
          }
          .hospital-stat-val {
            font-size: 16px !important;
            line-height: 1 !important;
          }
          .hospital-stat-lbl {
            font-size: 10.5px !important;
            line-height: 1.25 !important;
            margin-top: 2px !important;
          }

          /* Services Section */
          .hospital-services-section {
            padding: 36px 0 24px !important;
          }
          .hospital-section-header {
            margin-bottom: 22px !important;
          }
          .hospital-section-header h2 {
            font-size: 21px !important;
            margin-bottom: 8px !important;
          }
          .hospital-section-header p {
            font-size: 12.5px !important;
            line-height: 1.5 !important;
          }
          .hospital-service-card {
            padding: 18px 15px !important;
            border-radius: 16px !important;
          }
          .hospital-service-icon-box {
            width: 42px !important;
            height: 42px !important;
            border-radius: 12px !important;
          }
          .hospital-service-icon-box svg {
            width: 20px !important;
            height: 20px !important;
          }
          .hospital-service-title {
            font-size: 16px !important;
            margin-bottom: 6px !important;
          }
          .hospital-service-desc {
            font-size: 12px !important;
            line-height: 1.5 !important;
            margin-bottom: 14px !important;
          }
          .hospital-service-points {
            gap: 7px !important;
          }
          .hospital-service-point-text {
            font-size: 11.5px !important;
            line-height: 1.4 !important;
          }

          /* Tab Section */
          .hospital-tab-section {
            padding: 34px 0 !important;
          }
          .hospital-tab-nav {
            overflow-x: auto !important;
            justify-content: flex-start !important;
            padding: 4px !important;
            gap: 5px !important;
            scrollbar-width: none !important;
            border-radius: 12px !important;
            margin-bottom: 18px !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .hospital-tab-btn {
            padding: 7px 12px !important;
            font-size: 12px !important;
            border-radius: 9px !important;
            flex-shrink: 0 !important;
            gap: 6px !important;
          }
          .hospital-tab-btn svg {
            width: 14px !important;
            height: 14px !important;
          }
          .hospital-tab-box {
            padding: 16px 13px !important;
            border-radius: 18px !important;
          }
          .hospital-tab-content-title {
            font-size: 18px !important;
            margin-bottom: 8px !important;
          }
          .hospital-tab-content-desc {
            font-size: 12.5px !important;
            line-height: 1.55 !important;
            margin-bottom: 14px !important;
          }
          .hospital-tab-points {
            gap: 8px !important;
            margin-bottom: 16px !important;
          }
          .hospital-tab-point-text {
            font-size: 12px !important;
          }
          .hospital-mockup-card {
            padding: 14px 12px !important;
            border-radius: 16px !important;
            margin-top: 16px !important;
          }

          /* Steps Section */
          .hospital-steps-section {
            padding: 34px 0 26px !important;
          }
          .hospital-step-card {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 14px 12px !important;
            border-radius: 14px !important;
          }
          .hospital-step-num {
            width: 34px !important;
            height: 34px !important;
            border-radius: 10px !important;
            font-size: 16px !important;
            margin-bottom: 0 !important;
            flex-shrink: 0 !important;
          }
          .hospital-step-title {
            font-size: 15px !important;
            margin-bottom: 4px !important;
          }
          .hospital-step-desc {
            font-size: 12px !important;
            line-height: 1.5 !important;
          }

          /* Security Section */
          .hospital-security-section {
            padding: 24px 0 !important;
          }
          .hospital-security-card {
            padding: 18px 14px !important;
            border-radius: 18px !important;
          }
          .hospital-security-title {
            font-size: 17px !important;
            margin-bottom: 8px !important;
          }
          .hospital-security-desc {
            font-size: 12px !important;
            line-height: 1.5 !important;
          }
          .hospital-lock-icon-box {
            width: 48px !important;
            height: 48px !important;
            border-radius: 14px !important;
          }
          .hospital-lock-icon-box svg {
            width: 22px !important;
            height: 22px !important;
          }

          /* FAQ Section */
          .hospital-faq-section {
            padding: 34px 0 !important;
          }
          .hospital-faq-btn {
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          .hospital-faq-q-badge {
            width: 25px !important;
            height: 25px !important;
            font-size: 12.5px !important;
          }
          .hospital-faq-question {
            font-size: 14.2px !important;
            line-height: 1.38 !important;
            font-weight: 600 !important;
          }
          .hospital-faq-icon {
            width: 26px !important;
            height: 26px !important;
          }
          .hospital-faq-icon svg {
            width: 15px !important;
            height: 15px !important;
          }
          .hospital-faq-answer {
            padding: 0 14px 14px !important;
          }
          .hospital-faq-answer p {
            font-size: 13.5px !important;
            line-height: 1.55 !important;
          }

          /* Bottom CTA */
          .hospital-bottom-cta {
            padding: 44px 0 110px !important;
          }
          .hospital-bottom-cta-title {
            font-size: 20px !important;
            line-height: 1.35 !important;
            margin-bottom: 10px !important;
          }
          .hospital-bottom-cta-desc {
            font-size: 12.5px !important;
            line-height: 1.55 !important;
            margin-bottom: 20px !important;
          }
          .hospital-bottom-cta-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 12px 18px !important;
            font-size: 14.5px !important;
          }
          .hospital-bottom-secondary-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 11px 18px !important;
            font-size: 14px !important;
          }
        }
      `}</style>

      {/* ── 1. HERO SECTION ── */}
      <section className="hospital-hero-section">
        <div className="hospital-hero-grid" />
        <div className="hospital-hero-glow-1" />
        <div className="hospital-hero-glow-2" />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="justify-content-center text-center">
            <Col lg={10} md={12}>
              <div className="hospital-hero-badge">
                <Sparkles size={15} color="#38BDF8" />
                <span className="d-none d-sm-inline">হাসপাতাল ও ক্লিনিক ডিজিটাল রূপান্তর | Hospital Enterprise Suite</span>
                <span className="d-sm-none">🏥 হাসপাতাল ডিজিটাল ম্যানেজমেন্ট প্ল্যাটফর্ম</span>
              </div>

              <h1 className="hospital-hero-title">
                আপনার হাসপাতাল ও ক্লিনিককে রূপান্তর করুন <br />
                <span className="hospital-hero-title-accent">একটি পূর্ণাঙ্গ স্মার্ট হেলথকেয়ার হাবে</span>
              </h1>

              <p className="hospital-hero-desc">
                ওপিডি সিরিয়াল জট নিরসন, সেন্ট্রাল মাল্টি-চেম্বার স্মার্ট টিভি ডিসপ্লে বোর্ড, বিশেষজ্ঞ ডাক্তার রোস্টার শিডিউলিং, রিসেপশন কাউন্টার ও সমন্বিত রোগী ব্যবস্থাপনা—সবকিছু একই সেন্ট্রাল এন্টারপ্রাইজ প্যানেলে।
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                <Link to="/register/hospital" className="hospital-hero-cta-btn">
                  <Building2 size={18} />
                  <span>হাসপাতাল হিসেবে যুক্ত হোন (ফ্রি)</span>
                  <ArrowRight size={17} />
                </Link>

                <Link to="/login/hospital" className="hospital-hero-secondary-btn">
                  <Laptop size={17} />
                  <span>হাসপাতাল পোর্টাল লগইন</span>
                </Link>
              </div>

              <div className="hospital-hero-trust-row">
                <span className="hospital-hero-trust-item">
                  <CheckCircle2 size={15} color="#34D399" /> কোনো সেটআপ ফি নেই
                </span>
                <span className="hospital-hero-trust-item">
                  <CheckCircle2 size={15} color="#38BDF8" /> ভেরিফাইড হাসপাতাল ও ক্লিনিক অগ্রাধিকার
                </span>
                <span className="hospital-hero-trust-item">
                  <CheckCircle2 size={15} color="#34D399" /> ২৪/৭ ডেডিকেটেড এন্টারপ্রাইজ সাপোর্ট
                </span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── 2. TRUST METRICS STRIP ── */}
      <Container className="hospital-trust-bar">
        <div className="hospital-trust-card">
          <div className="hospital-stat-item">
            <div className="hospital-stat-icon-wrap" style={{ background: '#F0FDF4', color: '#00B875' }}>
              <Building2 size={20} />
            </div>
            <div>
              <div className="hospital-stat-val">৫০০+</div>
              <div className="hospital-stat-lbl">রেজিস্টার্ড হাসপাতাল ও ক্লিনিক</div>
            </div>
          </div>

          <div className="hospital-stat-item">
            <div className="hospital-stat-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Users size={20} />
            </div>
            <div>
              <div className="hospital-stat-val">২০০,০০০+</div>
              <div className="hospital-stat-lbl">সফল ওপিডি রোগী ব্যবস্থাপনা</div>
            </div>
          </div>

          <div className="hospital-stat-item">
            <div className="hospital-stat-icon-wrap" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <Tv size={20} />
            </div>
            <div>
              <div className="hospital-stat-val">১০০%</div>
              <div className="hospital-stat-lbl">স্মার্ট টিভি কিউ অটোমেশন</div>
            </div>
          </div>

          <div className="hospital-stat-item">
            <div className="hospital-stat-icon-wrap" style={{ background: '#FFFBEB', color: '#D97706' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="hospital-stat-val">২৪/৭</div>
              <div className="hospital-stat-lbl">এন্টারপ্রাইজ ক্লাউড ব্যাকআপ</div>
            </div>
          </div>
        </div>
      </Container>

      {/* ── 3. CORE SERVICES SUITE (কী কী সুবিধা পাচ্ছে হাসপাতাল) ── */}
      <section className="hospital-services-section">
        <Container>
          <div className="text-center hospital-section-header" style={{ maxWidth: 740, margin: '0 auto 40px' }}>
            <span style={{ 
              background: '#E0F2FE', color: '#0369A1', 
              fontSize: 12, fontWeight: 800, padding: '4px 14px', 
              borderRadius: 99, display: 'inline-block', marginBottom: 10,
              border: '1px solid #BAE6FD'
            }}>
              হাসপাতাল ও ক্লিনিকের ডিজিটাল সুবিধা
            </span>
            <h2 style={{ fontWeight: 900, color: '#0F172A', marginBottom: 12 }}>
              হাসপাতাল ব্যবস্থাপনায় যা যা পাচ্ছেন
            </h2>
            <p style={{ color: '#64748B', margin: 0 }}>
              ওপিডি সিরিয়াল নিয়ন্ত্রণ, মাল্টি-রিসিপশন ডেস্ক, সেন্ট্রাল টিভি ডিসপ্লে এবং ডাক্তারদের রোস্টার ম্যানেজমেন্টের পূর্ণাঙ্গ প্রাতিষ্ঠানিক সমাধান।
            </p>
          </div>

          <Row className="g-3 g-md-4">
            {hospitalServices.map((service) => (
              <Col lg={4} md={6} key={service.id}>
                <div className="hospital-service-card">
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div className="hospital-service-icon-box" style={{ 
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

                    <h4 className="hospital-service-title">
                      {service.title}
                    </h4>

                    <p className="hospital-service-desc">
                      {service.desc}
                    </p>

                    {/* Bullet Points */}
                    <div className="hospital-service-points">
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
                          <span className="hospital-service-point-text">
                            {point}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                    <Link to="/register/hospital" style={{ 
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
      <section className="hospital-tab-section">
        <Container>
          <div className="text-center hospital-section-header" style={{ maxWidth: 700, margin: '0 auto 30px' }}>
            <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 8 }}>
              লাইভ মডিউল এক্সপ্লোরার
            </span>
            <h2 style={{ fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>
              হাসপাতালের প্রতিটি ফ্রন্টের জন্য ডেডিকেটেড মডিউল
            </h2>
            <p style={{ color: '#64748B', margin: 0 }}>
              নিচের অপশনগুলোতে ক্লিক করে দেখুন Doctor Booklet কীভাবে হাসপাতালের প্রতিদিনের ব্যবস্থাপনা সহজ করে।
            </p>
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="hospital-tab-nav">
            <button 
              onClick={() => setActiveTab('roster')}
              className={`hospital-tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
            >
              <Users size={16} />
              <span>ওপিডি রোস্টার</span>
            </button>
            <button 
              onClick={() => setActiveTab('display')}
              className={`hospital-tab-btn ${activeTab === 'display' ? 'active' : ''}`}
            >
              <Tv size={16} />
              <span>টিভি ডিসপ্লে সিস্টেম</span>
            </button>
            <button 
              onClick={() => setActiveTab('frontdesk')}
              className={`hospital-tab-btn ${activeTab === 'frontdesk' ? 'active' : ''}`}
            >
              <UserCheck size={16} />
              <span>রিসিপশন কাউন্টার</span>
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`hospital-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            >
              <TrendingUp size={16} />
              <span>রেভিনিউ ড্যাশবোর্ড</span>
            </button>
          </div>

          {/* Active Tab Showcase Box */}
          {tabShowcases[activeTab] && (
            <div className="hospital-tab-box">
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
                  <h3 className="hospital-tab-content-title">
                    {tabShowcases[activeTab].title}
                  </h3>
                  <p className="hospital-tab-content-desc">
                    {tabShowcases[activeTab].desc}
                  </p>

                  <div className="hospital-tab-points">
                    {tabShowcases[activeTab].points.map((pt, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span className="hospital-tab-point-text">{pt}</span>
                      </div>
                    ))}
                  </div>

                  <Link to="/register/hospital" style={{
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
                  <div className="hospital-mockup-card" style={{ background: tabShowcases[activeTab].mockupBg }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                        Hospital Enterprise OPD Live
                      </span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px', marginBottom: 10 }}>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.65)', marginBottom: 2 }}>রুম নং ১০২ • কার্ডিওলজি বিভাগ</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#38BDF8' }}>সিরিয়াল নং: #১৮ (চলমান)</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>কনসালট্যান্ট: ডা. রফিকুল ইসলাম • রোগী: মো. করিম</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>মোট অপেক্ষমাণ রোগী</div>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>২২ জন রোগী</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>গড় কনসালটেশন সময়</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#34D399' }}>৮.৫ মিনিট</div>
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
      <section className="hospital-steps-section">
        <Container>
          <div className="text-center hospital-section-header" style={{ maxWidth: 680, margin: '0 auto 32px' }}>
            <span style={{ background: '#DCFCE7', color: '#166534', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 8 }}>
              সহজ প্রাতিষ্ঠানিক অনবোর্ডিং
            </span>
            <h2 style={{ fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>
              কীভাবে হাসপাতাল হিসেবে যুক্ত হবেন?
            </h2>
            <p style={{ color: '#64748B', margin: 0 }}>
              মাত্র ৩টি সহজ ধাপে সম্পন্ন করুন আপনার হাসপাতালের রেজিস্ট্রেশন এবং শুরু করুন আধুনিক ডিজিটাল ওপিডি।
            </p>
          </div>

          <Row className="g-3 g-md-4">
            {steps.map((st, idx) => (
              <Col lg={4} md={4} key={idx}>
                <div className="hospital-step-card">
                  <div className="hospital-step-num">{st.num}</div>
                  <div>
                    <h4 className="hospital-step-title">{st.title}</h4>
                    <p className="hospital-step-desc">{st.desc}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <div className="text-center" style={{ marginTop: 30 }}>
            <Link to="/register/hospital" style={{
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
      <section className="hospital-security-section">
        <Container>
          <div className="hospital-security-card">
            <Row className="align-items-center g-3 g-md-4">
              <Col lg={8}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '4px 12px', borderRadius: 99, fontSize: 11.5, fontWeight: 800, marginBottom: 10 }}>
                  <ShieldCheck size={15} />
                  <span>প্রাতিষ্ঠানিক ডেটা নিরাপত্তা ও স্বাধিকার</span>
                </div>
                <h3 className="hospital-security-title">
                  হাসপাতাল ও রোগীর তথ্যের শতভাগ গোপনীয়তা ও ব্যাংক-গ্রেড সুরক্ষা
                </h3>
                <p className="hospital-security-desc">
                  আপনার হাসপাতালের রোগী, ডাক্তার ও আর্থিক লেনদেনের সম্পূর্ণ মালিকানা শুধুই আপনার প্রতিষ্ঠানের। সকল ডেটা আন্তর্জাতিক HIPAA ও ২৫৬-বিট এসএসএল (SSL) এনক্রিপশনে সুরক্ষিত এবং নিরবচ্ছিন্ন ক্লাউড ব্যাকআপ সম্বলিত।
                </p>
              </Col>
              <Col lg={4} className="text-lg-end text-center mt-3 mt-lg-0">
                <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <div className="hospital-lock-icon-box">
                    <Lock size={26} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#BAE6FD' }}>
                    100% HIPAA ও DGHS রেগুলেশন ফ্রেন্ডলি
                  </span>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* ── 7. FREQUENTLY ASKED QUESTIONS (FAQ) ── */}
      <section className="hospital-faq-section">
        <Container style={{ maxWidth: 840 }}>
          <div className="text-center hospital-section-header" style={{ marginBottom: 28 }}>
            <span style={{ background: '#DCFCE7', color: '#166534', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 8 }}>
              সচরাচর জিজ্ঞাসা
            </span>
            <h2 style={{ fontWeight: 900, color: '#0F172A', margin: 0 }}>
              হাসপাতাল কর্তৃপক্ষের সাধারণ প্রশ্ন ও সমাধান
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
                    className="hospital-faq-btn"
                    aria-expanded={isOpen}
                  >
                    <span
                      className="hospital-faq-q-badge"
                      style={{
                        background: isOpen ? '#00B875' : '#F1F5F9',
                        color: isOpen ? '#FFFFFF' : '#64748B',
                        border: isOpen ? '1px solid #00B875' : '1px solid #E2E8F0'
                      }}
                    >
                      ?
                    </span>
                    <span className="hospital-faq-question" style={{ color: isOpen ? '#15803D' : '#1E293B' }}>
                      {faq.q}
                    </span>
                    <span
                      className="hospital-faq-icon"
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
                    <div className="hospital-faq-answer">
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
      <section className="hospital-bottom-cta">
        {/* Glow */}
        <div style={{
          position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300, background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="hospital-bottom-cta-title">
            আজই আপনার হাসপাতাল ও ক্লিনিককে করুন <span style={{ color: '#38BDF8' }}>স্মার্ট ও সুশৃঙ্খল</span>
          </h2>
          <p className="hospital-bottom-cta-desc">
            দেশের শীর্ষস্থানীয় স্বাস্থ্যসেবা প্রতিষ্ঠানের সাথে যুক্ত হয়ে আপনার ওপিডি রোগীদের দিন ঝামেলাহীন, সময়নিষ্ঠ ও আধুনিক অভিজ্ঞতা।
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register/hospital" className="hospital-bottom-cta-btn">
              <Building2 size={18} />
              <span>হাসপাতাল হিসেবে একাউন্ট খুলুন</span>
              <ArrowRight size={16} />
            </Link>

            <Link to="/contact" className="hospital-bottom-secondary-btn">
              <PhoneCall size={16} />
              <span>এন্টারপ্রাইজ হেল্পডেস্কে কথা বলুন</span>
            </Link>
          </div>
        </Container>
      </section>

    </div>
  )
}

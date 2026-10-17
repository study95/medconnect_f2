import React, { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Modal, Button } from 'react-bootstrap'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import {
  IconSearch, IconArrowRight, IconCheck, IconClock, IconShieldCheck,
  IconBuildingHospital, IconStethoscope, IconHeart, IconFileText,
  IconUsers, IconActivity, IconHeadset, IconPhoneCall, IconExternalLink,
  IconAlertCircle, IconSparkles, IconDeviceMobile, IconDeviceDesktop,
  IconLock, IconBell, IconQrcode, IconCalendar, IconChevronRight,
  IconCircleCheck, IconPrinter, IconChecklist
} from '@tabler/icons-react'

export default function ServicesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const validRoles = ['patient', 'doctor', 'hospital', 'legal']
  const initialRole = searchParams.get('tab') || searchParams.get('role')
  const [activeRole, setActiveRole] = useState(validRoles.includes(initialRole) ? initialRole : 'patient')
  const [showLegalDocModal, setShowLegalDocModal] = useState(false)
  const [selectedLegalDoc, setSelectedLegalDoc] = useState(null)

  const tabsContainerRef = useRef(null)
  const tabRefs = useRef({})

  const scrollToActiveTab = (behavior = 'smooth') => {
    const container = tabsContainerRef.current
    const activeBtn = tabRefs.current[activeRole]
    if (container && activeBtn) {
      const scrollTarget = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2)
      container.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior
      })
    }
  }

  // Smoothly center the active tab in mobile view whenever activeRole changes
  useEffect(() => {
    scrollToActiveTab('smooth')
    const timer = setTimeout(() => scrollToActiveTab('smooth'), 120)
    return () => clearTimeout(timer)
  }, [activeRole])

  // Sync if URL query param changes
  useEffect(() => {
    const tab = searchParams.get('tab') || searchParams.get('role')
    if (tab && validRoles.includes(tab) && tab !== activeRole) {
      setActiveRole(tab)
    }
  }, [searchParams])

  const handleRoleChange = (role, scrollSection = false) => {
    setActiveRole(role)
    setSearchParams({ tab: role }, { replace: true })
    if (scrollSection) {
      const tabsSection = document.getElementById('services-role-tabs')
      if (tabsSection) {
        const yOffset = -80 // account for fixed navbar height
        const y = tabsSection.getBoundingClientRect().top + window.pageYOffset + yOffset
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    }
  }

  // ─── 1. SERVICES FOR PATIENTS ──────────────────────────────────────────────
  const patientServices = [
    {
      id: 'patient-serial',
      icon: <IconCalendar size={28} color="#00B875" />,
      tag: 'সহজ বুকিং',
      title: 'ঘরে বসেই বিশেষজ্ঞ ডাক্তারের সিরিয়াল বুকিং',
      desc: 'হাসপাতালে গিয়ে লাইনে দাঁড়িয়ে সিরিয়াল নেওয়ার ঝামেলা শেষ। ঘরে বসেই যেকোনো বিশেষজ্ঞ ডাক্তার ও হাসপাতালের সময়সূচি দেখে তাৎক্ষণিক বুকিং নিশ্চিত করুন।',
      benefits: [
        'পছন্দমতো তারিখ ও সুবিধাজনক স্লট নির্বাচন',
        'নিশ্চিত সিরিয়াল নম্বরসহ ডিজিটাল এসএমএস কনফার্মেশন',
        'বুকিং বাতিল বা পরিবর্তন করার সহজ ব্যবস্থা'
      ],
      actionText: 'ডাক্তার খুঁজুন ও বুকিং দিন',
      actionLink: '/doctors'
    },
    {
      id: 'patient-live-queue',
      icon: <IconClock size={28} color="#0EA5E9" />,
      tag: 'সময় সাশ্রয়',
      title: 'রিয়েল-টাইম লাইভ সিরিয়াল ও ওয়েটিং ট্র্যাকিং',
      desc: 'ডাক্তারের চেম্বারে ঘণ্টার পর ঘণ্টা বসে থাকার দিন শেষ। আপনার মোবাইলেই দেখতে পাবেন এখন ডাক্তারের চেম্বারে কত নম্বর সিরিয়াল চলছে এবং আপনার সিরিয়াল আসতে কতক্ষণ লাগতে পারে।',
      benefits: [
        'মোবাইলেই লাইভ সিরিয়াল কাউন্টার আপডেট',
        'নিজের সিরিয়ালের কাছাকাছি সময়ে চেম্বারে পৌঁছানোর সুবিধা',
        'জরুরি কোনো বিলম্ব ঘটলে মোবাইলে তাৎক্ষণিক মেসেজ'
      ],
      actionText: 'লাইভ সিরিয়াল স্ট্যাটাস দেখুন',
      actionLink: '/quick-appointment'
    },
    {
      id: 'patient-health-vault',
      icon: <IconLock size={28} color="#6366F1" />,
      tag: 'আজীবন সংরক্ষণ',
      title: 'ডিজিটাল প্রেসক্রিপশন ও হেলথ রেকর্ড ভল্ট',
      desc: 'কাগজের প্রেসক্রিপশন বা পুরনো টেস্ট রিপোর্ট হারিয়ে যাওয়ার ভয় নেই। আপনার সকল প্রেসক্রিপশন ও মেডিকেল হিস্ট্রি প্রোফাইলে ক্লাউড এনক্রিপশনে আজীবন সুরক্ষিত থাকবে।',
      benefits: [
        'যেকোনো সময় যেকোনো ডিভাইস থেকে প্রেসক্রিপশন ডাউনলোড',
        'পরবর্তী ডাক্তার দেখানোর সময় এক ক্লিকে পূর্বের হিস্ট্রি প্রদর্শন',
        '১০০% নিরাপদ ও এনক্রিপ্টেড ব্যক্তিগত তথ্য'
      ],
      actionText: 'আমার হেলথ প্রোফাইল',
      actionLink: '/profile'
    },
    {
      id: 'patient-directory',
      icon: <IconBuildingHospital size={28} color="#D97706" />,
      tag: 'নিরপেক্ষ তথ্য',
      title: 'যাচাইকৃত হাসপাতাল ও বিশেষজ্ঞ ডিরেক্টরি',
      desc: 'বাংলাদেশের অনুমোদিত হাসপাতাল, ক্লিনিক এবং বিএমডিসি সনদপ্রাপ্ত অভিজ্ঞ চিকিৎসকদের ভিজিট ফি, চেম্বার লোকেশন এবং সুযোগ-সুবিধার সঠিক তথ্য জেনে নিন।',
      benefits: [
        'বিএমডিসি (BMDC) রেজিস্ট্রেশন যাচাইকৃত ডাক্তারদের তালিকা',
        'বিভাগ ও জেলা অনুযায়ী হাসপাতাল ও ডায়াগনস্টিক তথ্য',
        'সরাসরি যোগাযোগের ঠিকানা ও গুগল ম্যাপ লোকেশন'
      ],
      actionText: 'হাসপাতাল তালিকা দেখুন',
      actionLink: '/hospitals'
    }
  ]

  // ─── 2. SERVICES FOR DOCTORS ───────────────────────────────────────────────
  const doctorServices = [
    {
      id: 'doc-rx',
      icon: <IconFileText size={28} color="#00B875" />,
      tag: '১-মিনিটে প্রেসক্রিপশন',
      title: 'স্মার্ট ডিজিটাল ই-প্রেসক্রিপশন সফটওয়্যার (Rx Pad)',
      desc: 'চিকিৎসকদের সুবিধার্থে তৈরি দ্রুততম প্রেসক্রিপশন রাইটিং প্ল্যাটফর্ম। বাংলাদেশের হাজার হাজার ওষুধের ব্র্যান্ড ও জেনেরিক নাম এক ক্লিকে যুক্ত করুন এবং ড্রাগ অ্যালার্জি সেফটি নিশ্চিত করুন।',
      benefits: [
        'ব্র্যান্ড বা জেনেরিক নেম দিয়ে দ্রুত ড্রাগ সিলেক্ট ও ডোজ সেট',
        'বিএমডিসি নম্বর ও প্যাড হেডার সহ তাৎক্ষণিক স্পষ্ট প্রিন্ট',
        'রোগীর পূর্ববর্তী ভিজিট ও ক্রনিক রোগের ইতিহাস এক নজরে'
      ],
      actionText: 'ডাক্তার হিসেবে যুক্ত হোন',
      actionLink: '/register/doctor'
    },
    {
      id: 'doc-queue-caller',
      icon: <IconBell size={28} color="#0EA5E9" />,
      tag: 'চেম্বার অটোমেশন',
      title: 'লাইভ পেশেন্ট কলিং ও কিউ কন্ট্রোল সিস্টেম',
      desc: 'সহকারীকে বারবার বাইরে গিয়ে ডাকতে হবে না। চেম্বার রুমের পিসি বা মোবাইল থেকে এক ক্লিকে পরবর্তী রোগীকে কল করুন, যা স্বয়ংক্রিয়ভাবে ওয়েটিং রুমের ডিসপ্লেতে ভেসে উঠবে।',
      benefits: [
        'এক ক্লিকে "Next Patient" কলিং ও ডিসপ্লে বোর্ড সিঙ্ক',
        'অনুপস্থিত রোগীকে সাময়িক স্কিপ ও পরে দেখার সুবিধা',
        'প্রতিদিনের চেম্বার ট্রাফিকের স্বচ্ছ হিসাব ও লগ'
      ],
      actionText: 'চেম্বার ব্যবস্থাপনা জানুন',
      actionLink: '/register-doctor'
    },
    {
      id: 'doc-slots',
      icon: <IconCalendar size={28} color="#6366F1" />,
      tag: 'শিডিউল নিয়ন্ত্রণ',
      title: 'মাল্টি-চেম্বার ক্যালেন্ডার ও ছুটির রিয়েলটাইম নোটিশ',
      desc: 'আপনি একাধিক হাসপাতাল বা চেম্বারে বসলে সহজেই সবগুলো চেম্বারের সময়সূচি আলাদাভাবে কনফিগার করুন। হঠাৎ কোনো কনফারেন্স বা ছুটিতে থাকলে রোগীরা স্বয়ংক্রিয়ভাবে মেসেজ পেয়ে যাবে।',
      benefits: [
        'বিভিন্ন চেম্বারের জন্য আলাদা সময় ও দিন নির্ধারণ',
        'ছুটি বা ইমার্জেন্সি সময়ে বুকিং সাময়িক স্থগিত রাখার অপশন',
        'রোগীদের কাছে স্বয়ংক্রিয় এসএমএস অ্যালার্ট প্রেরণ'
      ],
      actionText: 'বিনামূল্যে অ্যাকাউন্ট খুলুন',
      actionLink: '/register/doctor'
    }
  ]

  // ─── 3. SERVICES FOR HOSPITALS ─────────────────────────────────────────────
  const hospitalServices = [
    {
      id: 'hosp-display',
      icon: <IconDeviceDesktop size={28} color="#00B875" />,
      tag: 'হার্ডওয়্যার-ফ্রেন্ডলি',
      title: 'স্মার্ট ওপিডি টিভি ও এলইডি ডিসপ্লে বোর্ড সফটওয়্যার',
      desc: 'হাসপাতালের ওয়েটিং লাউঞ্জের যেকোনো স্মার্ট টিভি বা এলইডি স্ক্রিনে লাইভ সিরিয়াল প্রদর্শন করুন। রোগীরা শান্ত ও শৃঙ্খলাবদ্ধ থাকবে এবং ওপিডি কাউন্টারে অনাকাঙ্ক্ষিত ভিড় কমবে।',
      benefits: [
        'যেকোনো সাধারণ স্মার্ট টিভিতে ব্রাউজার দিয়ে তাৎক্ষণিক চালু',
        'কোনো ভারী বা দামি হার্ডওয়্যারের প্রয়োজন নেই',
        'রিয়েলটাইম ওয়েবসকেট প্রযুক্তিতে স্বয়ংক্রিয় স্ক্রিন রিফ্রেশ'
      ],
      actionText: 'হাসপাতাল অনবোর্ডিং শুরু করুন',
      actionLink: '/register/hospital'
    },
    {
      id: 'hosp-roster',
      icon: <IconBuildingHospital size={28} color="#0EA5E9" />,
      tag: 'সেন্ট্রাল ম্যানেজমেন্ট',
      title: 'সেন্ট্রাল ওপিডি ডাক্তার ও চেম্বার ডিরেক্টরি',
      desc: 'আপনার হাসপাতালের সকল ডিপার্টমেন্টের বিশেষজ্ঞ ডাক্তারদের রোস্টার, ওপিডি ভিজিট সময় এবং উপস্থিতির তথ্য একটি সেন্ট্রাল ড্যাশবোর্ড থেকে সহজে পরিচালনা করুন।',
      benefits: [
        'সকল ডিপার্টমেন্ট ও চিকিৎসকদের সমন্বিত ডাটাবেস',
        'কাউন্টার ও অনলাইন দুই মাধ্যম থেকেই সিরিয়াল বুকিং গ্রহণ',
        'প্রতিদিনের রোগী বুকিং সংখ্যা ও উপস্থিতি ট্র্যাকিং'
      ],
      actionText: 'হাসপাতাল হিসেবে নিবন্ধন করুন',
      actionLink: '/register/hospital'
    },
    {
      id: 'hosp-branding',
      icon: <IconSparkles size={28} color="#D97706" />,
      tag: 'ডিজিটাল উপস্থিতি',
      title: 'ডিজিটাল প্রোফাইল ও যাচাইকৃত প্ল্যাটফর্ম লিস্টিং',
      desc: 'Doctor Booklet প্ল্যাটফর্মে আপনার হাসপাতালের সেবাসমূহ, আইসিইউ/বেড সংখ্যা ও অ্যাম্বুলেন্স যোগাযোগের তথ্য লক্ষ লক্ষ রোগীর কাছে তুলে ধরুন।',
      benefits: [
        'রোগীদের বিশ্বস্ততা অর্জনে অফিসিয়াল ভেরিফায়েড প্রোফাইল ব্যাজ',
        'সরাসরি হাসপাতাল যোগাযোগ নম্বর ও লোকেশন সংযুক্তি',
        'রোগী সন্তুষ্টি ও সেবার নির্ভরযোগ্যতা বৃদ্ধি'
      ],
      actionText: 'যোগাযোগ করুন',
      actionLink: '/contact'
    }
  ]

  // ─── 4. PLATFORM LEGAL SAFEGUARDS & POLICIES ────────────────────────────────
  const legalDocuments = [
    {
      id: 'doc-intermediary',
      title: 'থার্ড-পার্টি প্ল্যাটফর্ম ও আইনি দায়িত্বসীমা (Intermediary Safe Harbor)',
      category: 'আইনি অবস্থান',
      updated: 'অক্টোবর ২০২৬',
      summary: 'Doctor Booklet একটি স্বাস্থ্যসেবা তথ্যপ্রযুক্তি মাধ্যম (Digital Technology Intermediary Platform)। আমরা প্রত্যক্ষভাবে কোনো চিকিৎসা পরামর্শ, সার্জারি বা ডায়াগনস্টিক প্যাথলজি টেস্ট পরিচালনা করি না।',
      points: [
        'সকল চিকিৎসা পরামর্শ সংশ্লিষ্ট বিএমডিসি সনদপ্রাপ্ত চিকিৎসকের নিজস্ব পেশাগত এখতিয়ারাধীন।',
        'ল্যাব ও ডায়াগনস্টিক টেস্ট সংশ্লিষ্ট স্বাস্থ্য অধিদপ্তর (DGHS) অনুমোদিত ল্যাব ও হাসপাতালের নিজস্ব তত্ত্বাবধানে সম্পন্ন হয়।',
        'তথ্যপ্রযুক্তি আইন অনুযায়ী প্ল্যাটফর্ম একটি স্বচ্ছ ও নিরপেক্ষ সমন্বয়কারী মাধ্যম হিসেবে কাজ করে।'
      ]
    },
    {
      id: 'doc-privacy',
      title: 'ডেটা সুরক্ষা ও স্বাস্থ্য তথ্য গোপনীয়তা অঙ্গীকার (Data Privacy)',
      category: 'তথ্য নিরাপত্তা',
      updated: 'অক্টোবর ২০২৬',
      summary: 'রোগীর মেডিকেল রেকর্ড, প্রেসক্রিপশন ও ব্যক্তিগত তথ্য সর্বোচ্চ আন্তর্জাতিক নিরাপত্তায় ২৫৬-বিট এনক্রিপশনে সংরক্ষিত থাকে।',
      points: [
        'রোগীর লিখিত বা ডিজিটাল অনুমোদন ছাড়া কোনো তথ্য তৃতীয় পক্ষের কাছে বাণিজ্যিক উদ্দেশ্যে বিক্রি করা হয় না।',
        'চিকিৎসক শুধুমাত্র রোগীর চিকিৎসার প্রয়োজনে এবং রোগীর সম্মতি সাপেক্ষে পূর্ববর্তী রেকর্ড দেখতে পারেন।',
        'রোগী যেকোনো সময় তার প্রোফাইল থেকে তথ্য ডাউনলোড বা নিষ্ক্রিয় করার অধিকার রাখেন।'
      ]
    },
    {
      id: 'doc-sla',
      title: 'প্ল্যাটফর্মের প্রাপ্যতা ও কারিগরি সহায়তা প্রতিশ্রুতি (Platform Service SLA)',
      category: 'সেবা মানদণ্ড',
      updated: 'অক্টোবর ২০২৬',
      summary: 'রোগী, ডাক্তার ও হাসপাতালের জন্য Doctor Booklet সফটওয়্যার সার্বক্ষণিক অ্যাক্টিভ রাখা ও কারিগরি সমস্যার দ্রুত সমাধানের অঙ্গীকার।',
      points: [
        '৯৯.৯% অনলাইন সিস্টেম আপটাইম এবং নিয়মিত ক্লাউড ব্যাকআপ।',
        'যেকোনো এসএমএস ওটিপি বা বুকিং ইস্যু তাৎক্ষণিকভাবে কাস্টমার সাপোর্ট দ্বারা সমাধান।',
        'সকাল ৯টা থেকে রাত ১০টা পর্যন্ত সক্রিয় হেল্পলাইন ও সার্বক্ষণিক ইমেইল সাপোর্ট।'
      ]
    }
  ]

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Hind Siliguri', 'Inter', sans-serif" }}>

      {/* ─── CUSTOM STYLES FOR HERO & CONTRAST & MOBILE ──────────────────────────── */}
      <style>{`
        .services-hero-section {
          background: radial-gradient(130% 110% at 50% 0%, #064E3B 0%, #022C22 55%, #011C15 100%);
          padding: 124px 0 60px; /* Full clearance for desktop fixed navbar (114px) */
          position: relative;
          overflow: hidden;
          color: #FFFFFF;
        }
        .services-breadcrumb-wrapper {
          margin-bottom: 6px;
          position: relative;
          z-index: 10;
        }
        .services-sticky-tabs {
          position: sticky;
          top: 76px;
          z-index: 30;
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }
        .services-hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 50%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 50%, transparent 100%);
          pointer-events: none;
        }
        .services-hero-glow-1 {
          position: absolute;
          top: -140px;
          right: 5%;
          width: 550px;
          height: 550px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 184, 117, 0.28) 0%, rgba(6, 78, 59, 0.08) 50%, transparent 70%);
          filter: blur(40px);
          pointer-events: none;
        }
        .services-hero-glow-2 {
          position: absolute;
          top: 15%;
          left: -100px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(6, 78, 59, 0.05) 50%, transparent 70%);
          filter: blur(45px);
          pointer-events: none;
        }
        .services-hero-title {
          color: #FFFFFF !important;
          font-weight: 900 !important;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.45);
        }
        .services-hero-highlight {
          color: #6EE7B7 !important;
          display: inline-block;
          font-weight: 900;
          text-shadow: 0 0 24px rgba(110, 231, 183, 0.55);
        }
        .services-hero-subtitle {
          color: rgba(255, 255, 255, 0.92) !important;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }
        .services-bottom-cta {
          background: radial-gradient(120% 120% at 50% 0%, #064E3B 0%, #033226 60%, #011E16 100%) !important;
          border-top: 1.5px solid rgba(52, 211, 153, 0.3) !important;
          position: relative;
          overflow: hidden;
        }
        .services-bottom-cta h3 {
          color: #FFFFFF !important;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4) !important;
        }
        .services-bottom-cta p {
          color: rgba(255, 255, 255, 0.9) !important;
        }

        /* ── RESPONSIVE MOBILE OPTIMIZATIONS ── */
        @media (max-width: 991px) {
          .services-hero-section {
            padding: 86px 0 38px !important; /* Full clearance for mobile fixed navbar (76px) */
          }
          .services-sticky-tabs {
            top: 70px !important;
          }
          .services-quick-card {
            margin-top: 16px !important;
          }
        }

        @media (max-width: 768px) {
          .services-hero-section {
            padding: 82px 0 30px !important; /* Generous breathing room: breadcrumb will never be cut off */
          }
          .services-breadcrumb-wrapper {
            margin-bottom: 8px !important;
          }
          .services-hero-grid {
            display: none !important; /* Hide background grid on mobile to eliminate visual text clutter */
          }
          .services-hero-title {
            font-size: 21px !important;
            line-height: 1.36 !important;
            margin-bottom: 10px !important;
          }
          .services-hero-highlight {
            display: inline !important;
          }
          .services-hero-subtitle {
            font-size: 13px !important;
            line-height: 1.62 !important;
            color: #E2E8F0 !important;
            margin-bottom: 16px !important;
          }
          .services-pill-badge {
            font-size: 11px !important;
            padding: 4px 12px !important;
            margin-bottom: 10px !important;
          }
          .services-feature-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 4px !important;
          }
          .services-feature-chip {
            padding: 8px 10px !important;
            font-size: 11.5px !important;
            border-radius: 9px !important;
            background: rgba(255, 255, 255, 0.08) !important;
            border: 1px solid rgba(255, 255, 255, 0.14) !important;
            justify-content: flex-start !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
          }
          .services-quick-card {
            padding: 14px 16px !important;
            border-radius: 14px !important;
            margin-top: 14px !important;
            background: rgba(255, 255, 255, 0.07) !important;
            border: 1px solid rgba(52, 211, 153, 0.25) !important;
          }
          .services-tabs-scroll {
            padding: 8px 4px !important;
            gap: 6px !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .services-tabs-scroll::-webkit-scrollbar {
            display: none !important;
          }
          .services-role-btn {
            padding: 8px 16px !important;
            font-size: 12.5px !important;
            border-radius: 99px !important;
            gap: 6px !important;
            flex-shrink: 0 !important;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .services-role-btn-active {
            font-weight: 900 !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08) !important;
            transform: scale(1.02);
          }
          .services-main-container {
            padding-top: 20px !important;
            padding-bottom: 38px !important;
          }
          .services-section-title {
            font-size: 19px !important;
            line-height: 1.35 !important;
            margin-bottom: 6px !important;
          }
          .services-section-desc {
            font-size: 13px !important;
            line-height: 1.5 !important;
            margin-bottom: 16px !important;
          }
          .services-card-item {
            padding: 18px 15px !important;
            border-radius: 14px !important;
          }
          .services-card-icon-box {
            width: 42px !important;
            height: 42px !important;
            border-radius: 8px !important;
          }
          .services-card-title {
            font-size: 16px !important;
            margin-bottom: 8px !important;
          }
          .services-card-desc {
            font-size: 13px !important;
            line-height: 1.5 !important;
            margin-bottom: 14px !important;
          }
          .services-benefits-box {
            padding: 10px 12px !important;
            margin-bottom: 16px !important;
            gap: 6px !important;
          }
          .services-benefits-text {
            font-size: 12px !important;
          }
          .services-action-btn {
            padding: 10px 14px !important;
            font-size: 13px !important;
            border-radius: 8px !important;
            min-height: 42px !important;
            width: 100% !important;
            justify-content: center !important;
          }
          .services-disclaimer-box {
            flex-direction: column !important;
            padding: 14px 16px !important;
            gap: 10px !important;
            margin-top: 20px !important;
          }
          .services-bottom-cta {
            padding: 32px 0 !important;
            text-align: center !important;
          }
          .services-bottom-cta-header {
            flex-direction: column !important;
            text-align: center !important;
            align-items: center !important;
            gap: 10px !important;
          }
          .services-bottom-cta-header h3 {
            font-size: 18px !important;
          }
          .services-bottom-cta-buttons {
            flex-direction: column !important;
            width: 100% !important;
            gap: 8px !important;
            margin-top: 14px !important;
          }
          .services-bottom-cta-buttons a {
            width: 100% !important;
            justify-content: center !important;
            padding: 11px 16px !important;
          }
        }

        @media (max-width: 420px) {
          .services-feature-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6px !important;
          }
          .services-feature-chip {
            padding: 7px 8px !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      {/* ─── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="services-hero-section">
        {/* Ambient Grid & Glows */}
        <div className="services-hero-grid" />
        <div className="services-hero-glow-1" />
        <div className="services-hero-glow-2" />

        {/* Subtle Ambient Light Waves */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none', overflow: 'hidden' }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 400" fill="none" preserveAspectRatio="none">
            <path d="M-100 280 C300 400, 700 120, 1100 250 C1300 320, 1500 180, 1600 200" stroke="rgba(52, 211, 153, 0.45)" strokeWidth="1.5" fill="none" />
            <path d="M-100 230 C350 350, 750 80, 1150 200 C1350 270, 1550 140, 1600 160" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1" strokeDasharray="6 6" fill="none" />
            <path d="M-100 330 C250 450, 650 170, 1050 300 C1250 370, 1450 230, 1600 250" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Dedicated Breadcrumb Container with Clean Top Spacing */}
        <div className="services-breadcrumb-wrapper">
          <BreadcrumbHUD
            variant="light"
            links={[
              { label: 'হোম', href: '/' },
              { label: 'আমাদের প্ল্যাটফর্ম সেবা সমূহ' }
            ]}
          />
        </div>

        <Container style={{ position: 'relative', zIndex: 2, marginTop: 4 }}>
          <Row className="align-items-center g-4">
            <Col lg={8}>
              {/* Green Pill Badge */}
              <div className="services-pill-badge" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                padding: '6px 16px',
                borderRadius: 99,
                marginBottom: 14,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FFB0', boxShadow: '0 0 12px #00FFB0', display: 'inline-block' }} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#ECFDF5', letterSpacing: '0.4px' }}>
                  ডিজিটাল স্বাস্থ্যসেবা সমন্বয়কারী প্রযুক্তি মাধ্যম
                </span>
              </div>

              {/* Main Headline with Explicit White Contrast & Mint Highlight */}
              <h1 className="services-hero-title" style={{
                fontSize: 'clamp(26px, 3.8vw, 42px)',
                fontWeight: 900,
                lineHeight: 1.3,
                letterSpacing: '-0.3px',
                marginBottom: 14,
                color: '#FFFFFF'
              }}>
                <span>স্বাস্থ্যসেবা ব্যবস্থাপনায় আপনার নির্ভরযোগ্য </span>
                <span className="services-hero-highlight">
                  ডিজিটাল প্রযুক্তি অংশীদার
                </span>
              </h1>

              {/* Honest, Clear Subtitle */}
              <p className="services-hero-subtitle" style={{
                fontSize: 'clamp(14px, 1.3vw, 16px)',
                color: 'rgba(255, 255, 255, 0.92)',
                lineHeight: 1.68,
                maxWidth: 680,
                marginBottom: 20,
                fontWeight: 500
              }}>
                Doctor Booklet কোনো হাসপাতাল বা ডায়াগনস্টিক ল্যাব নয়; এটি একটি নিরাপদ তথ্যপ্রযুক্তি প্ল্যাটফর্ম—যা রোগী, বিএমডিসি সনদপ্রাপ্ত বিশেষজ্ঞ চিকিৎসক এবং হাসপাতালের মধ্যে দ্রুত, ঝামেলামুক্ত ও আধুনিক সমন্বয় গড়ে তোলে।
              </p>

              {/* Core Feature Badges: Clean 2x2 Symmetric Mobile Grid */}
              <div className="services-feature-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'সহজ অনলাইন সিরিয়াল', icon: <IconCalendar size={15} color="#00FFB0" /> },
                  { label: 'লাইভ সিরিয়াল ট্র্যাকিং', icon: <IconClock size={15} color="#38BDF8" /> },
                  { label: 'স্মার্ট ই-প্রেসক্রিপশন', icon: <IconFileText size={15} color="#FCD34D" /> },
                  { label: 'এনক্রিপ্টেড হেলথ রেকর্ড', icon: <IconLock size={15} color="#A7F3D0" /> }
                ].map((item, idx) => (
                  <div key={idx} className="services-feature-chip" style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </Col>

            {/* Quick Action Box with Glassmorphism */}
            <Col lg={4}>
              <div className="services-quick-card" style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(52, 211, 153, 0.35)',
                borderRadius: 18,
                padding: '24px 22px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(0, 255, 176, 0.2)',
                    border: '1px solid rgba(0, 255, 176, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconShieldCheck size={22} color="#00FFB0" />
                  </div>
                  <div>
                    <span style={{ fontSize: 14.5, fontWeight: 900, color: '#FFFFFF', display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                      স্বচ্ছতা ও আইনি অঙ্গীকার
                    </span>
                    <span style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 600 }}>
                      Safe Harbor Policy
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.6, marginBottom: 18 }}>
                  Doctor Booklet তথ্যপ্রযুক্তি আইন অনুযায়ী একটি নিরপেক্ষ ইন্টারমিডিয়ারি। আমরা কোনো চিকিৎসা পরামর্শ দেই না; চিকিৎসকের সঙ্গে রোগীকে নির্বিঘ্নে যুক্ত করি।
                </p>
                <button
                  onClick={() => handleRoleChange('legal', true)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #00B875 0%, #009E64 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '12px 16px',
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 6px 18px rgba(0, 184, 117, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <IconFileText size={17} color="#FFFFFF" />
                  <span>আইনি দায়মুক্তি ও নীতিমালা পড়ুন</span>
                </button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ─── ROLE SELECTOR TABS ────────────────────────────────────────────────── */}
      <section className="services-sticky-tabs" id="services-role-tabs">
        <Container>
          <div
            ref={tabsContainerRef}
            className="services-tabs-scroll"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflowX: 'auto',
              padding: '12px 0',
              position: 'relative'
            }}
          >
            <button
              ref={el => (tabRefs.current['patient'] = el)}
              className={`services-role-btn ${activeRole === 'patient' ? 'services-role-btn-active' : ''}`}
              onClick={() => handleRoleChange('patient')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                border: activeRole === 'patient' ? '1.5px solid #00B875' : '1px solid #E2E8F0',
                background: activeRole === 'patient' ? '#F0FDF4' : '#FFFFFF',
                color: activeRole === 'patient' ? '#065F46' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <IconUsers size={18} color={activeRole === 'patient' ? '#00B875' : '#64748B'} />
              <span>রোগী ও পরিবারের জন্য সেবা</span>
            </button>

            <button
              ref={el => (tabRefs.current['doctor'] = el)}
              className={`services-role-btn ${activeRole === 'doctor' ? 'services-role-btn-active' : ''}`}
              onClick={() => handleRoleChange('doctor')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                border: activeRole === 'doctor' ? '1.5px solid #0EA5E9' : '1px solid #E2E8F0',
                background: activeRole === 'doctor' ? '#F0F9FF' : '#FFFFFF',
                color: activeRole === 'doctor' ? '#0369A1' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <IconStethoscope size={18} color={activeRole === 'doctor' ? '#0EA5E9' : '#64748B'} />
              <span>ডাক্তারদের জন্য চেম্বার সেবা</span>
            </button>

            <button
              ref={el => (tabRefs.current['hospital'] = el)}
              className={`services-role-btn ${activeRole === 'hospital' ? 'services-role-btn-active' : ''}`}
              onClick={() => handleRoleChange('hospital')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                border: activeRole === 'hospital' ? '1.5px solid #6366F1' : '1px solid #E2E8F0',
                background: activeRole === 'hospital' ? '#EEF2FF' : '#FFFFFF',
                color: activeRole === 'hospital' ? '#3730A3' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <IconBuildingHospital size={18} color={activeRole === 'hospital' ? '#6366F1' : '#64748B'} />
              <span>হাসপাতাল ও ক্লিনিকের প্রযুক্তি সেবা</span>
            </button>

            <button
              ref={el => (tabRefs.current['legal'] = el)}
              className={`services-role-btn ${activeRole === 'legal' ? 'services-role-btn-active' : ''}`}
              onClick={() => handleRoleChange('legal')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                border: activeRole === 'legal' ? '1.5px solid #D97706' : '1px solid #E2E8F0',
                background: activeRole === 'legal' ? '#FFFBEB' : '#FFFFFF',
                color: activeRole === 'legal' ? '#92400E' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <IconShieldCheck size={18} color={activeRole === 'legal' ? '#D97706' : '#64748B'} />
              <span>আইনি দায়মুক্তি ও নীতিগত অবস্থান</span>
            </button>
          </div>
        </Container>
      </section>

      {/* ─── MAIN SERVICES CONTENT ──────────────────────────────────────────────── */}
      <Container className="services-main-container" style={{ paddingTop: 36, paddingBottom: 60 }}>

        {/* ─── 1. PATIENTS VIEW ────────────────────────────────────────────────── */}
        {activeRole === 'patient' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#00B875', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                For Patients & Families
              </span>
              <h2 className="services-section-title" style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '4px 0 8px' }}>
                রোগী ও তাদের স্বজনদের জন্য সহজ ও ঝামেলামুক্ত প্রযুক্তি সেবা
              </h2>
              <p className="services-section-desc" style={{ fontSize: 14, color: '#64748B', maxWidth: 680 }}>
                ডাক্তার দেখানো এখন আরও দ্রুত ও স্বচ্ছ। কোনো লম্বা লাইনে দাঁড়ানো ছাড়া ঘরে বসেই সিরিয়াল নিন এবং চেম্বারের লাইভ অগ্রগতি ট্র্যাক করুন।
              </p>
            </div>

            <Row className="g-3 g-md-4">
              {patientServices.map(item => (
                <Col key={item.id} xs={12} md={6}>
                  <div className="services-card-item" style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '24px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}>
                    <div>
                      {/* Tag & Icon */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div className="services-card-icon-box" style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          background: '#F0FDF4',
                          border: '1px solid #DCFCE7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {item.icon}
                        </div>
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          background: '#DCFCE7',
                          color: '#166534',
                          padding: '3px 10px',
                          borderRadius: 99
                        }}>
                          {item.tag}
                        </span>
                      </div>

                      {/* Title & Desc */}
                      <h3 className="services-card-title" style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>
                        {item.title}
                      </h3>
                      <p className="services-card-desc" style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, marginBottom: 18 }}>
                        {item.desc}
                      </p>

                      {/* Benefits Bullets */}
                      <div className="services-benefits-box" style={{
                        background: '#F8FAFC',
                        borderRadius: 8,
                        padding: '12px 14px',
                        marginBottom: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}>
                        {item.benefits.map((b, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155' }}>
                            <IconCircleCheck size={16} color="#00B875" style={{ flexShrink: 0 }} />
                            <span className="services-benefits-text">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Link */}
                    <Link
                      to={item.actionLink}
                      className="services-action-btn"
                      style={{
                        background: '#00B875',
                        color: '#FFFFFF',
                        padding: '10px 16px',
                        borderRadius: 8,
                        fontSize: 13.5,
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <span>{item.actionText}</span>
                      <IconArrowRight size={16} />
                    </Link>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* ─── 2. DOCTORS VIEW ─────────────────────────────────────────────────── */}
        {activeRole === 'doctor' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                For Healthcare Practitioners
              </span>
              <h2 className="services-section-title" style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '4px 0 8px' }}>
                চিকিৎসকদের জন্য আধুনিক ও ঝামেলামুক্ত চেম্বার সফটওয়্যার
              </h2>
              <p className="services-section-desc" style={{ fontSize: 14, color: '#64748B', maxWidth: 680 }}>
                রোগী দেখা হোক আরও স্বস্তিদায়ক। ১-মিনিটে ডিজিটাল প্রেসক্রিপশন তৈরি, লাইভ পেশেন্ট কলিং এবং মাল্টি-চেম্বার শিডিউল নিয়ন্ত্রণ করুন এক ক্লিকে।
              </p>
            </div>

            <Row className="g-3 g-md-4">
              {doctorServices.map(item => (
                <Col key={item.id} xs={12} md={4}>
                  <div className="services-card-item" style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '24px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div className="services-card-icon-box" style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          background: '#F0F9FF',
                          border: '1px solid #E0F2FE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {item.icon}
                        </div>
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          background: '#E0F2FE',
                          color: '#0369A1',
                          padding: '3px 10px',
                          borderRadius: 99
                        }}>
                          {item.tag}
                        </span>
                      </div>

                      <h3 className="services-card-title" style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>
                        {item.title}
                      </h3>
                      <p className="services-card-desc" style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, marginBottom: 18 }}>
                        {item.desc}
                      </p>

                      <div className="services-benefits-box" style={{
                        background: '#F8FAFC',
                        borderRadius: 8,
                        padding: '12px 14px',
                        marginBottom: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}>
                        {item.benefits.map((b, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155' }}>
                            <IconCircleCheck size={16} color="#0EA5E9" style={{ flexShrink: 0 }} />
                            <span className="services-benefits-text">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link
                      to={item.actionLink}
                      className="services-action-btn"
                      style={{
                        background: '#0EA5E9',
                        color: '#FFFFFF',
                        padding: '10px 16px',
                        borderRadius: 8,
                        fontSize: 13.5,
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <span>{item.actionText}</span>
                      <IconArrowRight size={16} />
                    </Link>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* ─── 3. HOSPITALS VIEW ───────────────────────────────────────────────── */}
        {activeRole === 'hospital' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                For Hospitals & Clinics
              </span>
              <h2 className="services-section-title" style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '4px 0 8px' }}>
                হাসপাতাল ও ওপিডি ব্যবস্থার জন্য আধুনিক প্রযুক্তি সমাধান
              </h2>
              <p className="services-section-desc" style={{ fontSize: 14, color: '#64748B', maxWidth: 680 }}>
                ওপিডি কাউন্টারের ভিড় কমান এবং রোগীদের ওয়েটিং রুমে স্মার্ট টিভি ডিসপ্লে বোর্ডের মাধ্যমে রিয়েলটাইম সিরিয়াল প্রদর্শন করুন।
              </p>
            </div>

            <Row className="g-3 g-md-4">
              {hospitalServices.map(item => (
                <Col key={item.id} xs={12} md={4}>
                  <div className="services-card-item" style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '24px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div className="services-card-icon-box" style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          background: '#EEF2FF',
                          border: '1px solid #E0E7FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {item.icon}
                        </div>
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          background: '#E0E7FF',
                          color: '#3730A3',
                          padding: '3px 10px',
                          borderRadius: 99
                        }}>
                          {item.tag}
                        </span>
                      </div>

                      <h3 className="services-card-title" style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>
                        {item.title}
                      </h3>
                      <p className="services-card-desc" style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, marginBottom: 18 }}>
                        {item.desc}
                      </p>

                      <div className="services-benefits-box" style={{
                        background: '#F8FAFC',
                        borderRadius: 8,
                        padding: '12px 14px',
                        marginBottom: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}>
                        {item.benefits.map((b, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155' }}>
                            <IconCircleCheck size={16} color="#6366F1" style={{ flexShrink: 0 }} />
                            <span className="services-benefits-text">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link
                      to={item.actionLink}
                      className="services-action-btn"
                      style={{
                        background: '#6366F1',
                        color: '#FFFFFF',
                        padding: '10px 16px',
                        borderRadius: 8,
                        fontSize: 13.5,
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <span>{item.actionText}</span>
                      <IconArrowRight size={16} />
                    </Link>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* ─── 4. LEGAL SAFEGUARDS VIEW ────────────────────────────────────────── */}
        {activeRole === 'legal' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Legal Framework & Safeguards
              </span>
              <h2 className="services-section-title" style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '4px 0 8px' }}>
                Doctor Booklet-এর আইনি অবস্থান ও দায়মুক্তি বিষয়ক নীতিমালা
              </h2>
              <p className="services-section-desc" style={{ fontSize: 14, color: '#64748B', maxWidth: 680 }}>
                আমরা একটি স্বচ্ছ ও দায়িত্বশীল ডিজিটাল প্রযুক্তি মাধ্যম। ব্যবহারকারী, চিকিৎসক ও হাসপাতালের আইনি অধিকার ও নিরাপত্তার জন্য আমাদের সুস্পষ্ট অবস্থান জেনে নিন।
              </p>
            </div>

            <Row className="g-3 g-md-4">
              {legalDocuments.map(doc => (
                <Col key={doc.id} xs={12} md={4}>
                  <div className="services-card-item" style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '24px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: 4 }}>
                          {doc.category}
                        </span>
                        <span style={{ fontSize: 11, color: '#64748B' }}>
                          হালনাগাদ: {doc.updated}
                        </span>
                      </div>

                      <h3 className="services-card-title" style={{ fontSize: 16.5, fontWeight: 800, color: '#0F172A', marginBottom: 12, lineHeight: 1.4 }}>
                        {doc.title}
                      </h3>

                      <p className="services-card-desc" style={{ fontSize: 13, color: '#475569', lineHeight: 1.55, marginBottom: 16 }}>
                        {doc.summary}
                      </p>

                      <div className="services-benefits-box" style={{
                        background: '#F8FAFC',
                        borderRadius: 8,
                        padding: '12px 14px',
                        marginBottom: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}>
                        {doc.points.map((p, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#334155', lineHeight: 1.4 }}>
                            <IconCheck size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} stroke={3} />
                            <span className="services-benefits-text">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      className="services-action-btn"
                      onClick={() => {
                        setSelectedLegalDoc(doc)
                        setShowLegalDocModal(true)
                      }}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        color: '#334155',
                        padding: '10px 14px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <IconFileText size={15} />
                      <span>বিস্তারিত দলিল পড়ুন</span>
                    </button>
                  </div>
                </Col>
              ))}
            </Row>

            {/* Prominent Legal Disclaimer Callout */}
            <div className="services-disclaimer-box" style={{
              marginTop: 32,
              background: '#FFFBEB',
              border: '1.5px solid #FDE68A',
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16
            }}>
              <IconAlertCircle size={28} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ fontSize: 15.5, fontWeight: 900, color: '#92400E', margin: '0 0 6px' }}>
                  বিশেষ দ্রষ্টব্য ও মেডিকেল ডিসক্লেইমার:
                </h4>
                <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6, margin: 0 }}>
                  Doctor Booklet প্ল্যাটফর্ম কোনো জরুরি বা সংকটজনক সেবা (Emergency Hospital/ICU Admission) প্রদানকারী প্রতিষ্ঠান নয়। সড়ক দুর্ঘটনা, বিষক্রিয়া, তীব্র হার্ট অ্যাটাক বা জীবনহানির ঝুঁকি থাকলে প্ল্যাটফর্মে সিরিয়ালের জন্য অপেক্ষা না করে অবিলম্বে নিকটস্থ সরকারি বা বেসরকারি হাসপাতালের জরুরি বিভাগে (Emergency Department) সরাসরি রোগীকে নিয়ে যাওয়ার পরামর্শ দেওয়া হচ্ছে।
                </p>
              </div>
            </div>
          </div>
        )}

      </Container>

      {/* ─── LEGAL DETAIL MODAL ────────────────────────────────────────────────── */}
      {selectedLegalDoc && (
        <Modal show={showLegalDocModal} onHide={() => setShowLegalDocModal(false)} centered size="lg">
          <Modal.Header closeButton style={{ borderBottom: '1px solid #E2E8F0', padding: '16px 24px' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 4 }}>
                {selectedLegalDoc.category} • হালনাগাদ: {selectedLegalDoc.updated}
              </span>
              <Modal.Title style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
                {selectedLegalDoc.title}
              </Modal.Title>
            </div>
          </Modal.Header>
          <Modal.Body style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '14px 16px', fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
                <strong>মূল সারসংক্ষেপ:</strong> {selectedLegalDoc.summary}
              </div>

              <div>
                <h5 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>
                  আইনি অনুচ্ছেদ ও অঙ্গীকারসমূহ:
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedLegalDoc.points.map((p, idx) => (
                    <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <IconCheck size={13} color="#166534" stroke={3} />
                      </div>
                      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                        {p}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                Doctor Booklet কেন্দ্রীয় প্ল্যাটফর্ম নিয়মানুযায়ী এই শর্তাবলী কার্যকর এবং সকল ব্যবহারকারী এই শর্ত মেনে প্ল্যাটফর্ম ব্যবহারে সম্মত হন।
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: '1px solid #E2E8F0', padding: '12px 24px' }}>
            <Button variant="secondary" onClick={() => setShowLegalDocModal(false)} style={{ fontSize: 13, fontWeight: 700 }}>
              বন্ধ করুন
            </Button>
            <Link to="/legal" className="btn btn-success" style={{ background: '#00B875', border: 'none', fontSize: 13, fontWeight: 700 }}>
              সম্পূর্ণ আইনি পেজ দেখুন
            </Link>
          </Modal.Footer>
        </Modal>
      )}

      {/* ─── BOTTOM ONBOARDING & SUPPORT STRIP ──────────────────────────────────── */}
      <section className="services-bottom-cta" style={{
        padding: '48px 0',
        color: '#FFFFFF'
      }}>
        {/* Subtle Wave in Bottom */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.16, pointerEvents: 'none', overflow: 'hidden' }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 200" fill="none" preserveAspectRatio="none">
            <path d="M-100 120 C300 200, 700 40, 1100 110 C1300 150, 1500 80, 1600 100" stroke="rgba(52, 211, 153, 0.5)" strokeWidth="1.5" fill="none" />
          </svg>
        </div>

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="align-items-center g-4">
            <Col lg={8}>
              <div className="services-bottom-cta-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(0, 255, 176, 0.18)',
                  border: '1.5px solid rgba(0, 255, 176, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0, 255, 176, 0.25)'
                }}>
                  <IconHeadset size={26} color="#00FFB0" />
                </div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px', textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}>
                    আমাদের সেবা বা প্রযুক্তি সংক্রান্ত কোনো প্রশ্ন আছে?
                  </h3>
                  <span style={{ fontSize: 12, color: '#A7F3D0', fontWeight: 600 }}>২৪/৭ সার্বক্ষণিক কাস্টমার কেয়ার ও সাপোর্ট</span>
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', margin: 0, maxWidth: 640, lineHeight: 1.6 }}>
                রোগী, ডাক্তার কিংবা হাসপাতাল—যেকোনো সহায়তা বা প্ল্যাটফর্ম সংক্রান্ত তথ্যের জন্য আমাদের সাপোর্ট টিম সপ্তাহে ৭ দিনই সক্রিয় রয়েছে।
              </p>
            </Col>

            <Col lg={4} className="text-lg-end">
              <div className="services-bottom-cta-buttons" style={{ display: 'flex', gap: 10, justifyContent: 'lg-end' }}>
                <Link
                  to="/contact"
                  style={{
                    background: '#00B875',
                    color: '#FFFFFF',
                    padding: '12px 22px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 6px 20px rgba(0, 184, 117, 0.35)'
                  }}
                >
                  <span>যোগাযোগ করুন</span>
                  <IconArrowRight size={17} />
                </Link>

                <Link
                  to="/legal"
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                    padding: '12px 20px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>সকল ডকুমেন্টস</span>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

    </div>
  )
}

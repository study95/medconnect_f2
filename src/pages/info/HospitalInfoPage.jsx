import React, { useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { 
  Building2, Users, Calendar, Clock, Tv, FileText, 
  ShieldCheck, ArrowRight, Sparkles, TrendingUp, CheckCircle2,
  Laptop, ChevronDown, ChevronUp, Activity, 
  Award, Database, Shield, Check,
  UserCheck, Stethoscope, HeartPulse, Plus, Minus
} from 'lucide-react'

export default function HospitalInfoPage() {
  const [activeTab, setActiveTab] = useState('roster')
  const [openFaq, setOpenFaq] = useState(0)

  // 6 Core Hospital Benefits (Short, punchy & non-repetitive)
  const hospitalServices = [
    {
      id: 'roster',
      icon: <Users size={24} />,
      badge: 'ওপিডি রোস্টার',
      title: 'মাল্টি-ডিপার্টমেন্ট ও কনসালট্যান্ট শিডিউলিং',
      desc: 'হাসপাতালের সকল স্থায়ী ও ভিজিটিং চিকিৎসকদের ওপিডি রোস্টার ও শিফট কেন্দ্রীয়ভাবে পরিচালনা করুন।',
      tags: ['🕒 শিফট রোস্টার', '👨‍⚕️ কনসালট্যান্ট কন্ট্রোল'],
      color: '#00B875',
      bg: '#F0FDF4',
      border: '#DCFCE7'
    },
    {
      id: 'display',
      icon: <Tv size={24} />,
      badge: 'লাউঞ্জ কিউ',
      title: 'স্মার্ট টিভি ডিসপ্লে নেটওয়ার্ক',
      desc: 'ওপিডি লাউঞ্জে কোনো ডিভাইস ছাড়া যেকোনো স্মার্ট টিভিতে ডিপার্টমেন্টভিত্তিক লাইভ কিউ ডিসপ্লে চালান।',
      tags: ['📺 মাল্টি-চেম্বার কিউ', '🔔 স্বয়ংক্রিয় কল'],
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#DBEAFE'
    },
    {
      id: 'frontdesk',
      icon: <UserCheck size={24} />,
      badge: 'ফ্রন্টডেস্ক',
      title: 'কাউন্টার ও ক্যাশ কালেকশন',
      desc: 'রিসেপশনিস্ট ও ক্যাশিয়ারদের আলাদা অপারেটর এক্সেস দিয়ে দ্রুত সিরিয়াল ও স্বচ্ছ ক্যাশ হিসাব রাখুন।',
      tags: ['💳 ক্যাশ রিকনসিলিয়েশন', '🎫 ডিজিটাল টোকেন'],
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#EDE9FE'
    },
    {
      id: 'facilities',
      icon: <HeartPulse size={24} />,
      badge: 'সার্ভিস প্রোফাইল',
      title: 'জরুরি সেবা ও আইসিইউ প্রোফাইল',
      desc: '২৪/৭ জরুরি বিভাগ, অ্যাম্বুলেন্স, আইসিইউ এবং ডায়াগনস্টিক প্যাকেজ রোগীদের সামনে তুলে ধরুন।',
      tags: ['🚑 ওয়ান-ট্যাপ ডায়ালিং', '🧪 প্যাথলজি প্যাকেজ'],
      color: '#0D9488',
      bg: '#F0FDFA',
      border: '#CCFBF1'
    },
    {
      id: 'analytics',
      icon: <TrendingUp size={24} />,
      badge: 'ফাইন্যান্স',
      title: 'ওপিডি রেভিনিউ ও অ্যানালিটিক্স',
      desc: 'ডিপার্টমেন্ট ও ডাক্তারভিত্তিক দৈনিক রোগী সংখ্যা ও আয় কালেকশনের গ্রাফিকাল স্টেটমেন্ট।',
      tags: ['📊 পিক-আওয়ার অ্যানালাইসিস', '📑 এক্সেল/পিডিএফ স্টেটমেন্ট'],
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FEF3C7'
    },
    {
      id: 'branding',
      icon: <Award size={24} />,
      badge: 'ডিজিটাল ব্রান্ডিং',
      title: 'ভেরিফাইড হসপিটাল পেজ',
      desc: 'লোকাল সার্চে হাসপাতালের সকল সুযোগ-সুবিধা ও চিকিৎসকদের নির্ভরযোগ্য ব্র্যান্ড উপস্থিতি।',
      tags: ['🏥 অফিসিয়াল প্রোফাইল', '⭐ রোগী রিভিউ'],
      color: '#E11D48',
      bg: '#FFF1F2',
      border: '#FFE4E6'
    }
  ]

  // Interactive Tab Showcase Data (Concise)
  const tabShowcases = {
    roster: {
      tag: 'সেন্ট্রাল রোস্টার',
      title: 'সকল ওপিডি শিফট একটি ড্যাশবোর্ডে',
      desc: 'মেডিসিন, সার্জারি, গাইনি সহ প্রতিটি ডিপার্টমেন্টের ডাক্তারদের দৈনিক শিফট ও রোগী কোটা সহজে নিয়ন্ত্রণ করুন।',
      tags: ['ডিপার্টমেন্ট অনুযায়ী স্লট', 'জরুরি ছুটিতে অটো-অফ', 'বাল্ক এসএমএস রিমাইন্ডার'],
      badgeColor: '#00B875',
      mockupBg: '#064E3B',
      mockupTitle: 'সেন্ট্রাল ওপিডি প্যানেল',
      mockupSub: '৮টি ওপিডি ডিপার্টমেন্ট সক্রিয়',
      mockupValue: 'মোট ডাক্তার: ৪২ জন'
    },
    display: {
      tag: 'টিভি নেটওয়ার্ক',
      title: 'ওয়েটিং লাউঞ্জে শোরগোল বন্ধ করুন',
      desc: 'যেকোনো সাধারণ স্মার্ট টিভি ব্রাউজারে লিংক ওপেন করলেই বিভিন্ন ফ্লোরের ডাক্তারদের চলমান সিরিয়াল লাইভ দেখা যায়।',
      tags: ['ফ্লোর অনুযায়ী ডিসপ্লে', 'ভয়েস ও অডিও কল', 'মোবাইলে লাইভ আপডেট'],
      badgeColor: '#2563EB',
      mockupBg: '#1E3A8A',
      mockupTitle: 'লাউঞ্জ টিভি ডিসপ্লে',
      mockupSub: 'ওপিডি ফ্লোর ২ (চেম্বার ১-৬)',
      mockupValue: 'কিউ সক্রিয়'
    },
    frontdesk: {
      tag: 'কাউন্টার ম্যানেজমেন্ট',
      title: 'ফ্রন্টডেস্ক কর্মীদের সুরক্ষিত এক্সেস',
      desc: 'রিসেপশনিস্টরা দ্রুত সরাসরি আসা ও ফোনে বুক করা রোগীদের সিরিয়াল এন্ট্রি ও টোকেন প্রিন্ট দিতে পারবেন।',
      tags: ['ওয়াক-ইন এন্ট্রি', 'শিফট ক্যাশ কালেকশন', 'মেডিকেল ডেটা গোপন'],
      badgeColor: '#7C3AED',
      mockupBg: '#4C1D95',
      mockupTitle: 'কাউন্টার ফ্রন্টডেস্ক',
      mockupSub: 'শিফট ক্যাশ কালেকশন',
      mockupValue: '৳ ২৪,৫০০ রিকনসিল্ড'
    },
    analytics: {
      tag: 'হাসপাতাল রিপোর্ট',
      title: 'স্বচ্ছ আর্থিক ও ওপিডি অ্যানালিটিক্স',
      desc: 'হাসপাতালের পিক আওয়ার ও রোগী ট্রাফিকের হিসাব দেখে স্টাফ ও রোস্টার অপ্টিমাইজেশন করুন সহজেই।',
      tags: ['ডাক্তারভিত্তিক ভিজিট রিপোর্ট', 'হাসপাতাল ফি শেয়ারিং', '১-ক্লিকে এক্সেল ডাউনলোড'],
      badgeColor: '#0D9488',
      mockupBg: '#134E4A',
      mockupTitle: 'রেভিনিউ ড্যাশবোর্ড',
      mockupSub: 'মাসিক ওপিডি বৃদ্ধি +২৮%',
      mockupValue: 'পূর্ণ স্টেটমেন্ট'
    }
  }

  // 3 Simple Steps
  const steps = [
    {
      num: '১',
      title: 'হাসপাতাল রেজিস্ট্রেশন',
      desc: 'হাসপাতালের লাইসেন্স ও প্রাথমিক তথ্য দিয়ে প্রোফাইল খুলুন।'
    },
    {
      num: '২',
      title: 'ডাক্তার ও ওপিডি রোস্টার যুক্ত',
      desc: 'চিকিৎসকদের তালিকা ও শিফট সময়সূচী সেটআপ করুন।'
    },
    {
      num: '৩',
      title: 'কাউন্টার ও ডিসপ্লে সক্রিয়',
      desc: 'ফ্রন্টডেস্ক অপারেটর ও স্মার্ট টিভি কিউ বোর্ড চালু করুন।'
    }
  ]

  // Direct, 1-2 line FAQs
  const faqs = [
    {
      q: 'হাসপাতাল পার্টনার হিসেবে যুক্ত হতে কোনো চার্জ লাগে?',
      a: 'প্রাথমিক রেজিস্ট্রেশন ও প্রোফাইল সেটআপ সম্পূর্ণ ফ্রি। আপনি ট্রায়াল দিয়ে সুবিধাগুলো যাচাই করতে পারবেন।'
    },
    {
      q: 'হাসপাতালের একাধিক কাউন্টার স্টাফ কি একসাথে চালাতে পারবে?',
      a: 'হ্যাঁ, মাল্টি-অপারেটর সাপোর্ট রয়েছে। রিসেপশনিস্ট ও ক্যাশিয়ারদের জন্য আলাদা সুরক্ষিত লগইন দেওয়া যাবে।'
    },
    {
      q: 'স্মার্ট টিভি কিউ ডিসপ্লে চালুর জন্য বিশেষ সফটওয়্যার লাগবে?',
      a: 'না, কোনো বিশেষ সফটওয়্যার বা ডিভাইসের প্রয়োজন নেই। সাধারণ স্মার্ট টিভির ব্রাউজারে লিংক ওপেন করলেই চলবে।'
    },
    {
      q: 'আমাদের রোগী ও আর্থিক তথ্যের নিরাপত্তা কেমন?',
      a: 'আন্তর্জাতিক মানসম্মত ২৫৬-বিট SSL এনক্রিপশন ও সার্বক্ষণিক ক্লাউড ব্যাকআপের মাধ্যমে ডেটা শতভাগ সুরক্ষিত থাকে।'
    }
  ]

  return (
    <div className="hospital-info-page" style={{ background: '#F8FAFC', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ── RESPONSIVE COMPACT STYLING ── */}
      <style>{`
        .hospital-hero-section {
          position: relative;
          background: linear-gradient(145deg, #022C22 0%, #064E3B 45%, #0B3B32 100%);
          padding: 120px 0 75px;
          color: white;
          overflow: hidden;
        }
        .hospital-hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(52, 211, 153, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(52, 211, 153, 0.07) 1px, transparent 1px);
          background-size: 38px 38px;
          pointer-events: none;
        }
        .hospital-hero-glow-1 {
          position: absolute;
          top: -120px;
          right: -80px;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 184, 117, 0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .hospital-hero-badge {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          padding: 6px 16px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #DCFCE7;
        }
        .hospital-hero-title {
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 950;
          line-height: 1.25;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
          color: #FFFFFF !important;
        }
        .hospital-hero-title-accent {
          background: linear-gradient(90deg, #34D399 0%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        .hospital-hero-desc {
          font-size: clamp(14.5px, 1.6vw, 17px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.9);
          max-width: 680px;
          margin: 0 auto 30px;
        }
        .hospital-hero-cta-btn {
          background: #00B875;
          color: white;
          padding: 13px 30px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 15.5px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 20px rgba(0, 184, 117, 0.35);
          transition: all 0.25s ease;
          border: 1px solid #34D399;
        }
        .hospital-hero-cta-btn:hover {
          background: #059669;
          color: white;
          transform: translateY(-2px);
        }
        .hospital-hero-secondary-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          padding: 13px 26px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 15px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          transition: all 0.25s ease;
        }
        .hospital-hero-trust-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          font-size: 13px;
          color: #A7F3D0;
          font-weight: 600;
          flex-wrap: wrap;
        }

        /* Trust Bar */
        .hospital-trust-bar {
          margin-top: -32px;
          position: relative;
          z-index: 10;
        }
        .hospital-trust-card {
          background: white;
          border-radius: 18px;
          padding: 18px 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 16px;
        }
        .hospital-stat-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .hospital-stat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hospital-stat-val {
          font-size: 20px;
          font-weight: 950;
          color: #0F172A;
          line-height: 1.1;
        }
        .hospital-stat-lbl {
          font-size: 12px;
          color: #64748B;
          font-weight: 700;
        }

        /* Service Cards (Compact Bento) */
        .hospital-services-section {
          padding: 60px 0 50px;
        }
        .hospital-service-card {
          background: white;
          border-radius: 20px;
          padding: 24px 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.25s ease;
        }
        .hospital-service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 184, 117, 0.1);
          border-color: #A7F3D0;
        }
        .hospital-service-icon-box {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hospital-service-title {
          font-size: 17px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .hospital-service-desc {
          font-size: 13.5px;
          color: #64748B;
          line-height: 1.55;
          margin-bottom: 14px;
        }
        .hospital-service-tags {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .hospital-service-tag-pill {
          font-size: 11.5px;
          font-weight: 750;
          padding: 4px 10px;
          border-radius: 99px;
          background: #F8FAFC;
          color: #475569;
          border: 1px solid #E2E8F0;
        }

        /* Tabs Showcase */
        .hospital-tab-section {
          padding: 55px 0;
          background: white;
          border-top: 1px solid #E2E8F0;
          border-bottom: 1px solid #E2E8F0;
        }
        .hospital-tab-nav {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #F1F5F9;
          padding: 5px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          width: fit-content;
          max-width: 100%;
        }
        .hospital-tab-btn {
          padding: 10px 18px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #475569;
          font-weight: 800;
          font-size: 13.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .hospital-tab-btn.active {
          background: #00B875;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 184, 117, 0.25);
        }
        .hospital-tab-box {
          background: #F8FAFC;
          border-radius: 24px;
          border: 1px solid #E2E8F0;
          padding: clamp(20px, 3.5vw, 36px);
        }
        .hospital-tab-content-title {
          font-size: clamp(19px, 2.2vw, 25px);
          font-weight: 950;
          color: #0F172A;
          margin-bottom: 10px;
        }
        .hospital-tab-content-desc {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 18px;
        }
        .hospital-mockup-card {
          border-radius: 18px;
          padding: 22px 18px;
          color: white;
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
        }

        /* Steps Section */
        .hospital-steps-section {
          padding: 60px 0 50px;
        }
        .hospital-step-card {
          background: white;
          border-radius: 18px;
          padding: 22px 18px;
          border: 1px solid #E2E8F0;
          height: 100%;
        }
        .hospital-step-num {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #00B875;
          color: white;
          font-size: 18px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          box-shadow: 0 4px 12px rgba(0, 184, 117, 0.25);
        }
        .hospital-step-title {
          font-size: 16px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 6px;
        }
        .hospital-step-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.5;
          margin: 0;
        }

        /* Security Section (Soft Mint Clean Card) */
        .hospital-security-section {
          padding: 45px 0;
          background: #F8FAFC;
        }
        .hospital-security-card {
          background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 50%, #E6FFFA 100%);
          border: 1.5px solid #A7F3D0;
          border-radius: 22px;
          padding: clamp(20px, 3.5vw, 34px);
          box-shadow: 0 8px 24px rgba(0, 184, 117, 0.06);
        }
        .hospital-security-inner {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .hospital-lock-icon-box {
          width: 62px;
          height: 62px;
          border-radius: 18px;
          background: #FFFFFF;
          color: #00B875;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #34D399;
          box-shadow: 0 6px 16px rgba(0, 184, 117, 0.12);
          flex-shrink: 0;
        }
        .hospital-security-title {
          font-size: clamp(18px, 2.2vw, 22px);
          font-weight: 950;
          margin-bottom: 8px;
          color: #064E3B;
        }
        .hospital-security-desc {
          color: #334155;
          font-size: 13.5px;
          line-height: 1.55;
          margin: 0 0 12px 0;
        }
        .hospital-security-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .hospital-security-pill {
          background: #FFFFFF;
          border: 1px solid #A7F3D0;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 750;
          color: #065F46;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        /* FAQ Section */
        .hospital-faq-section {
          padding: 55px 0;
        }
        .hospital-faq-btn {
          width: 100%;
          padding: 14px 20px;
          background: transparent;
          border: none;
          text-align: left;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          cursor: pointer;
        }
        .hospital-faq-q-badge {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .hospital-faq-question {
          font-weight: 700;
          font-size: 15px;
          line-height: 1.35;
          flex: 1;
        }
        .hospital-faq-answer {
          padding: 0 20px 16px;
        }
        .hospital-faq-answer p {
          margin: 0;
          color: #475569;
          font-size: 13.5px;
          line-height: 1.55;
        }

        /* Bottom CTA */
        .hospital-bottom-cta {
          padding: 70px 0;
          background: linear-gradient(145deg, #022C22 0%, #064E3B 100%);
          color: white;
          text-align: center;
        }
        .hospital-bottom-cta-title {
          font-weight: 950 !important;
          font-size: clamp(22px, 3.2vw, 34px);
          margin-bottom: 10px;
          color: white;
        }
        .hospital-bottom-cta-desc {
          color: rgba(255, 255, 255, 0.85);
          font-size: 15px;
          max-width: 580px;
          margin: 0 auto 26px;
        }

        /* ── RESPONSIVE MOBILE TWEAKS (max-width: 768px) ── */
        @media (max-width: 768px) {
          .hospital-hero-section {
            padding: 95px 0 45px !important;
          }
          .hospital-hero-title {
            font-size: 25px !important;
          }
          .hospital-hero-desc {
            font-size: 13px !important;
            margin-bottom: 20px !important;
          }
          .hospital-hero-cta-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .hospital-hero-secondary-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .hospital-hero-trust-row {
            flex-direction: column !important;
            gap: 6px !important;
            font-size: 11.5px !important;
          }
          .hospital-trust-card {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            padding: 10px !important;
          }
          .hospital-stat-item {
            padding: 8px !important;
            background: #F8FAFC !important;
            border-radius: 10px !important;
          }
          .hospital-stat-val {
            font-size: 16px !important;
          }
          .hospital-stat-lbl {
            font-size: 10.5px !important;
          }
          .hospital-services-section {
            padding: 30px 0 !important;
          }
          .hospital-service-card {
            padding: 16px !important;
          }
          .hospital-tab-section {
            padding: 30px 0 !important;
          }
          .hospital-tab-nav {
            overflow-x: auto !important;
            justify-content: flex-start !important;
            scrollbar-width: none !important;
          }
          .hospital-tab-box {
            padding: 16px 12px !important;
          }
          .hospital-steps-section {
            padding: 30px 0 !important;
          }
          .hospital-security-section {
            padding: 22px 0 !important;
          }
          .hospital-security-card {
            padding: 18px 12px !important;
            text-align: center !important;
          }
          .hospital-security-inner {
            flex-direction: column !important;
            align-items: center !important;
            gap: 12px !important;
          }
          .hospital-security-badges {
            justify-content: center !important;
          }
          .hospital-bottom-cta {
            padding: 40px 0 85px !important;
          }
        }
      `}</style>

      {/* ── 1. HERO SECTION ── */}
      <section className="hospital-hero-section">
        <div className="hospital-hero-grid" />
        <div className="hospital-hero-glow-1" />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="justify-content-center text-center">
            <Col lg={10} md={12}>
              <div className="hospital-hero-badge">
                <Sparkles size={14} color="#34D399" />
                <span>হাসপাতাল ও ক্লিনিকের স্মার্ট ওপিডি ইকোসিস্টেম</span>
              </div>

              <h1 className="hospital-hero-title">
                হাসপাতালের ওপিডি ও কনসালট্যান্ট ম্যানেজমেন্ট <br />
                <span className="hospital-hero-title-accent">সম্পূর্ণ স্বয়ংক্রিয় ও পেপারলেস</span>
              </h1>

              <p className="hospital-hero-desc">
                মাল্টি-ডিপার্টমেন্ট ডাক্তার রোস্টার, লাউঞ্জে স্মার্ট টিভি কিউ ডিসপ্লে, ফ্রন্টডেস্ক ক্যাশ ট্র্যাকিং এবং ডিজিটাল ব্র্যান্ডিং—সবকিছু একটি কেন্দ্রীয় পোর্টালে।
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
                <Link to="/register/hospital" className="hospital-hero-cta-btn">
                  <Building2 size={17} />
                  <span>হাসপাতাল পার্টনার হোন (ফ্রি)</span>
                  <ArrowRight size={16} />
                </Link>

                <Link to="/login/hospital" className="hospital-hero-secondary-btn">
                  <Laptop size={16} />
                  <span>হাসপাতাল প্যানেল লগইন</span>
                </Link>
              </div>

              <div className="hospital-hero-trust-row">
                <span><CheckCircle2 size={14} color="#34D399" /> কোনো হার্ডওয়্যার খরচ নেই</span>
                <span><CheckCircle2 size={14} color="#34D399" /> মাল্টি-অপারেটর কাউন্টার</span>
                <span><CheckCircle2 size={14} color="#34D399" /> ২৪/৭ ডেডিকেটেড ম্যানেজার সাপোর্ট</span>
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
              <Building2 size={18} />
            </div>
            <div>
              <div className="hospital-stat-val">২৫০+</div>
              <div className="hospital-stat-lbl">হাসপাতাল ও ক্লিনিক</div>
            </div>
          </div>

          <div className="hospital-stat-item">
            <div className="hospital-stat-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Users size={18} />
            </div>
            <div>
              <div className="hospital-stat-val">১২,০০০+</div>
              <div className="hospital-stat-lbl">দৈনিক ওপিডি রোগী</div>
            </div>
          </div>

          <div className="hospital-stat-item">
            <div className="hospital-stat-icon-wrap" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <Tv size={18} />
            </div>
            <div>
              <div className="hospital-stat-val">১,২০০+</div>
              <div className="hospital-stat-lbl">সক্রিয় লাউঞ্জ টিভি কিউ</div>
            </div>
          </div>

          <div className="hospital-stat-item">
            <div className="hospital-stat-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Award size={18} />
            </div>
            <div>
              <div className="hospital-stat-val">৯৯.৯%</div>
              <div className="hospital-stat-lbl">আপটাইম নির্ভরযোগ্যতা</div>
            </div>
          </div>
        </div>
      </Container>

      {/* ── 3. CORE SERVICES GRID (Compact Bento Style) ── */}
      <section className="hospital-services-section">
        <Container>
          <div className="text-center mb-4">
            <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 32px)', fontWeight: 950, color: '#0F172A', marginBottom: '8px' }}>
              হাসপাতালের জন্য আধুনিক সুবিধা
            </h2>
            <p style={{ color: '#64748B', fontSize: '14.5px', maxWidth: '520px', margin: '0 auto' }}>
              রোগীদের সন্তুষ্টি বৃদ্ধি ও হাসপাতালের ফ্রন্টডেস্ক অপারেশনের গতি বাড়াতে সেরা টুলস।
            </p>
          </div>

          <Row className="g-3">
            {hospitalServices.map((service) => (
              <Col lg={4} md={6} sm={12} key={service.id}>
                <div className="hospital-service-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div className="hospital-service-icon-box" style={{ background: service.bg, color: service.color, border: `1px solid ${service.border}` }}>
                        {service.icon}
                      </div>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 800, 
                        color: service.color, 
                        background: service.bg, 
                        padding: '3px 10px', 
                        borderRadius: '99px',
                        border: `1px solid ${service.border}`
                      }}>
                        {service.badge}
                      </span>
                    </div>

                    <h3 className="hospital-service-title">{service.title}</h3>
                    <p className="hospital-service-desc">{service.desc}</p>
                  </div>

                  <div className="hospital-service-tags">
                    {service.tags.map((tag, idx) => (
                      <span key={idx} className="hospital-service-tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── 4. INTERACTIVE TAB SHOWCASE ── */}
      <section className="hospital-tab-section">
        <Container>
          <div className="text-center mb-3">
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 30px)', fontWeight: 950, color: '#0F172A', marginBottom: '6px' }}>
              সিস্টেম কীভাবে কাজ করে?
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>
              হাসপাতালের মূল ওপিডি মডিউলগুলো পরীক্ষা করে দেখুন।
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <div className="hospital-tab-nav">
              <button 
                className={`hospital-tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
                onClick={() => setActiveTab('roster')}
              >
                <Users size={15} />
                <span>ওপিডি রোস্টার</span>
              </button>

              <button 
                className={`hospital-tab-btn ${activeTab === 'display' ? 'active' : ''}`}
                onClick={() => setActiveTab('display')}
              >
                <Tv size={15} />
                <span>টিভি কিউ</span>
              </button>

              <button 
                className={`hospital-tab-btn ${activeTab === 'frontdesk' ? 'active' : ''}`}
                onClick={() => setActiveTab('frontdesk')}
              >
                <UserCheck size={15} />
                <span>ফ্রন্টডেস্ক</span>
              </button>

              <button 
                className={`hospital-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <TrendingUp size={15} />
                <span>অ্যানালিটিক্স</span>
              </button>
            </div>
          </div>

          <div className="hospital-tab-box">
            <Row className="align-items-center g-4">
              <Col lg={7} md={12}>
                <span style={{ 
                  color: tabShowcases[activeTab].badgeColor, 
                  fontSize: '12.5px', 
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}>
                  {tabShowcases[activeTab].tag}
                </span>

                <h3 className="hospital-tab-content-title">
                  {tabShowcases[activeTab].title}
                </h3>

                <p className="hospital-tab-content-desc">
                  {tabShowcases[activeTab].desc}
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
                  {tabShowcases[activeTab].tags.map((tag, idx) => (
                    <span key={idx} style={{ 
                      background: 'white', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '99px', 
                      padding: '5px 12px', 
                      fontSize: '12.5px', 
                      fontWeight: 700, 
                      color: '#334155',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Check size={13} color={tabShowcases[activeTab].badgeColor} strokeWidth={3} />
                      {tag}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link to="/register/hospital" style={{ 
                    background: tabShowcases[activeTab].badgeColor,
                    color: 'white',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>যুক্ত হোন (ফ্রি)</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </Col>

              <Col lg={5} md={12}>
                <div className="hospital-mockup-card" style={{ background: tabShowcases[activeTab].mockupBg }}>
                  <div style={{ fontSize: '11.5px', color: '#A7F3D0', fontWeight: 800, marginBottom: '4px' }}>
                    {tabShowcases[activeTab].mockupTitle}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 900, marginBottom: '12px' }}>
                    {tabShowcases[activeTab].mockupSub}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 950, color: '#38BDF8' }}>
                      {tabShowcases[activeTab].mockupValue}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* ── 5. HOW IT WORKS (3 SIMPLE STEPS) ── */}
      <section className="hospital-steps-section">
        <Container>
          <div className="text-center mb-4">
            <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 950, color: '#0F172A', marginBottom: '6px' }}>
              সহজ ৩টি ধাপে শুরু করুন
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>খুব সহজেই হাসপাতালের আধুনিক ওপিডি ও কিউ বোর্ড চালুকরণ।</p>
          </div>

          <Row className="g-3">
            {steps.map((st, idx) => (
              <Col lg={4} md={6} sm={12} key={idx}>
                <div className="hospital-step-card">
                  <div className="hospital-step-num">{st.num}</div>
                  <h3 className="hospital-step-title">{st.title}</h3>
                  <p className="hospital-step-desc">{st.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── 6. DATA SECURITY (Soft Mint Clean Card) ── */}
      <section className="hospital-security-section">
        <Container>
          <div className="hospital-security-card">
            <div className="hospital-security-inner">
              <div className="hospital-lock-icon-box">
                <ShieldCheck size={32} strokeWidth={2.2} />
              </div>

              <div style={{ flex: 1 }}>
                <h3 className="hospital-security-title">
                  হাসপাতাল ও রোগীর তথ্যের আন্তর্জাতিক নিরাপত্তা
                </h3>
                <p className="hospital-security-desc">
                  আপনার হাসপাতালের আর্থিক কালেকশন ও মেডিকেল তথ্য আন্তর্জাতিক হেলথকেয়ার স্ট্যান্ডার্ড এবং ২৫৬-বিট এনক্রিপশনে সম্পূর্ণ সুরক্ষিত।
                </p>

                <div className="hospital-security-badges">
                  <span className="hospital-security-pill">
                    <CheckCircle2 size={13} color="#00B875" />
                    <span>২৫৬-বিট SSL</span>
                  </span>
                  <span className="hospital-security-pill">
                    <CheckCircle2 size={13} color="#00B875" />
                    <span>এনক্রিপ্টেড ক্লাউড</span>
                  </span>
                  <span className="hospital-security-pill">
                    <CheckCircle2 size={13} color="#00B875" />
                    <span>৯৯.৯% নিরবচ্ছিন্ন ব্যাকআপ</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 7. HOSPITAL FAQS (4 Direct Questions) ── */}
      <section className="hospital-faq-section">
        <Container>
          <div className="text-center mb-4">
            <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 950, color: '#0F172A', marginBottom: '6px' }}>
              সচরাচর জিজ্ঞাসা
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>হাসপাতাল ম্যানেজমেন্টের সাধারণ প্রশ্নের দ্রুত ও পরিষ্কার উত্তর।</p>
          </div>

          <Row className="justify-content-center">
            <Col lg={8} md={10}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx
                  return (
                    <div 
                      key={idx}
                      style={{ 
                        background: 'white',
                        borderRadius: '14px',
                        border: isOpen ? '1.5px solid #00B875' : '1px solid #E2E8F0',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <button 
                        className="hospital-faq-btn"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                      >
                        <span 
                          className="hospital-faq-q-badge"
                          style={{ 
                            background: isOpen ? '#00B875' : '#F1F5F9',
                            color: isOpen ? 'white' : '#64748B'
                          }}
                        >
                          ?
                        </span>
                        <span 
                          className="hospital-faq-question"
                          style={{ color: isOpen ? '#00B875' : '#0F172A' }}
                        >
                          {faq.q}
                        </span>
                        {isOpen ? <ChevronUp size={16} color="#00B875" /> : <ChevronDown size={16} color="#94A3B8" />}
                      </button>

                      {isOpen && (
                        <div className="hospital-faq-answer">
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

      {/* ── 8. BOTTOM CTA BANNER ── */}
      <section className="hospital-bottom-cta">
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="hospital-bottom-cta-title">
            আজই আপনার হাসপাতালকে যুক্ত করুন Doctor Booklet-এ
          </h2>
          <p className="hospital-bottom-cta-desc">
            মাত্র ২ মিনিটে পার্টনারশিপ শুরু করুন এবং ওপিডি রোগীব্যবস্থাপনায় নিয়ে আসুন সর্বোচ্চ সন্তুষ্টি।
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register/hospital" className="hospital-hero-cta-btn">
              <Building2 size={17} />
              <span>বিনামূল্যে পার্টনার হোন</span>
              <ArrowRight size={16} />
            </Link>

            <Link to="/login/hospital" className="hospital-hero-secondary-btn">
              <Laptop size={16} />
              <span>লগইন করুন</span>
            </Link>
          </div>
        </Container>
      </section>

    </div>
  )
}

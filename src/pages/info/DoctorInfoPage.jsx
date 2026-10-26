import React, { useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { 
  Stethoscope, Calendar, Clock, Tv, FileText, Users, 
  ShieldCheck, ArrowRight, Sparkles, TrendingUp, CheckCircle2,
  Laptop, ChevronDown, ChevronUp, Activity, 
  Award, Database, Shield, Check, Plus, Minus
} from 'lucide-react'

export default function DoctorInfoPage() {
  const [activeTab, setActiveTab] = useState('chamber')
  const [openFaq, setOpenFaq] = useState(0)

  // 6 Core Doctor Benefits (Short, punchy & non-repetitive)
  const doctorServices = [
    {
      id: 'chamber',
      icon: <Calendar size={24} />,
      badge: 'চেম্বার কন্ট্রোল',
      title: 'মাল্টি-চেম্বার ও শিফট ম্যানেজমেন্ট',
      desc: 'একাধিক প্রাইভেট চেম্বার ও হাসপাতালের প্র্যাকটিস সময়সূচী একই ড্যাশবোর্ড থেকে নিয়ন্ত্রণ করুন।',
      tags: ['🕒 শিফট স্লট তৈরি', '👥 অ্যাসিস্ট্যান্ট এক্সেস'],
      color: '#00B875',
      bg: '#F0FDF4',
      border: '#DCFCE7'
    },
    {
      id: 'display',
      icon: <Tv size={24} />,
      badge: 'স্মার্ট কিউ',
      title: 'চেম্বার স্মার্ট টিভি ডিসপ্লে বোর্ড',
      desc: 'ওয়েটিং রুমে বাড়তি ডিভাইস ছাড়াই যেকোনো স্মার্ট টিভিতে লাইভ সিরিয়াল ও ডাক নম্বর প্রদর্শন করুন।',
      tags: ['📺 যেকোনো টিভিতে চলে', '🔔 এক ক্লিকে রোগী কল'],
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#DBEAFE'
    },
    {
      id: 'prescription',
      icon: <FileText size={24} />,
      badge: 'ই-প্রেসক্রিপশন',
      title: 'ডিজিটাল প্রেসক্রিপশন বিল্ডার',
      desc: '৫০,০০০+ ঔষধের ড্রপডাউন ডাটাবেজ সহ মাত্র ২ মিনিটে নির্ভুল ও ব্র্যান্ডেড প্রেসক্রিপশন দিন।',
      tags: ['💊 ড্রাগ ডাটাবেজ', '🖨️ নিজস্ব প্যাডে প্রিন্ট'],
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#EDE9FE'
    },
    {
      id: 'records',
      icon: <Database size={24} />,
      badge: 'মেডিকেল ক্লাউড',
      title: 'রোগীর আজীবন হিস্ট্রি ও রিপোর্ট',
      desc: 'রোগীর বিগত প্রেসক্রিপশন ও টেস্ট রেজাল্ট এক ক্লিকেই চোখের সামনে পেয়ে যান।',
      tags: ['📁 অতীত ভিজিট রেকর্ড', '🔒 নিশ্ছিদ্র গোপনীয়তা'],
      color: '#0D9488',
      bg: '#F0FDFA',
      border: '#CCFBF1'
    },
    {
      id: 'growth',
      icon: <TrendingUp size={24} />,
      badge: 'ডিজিটাল উপস্থিতি',
      title: 'ভেরিফাইড প্রোফাইল ও রোগী বৃদ্ধি',
      desc: 'বিএমডিসি ভেরিফাইড প্রোফাইল ও লোকাল সার্চের মাধ্যমে নতুন রোগীদের কাছে সহজেই পৌঁছান।',
      tags: ['🩺 BMDC ভেরিফাইড', '⭐ পেশেন্ট রিভিউ'],
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FEF3C7'
    },
    {
      id: 'analytics',
      icon: <Activity size={24} />,
      badge: 'অ্যানালিটিক্স',
      title: 'প্র্যাকটিস ও আয় ট্র্যাকার',
      desc: 'দৈনিক রোগী সংখ্যা ও ফি কালেকশনের স্বচ্ছ হিসাব এবং এক্সেল/পিডিএফ স্টেটমেন্ট ডাউনলোড।',
      tags: ['📊 ভিজিট ও ফি রিপোর্ট', '📑 ক্যাশ রিকনসিলিয়েশন'],
      color: '#E11D48',
      bg: '#FFF1F2',
      border: '#FFE4E6'
    }
  ]

  // Interactive Tab Showcase Data (Concise)
  const tabShowcases = {
    chamber: {
      tag: 'চেম্বার ম্যানেজমেন্ট',
      title: 'সব চেম্বারের শিডিউল এক নজরে',
      desc: 'হাসপাতালের কনসালটেন্সি বা নিজস্ব চেম্বারের সময়সূচী ও সর্বোচ্চ রোগী লিমিট নির্ধারণ করুন সহজে। প্রয়োজনে এক ক্লিকে ছুটি ঘোষণা ও এসএমএস দিন।',
      tags: ['মাল্টি-লোকেশন স্লট', 'সহকারী অপারেটর রোল', 'অটো এসএমএস নোটিফিকেশন'],
      badgeColor: '#00B875',
      mockupBg: '#064E3B',
      mockupTitle: 'চেম্বার ড্যাশবোর্ড',
      mockupSub: 'ধানমন্ডি চেম্বার (বিকাল ৫:০০ - রাত ৯:০০)',
      mockupValue: 'মোট রোগী: ২৫ জন'
    },
    display: {
      tag: 'স্মার্ট টিভি কিউ',
      title: 'ওয়েটিং রুমে ডিজিটাল শৃঙ্খলা',
      desc: 'রোগী ডাকার সাথে সাথে স্মার্ট টিভি পর্দায় শব্দ সহ সিরিয়াল নম্বর ভেসে উঠবে। দরজায় বারবার নক করার ঝামেলা চিরতরে বন্ধ।',
      tags: ['কোনো অ্যাপ ইন্সটল ছাড়াই টিভিতে চলে', 'ভয়েস ও অডিও কল অ্যালার্ট', 'মোবাইলেও লাইভ কিউ'],
      badgeColor: '#2563EB',
      mockupBg: '#1E3A8A',
      mockupTitle: 'টিভি ডিসপ্লে বোর্ড',
      mockupSub: 'পরবর্তী রোগী কল: #১২',
      mockupValue: 'বর্তমান রোগী: #১১'
    },
    prescription: {
      tag: 'ডিজিটাল প্রেসক্রিপশন',
      title: 'প্রেসক্রিপশন লিখুন দ্বিগুণ গতিতে',
      desc: '৫০ হাজার দেশি-বিদেশি ওষুধের তালিকা ড্রপডাউনে থাকায় দ্রুত সিলেক্ট করা যায় এবং রোগীর হোয়াটসঅ্যাপে ইনস্ট্যান্ট কপি পাঠানো যায়।',
      tags: ['অফিসিয়াল লেটারহেড প্রিন্ট', 'কমন ডোজ টেমপ্লেট', 'রোগীর ফোনে এসএমএস কপি'],
      badgeColor: '#7C3AED',
      mockupBg: '#4C1D95',
      mockupTitle: 'স্মার্ট ই-প্রেসক্রিপশন',
      mockupSub: 'Rx বিল্ডার সক্রিয়',
      mockupValue: '২ মিনিটে প্রস্তুত'
    },
    records: {
      tag: 'পেশেন্ট হিস্ট্রি',
      title: 'রোগীর ফাইল আর হারাবে না',
      desc: 'রোগীর ফোন নম্বর দিলেই বিগত ভিজিটের ঔষধ তালিকা ও টেস্ট রিপোর্ট চোখের সামনে চলে আসবে। ডায়াগনোসিস হবে আরও দ্রুত।',
      tags: ['ফোন নম্বরে সার্চ', 'পুরোনো রিপোর্ট ভিউ', 'আন্তর্জাতিক ডেটা সিকিউরিটি'],
      badgeColor: '#0D9488',
      mockupBg: '#134E4A',
      mockupTitle: 'পেশেন্ট ক্লাউড ভল্ট',
      mockupSub: 'সম্পূর্ণ পূর্ব ইতিহাস সংরক্ষিত',
      mockupValue: '২৫৬-বিট এনক্রিপ্ট'
    }
  }

  // 3 Simple Steps
  const steps = [
    {
      num: '১',
      title: 'ফ্রি রেজিস্ট্রেশন করুন',
      desc: 'আপনার মোবাইল নম্বর ও সাধারণ তথ্য দিয়ে অ্যাকাউন্ট খুলুন।'
    },
    {
      num: '২',
      title: 'ডিগ্রি ও চেম্বার যুক্ত করুন',
      desc: 'BMDC নম্বর, ডিগ্রিসমূহ ও চেম্বারের সময়সূচী নির্ধারণ করুন।'
    },
    {
      num: '৩',
      title: 'ভেরিফিকেশন ও রোগী গ্রহণ',
      desc: 'দ্রুত ভেরিফিকেশনের পর রোগীরা সরাসরি সিরিয়াল বুক করা শুরু করবে।'
    }
  ]

  // Direct, 1-2 line FAQs
  const faqs = [
    {
      q: 'Doctor Booklet-এ ডাক্তার হিসেবে রেজিস্ট্রেশন করতে কি কোনো ফি লাগে?',
      a: 'না, ডাক্তারদের জন্য রেজিস্ট্রেশন সম্পূর্ণ বিনামূল্যে। কোনো প্রকার হিডেন বা সাইন-আপ চার্জ নেই।'
    },
    {
      q: 'আমার চেম্বারের সহকারী কি এই সিস্টেম ব্যবহার করতে পারবে?',
      a: 'হ্যাঁ, সহকারীর জন্য আলাদা সুরক্ষিত অপারেটর অ্যাকাউন্ট রয়েছে। তিনি সিরিয়াল এন্ট্রি ও টিভি ডিসপ্লে অপারেট করতে পারবেন কিন্তু গোপনীয় তথ্য দেখতে পারবেন না।'
    },
    {
      q: 'একাধিক চেম্বার বা হাসপাতাল কি একসাথে চালানো সম্ভব?',
      a: 'হ্যাঁ, Doctor Booklet মাল্টি-চেম্বার সাপোর্ট করে। প্রতিটি চেম্বারের জন্য আলাদা দিন, সময় ও ফি কনফিগার করতে পারবেন।'
    },
    {
      q: 'স্মার্ট টিভি ডিসপ্লে বোর্ডের জন্য কি কোনো ডিভাইস কিনতে হবে?',
      a: 'একেবারেই না। চেম্বারে থাকা যেকোনো সাধারণ স্মার্ট টিভি বা ল্যাপটপের ব্রাউজারে একটি লিংক ওপেন করলেই ফুল-স্ক্রিন ডিসপ্লে চালু হয়ে যাবে।'
    }
  ]

  return (
    <div className="doctor-info-page" style={{ background: '#F8FAFC', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ── RESPONSIVE COMPACT STYLING ── */}
      <style>{`
        .doctor-hero-section {
          position: relative;
          background: linear-gradient(145deg, #022C22 0%, #064E3B 45%, #0B3B32 100%);
          padding: 120px 0 75px;
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
        .doctor-hero-badge {
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
        .doctor-hero-title {
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 950;
          line-height: 1.25;
          margin-bottom: 16px;
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
          font-size: clamp(14.5px, 1.6vw, 17px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.9);
          max-width: 680px;
          margin: 0 auto 30px;
        }
        .doctor-hero-cta-btn {
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
        .doctor-hero-cta-btn:hover {
          background: #059669;
          color: white;
          transform: translateY(-2px);
        }
        .doctor-hero-secondary-btn {
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
        .doctor-hero-trust-row {
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
        .doctor-trust-bar {
          margin-top: -32px;
          position: relative;
          z-index: 10;
        }
        .doctor-trust-card {
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
        .doctor-stat-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .doctor-stat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .doctor-stat-val {
          font-size: 20px;
          font-weight: 950;
          color: #0F172A;
          line-height: 1.1;
        }
        .doctor-stat-lbl {
          font-size: 12px;
          color: #64748B;
          font-weight: 700;
        }

        /* Service Cards (Compact Bento) */
        .doctor-services-section {
          padding: 60px 0 50px;
        }
        .doctor-service-card {
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
        .doctor-service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 184, 117, 0.1);
          border-color: #A7F3D0;
        }
        .doctor-service-icon-box {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .doctor-service-title {
          font-size: 17px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .doctor-service-desc {
          font-size: 13.5px;
          color: #64748B;
          line-height: 1.55;
          margin-bottom: 14px;
        }
        .doctor-service-tags {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .doctor-service-tag-pill {
          font-size: 11.5px;
          font-weight: 750;
          padding: 4px 10px;
          border-radius: 99px;
          background: #F8FAFC;
          color: #475569;
          border: 1px solid #E2E8F0;
        }

        /* Tabs Showcase */
        .doctor-tab-section {
          padding: 55px 0;
          background: white;
          border-top: 1px solid #E2E8F0;
          border-bottom: 1px solid #E2E8F0;
        }
        .doctor-tab-nav {
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
        .doctor-tab-btn {
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
        .doctor-tab-btn.active {
          background: #00B875;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 184, 117, 0.25);
        }
        .doctor-tab-box {
          background: #F8FAFC;
          border-radius: 24px;
          border: 1px solid #E2E8F0;
          padding: clamp(20px, 3.5vw, 36px);
        }
        .doctor-tab-content-title {
          font-size: clamp(19px, 2.2vw, 25px);
          font-weight: 950;
          color: #0F172A;
          margin-bottom: 10px;
        }
        .doctor-tab-content-desc {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 18px;
        }
        .doctor-mockup-card {
          border-radius: 18px;
          padding: 22px 18px;
          color: white;
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
        }

        /* Steps Section */
        .doctor-steps-section {
          padding: 60px 0 50px;
        }
        .doctor-step-card {
          background: white;
          border-radius: 18px;
          padding: 22px 18px;
          border: 1px solid #E2E8F0;
          height: 100%;
        }
        .doctor-step-num {
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
        .doctor-step-title {
          font-size: 16px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 6px;
        }
        .doctor-step-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.5;
          margin: 0;
        }

        /* Security Section (Soft Mint Clean Card) */
        .doctor-security-section {
          padding: 45px 0;
          background: #F8FAFC;
        }
        .doctor-security-card {
          background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 50%, #E6FFFA 100%);
          border: 1.5px solid #A7F3D0;
          border-radius: 22px;
          padding: clamp(20px, 3.5vw, 34px);
          box-shadow: 0 8px 24px rgba(0, 184, 117, 0.06);
        }
        .doctor-security-inner {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .doctor-lock-icon-box {
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
        .doctor-security-title {
          font-size: clamp(18px, 2.2vw, 22px);
          font-weight: 950;
          margin-bottom: 8px;
          color: #064E3B;
        }
        .doctor-security-desc {
          color: #334155;
          font-size: 13.5px;
          line-height: 1.55;
          margin: 0 0 12px 0;
        }
        .doctor-security-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .doctor-security-pill {
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
        .doctor-faq-section {
          padding: 55px 0;
        }
        .doctor-faq-btn {
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
        .doctor-faq-q-badge {
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
        .doctor-faq-question {
          font-weight: 700;
          font-size: 15px;
          line-height: 1.35;
          flex: 1;
        }
        .doctor-faq-answer {
          padding: 0 20px 16px;
        }
        .doctor-faq-answer p {
          margin: 0;
          color: #475569;
          font-size: 13.5px;
          line-height: 1.55;
        }

        /* Bottom CTA */
        .doctor-bottom-cta {
          padding: 70px 0;
          background: linear-gradient(145deg, #022C22 0%, #064E3B 100%);
          color: white;
          text-align: center;
        }
        .doctor-bottom-cta-title {
          font-weight: 950 !important;
          font-size: clamp(22px, 3.2vw, 34px);
          margin-bottom: 10px;
          color: white;
        }
        .doctor-bottom-cta-desc {
          color: rgba(255, 255, 255, 0.85);
          font-size: 15px;
          max-width: 580px;
          margin: 0 auto 26px;
        }

        /* ── RESPONSIVE MOBILE TWEAKS (max-width: 768px) ── */
        @media (max-width: 768px) {
          .doctor-hero-section {
            padding: 95px 0 45px !important;
          }
          .doctor-hero-title {
            font-size: 25px !important;
          }
          .doctor-hero-desc {
            font-size: 13px !important;
            margin-bottom: 20px !important;
          }
          .doctor-hero-cta-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .doctor-hero-secondary-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .doctor-hero-trust-row {
            flex-direction: column !important;
            gap: 6px !important;
            font-size: 11.5px !important;
          }
          .doctor-trust-card {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            padding: 10px !important;
          }
          .doctor-stat-item {
            padding: 8px !important;
            background: #F8FAFC !important;
            border-radius: 10px !important;
          }
          .doctor-stat-val {
            font-size: 16px !important;
          }
          .doctor-stat-lbl {
            font-size: 10.5px !important;
          }
          .doctor-services-section {
            padding: 30px 0 !important;
          }
          .doctor-service-card {
            padding: 16px !important;
          }
          .doctor-tab-section {
            padding: 30px 0 !important;
          }
          .doctor-tab-nav {
            overflow-x: auto !important;
            justify-content: flex-start !important;
            scrollbar-width: none !important;
          }
          .doctor-tab-box {
            padding: 16px 12px !important;
          }
          .doctor-steps-section {
            padding: 30px 0 !important;
          }
          .doctor-security-section {
            padding: 22px 0 !important;
          }
          .doctor-security-card {
            padding: 18px 12px !important;
            text-align: center !important;
          }
          .doctor-security-inner {
            flex-direction: column !important;
            align-items: center !important;
            gap: 12px !important;
          }
          .doctor-security-badges {
            justify-content: center !important;
          }
          .doctor-bottom-cta {
            padding: 40px 0 85px !important;
          }
        }
      `}</style>

      {/* ── 1. HERO SECTION ── */}
      <section className="doctor-hero-section">
        <div className="doctor-hero-grid" />
        <div className="doctor-hero-glow-1" />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="justify-content-center text-center">
            <Col lg={10} md={12}>
              <div className="doctor-hero-badge">
                <Sparkles size={14} color="#34D399" />
                <span>চিকিৎসকদের জন্য স্মার্ট ডিজিটাল পোর্টাল</span>
              </div>

              <h1 className="doctor-hero-title">
                আপনার চিকিৎসা প্র্যাকটিসকে নিন <br />
                <span className="doctor-hero-title-accent">আধুনিক ডিজিটাল উচ্চতায়</span>
              </h1>

              <p className="doctor-hero-desc">
                চেম্বারের লাইভ সিরিয়াল ডিসপ্লে, ড্রপডাউন ড্রাগ ডাটাবেজ সহ ই-প্রেসক্রিপশন এবং সমন্বিত পেশেন্ট হিস্ট্রি—সবকিছু এখন একটি ড্যাশবোর্ডে।
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
                <Link to="/register/doctor" className="doctor-hero-cta-btn">
                  <Stethoscope size={17} />
                  <span>ডাক্তার হিসেবে যুক্ত হোন (ফ্রি)</span>
                  <ArrowRight size={16} />
                </Link>

                <Link to="/login/doctor" className="doctor-hero-secondary-btn">
                  <Laptop size={16} />
                  <span>ডাক্তার পোর্টাল লগইন</span>
                </Link>
              </div>

              <div className="doctor-hero-trust-row">
                <span><CheckCircle2 size={14} color="#34D399" /> কোনো সেটআপ ফি নেই</span>
                <span><CheckCircle2 size={14} color="#34D399" /> BMDC ভেরিফাইড প্রোফাইল</span>
                <span><CheckCircle2 size={14} color="#34D399" /> ২৪/৭ ডেডিকেটেড সাপোর্ট</span>
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
              <Stethoscope size={18} />
            </div>
            <div>
              <div className="doctor-stat-val">১,৫০০+</div>
              <div className="doctor-stat-lbl">রেজিস্টার্ড বিশেষজ্ঞ ডাক্তার</div>
            </div>
          </div>

          <div className="doctor-stat-item">
            <div className="doctor-stat-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Calendar size={18} />
            </div>
            <div>
              <div className="doctor-stat-val">২.৫ লাখ+</div>
              <div className="doctor-stat-lbl">সফল অ্যাপয়েন্টমেন্ট</div>
            </div>
          </div>

          <div className="doctor-stat-item">
            <div className="doctor-stat-icon-wrap" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <Tv size={18} />
            </div>
            <div>
              <div className="doctor-stat-val">৯৮%</div>
              <div className="doctor-stat-lbl">চেম্বার কিউ নিয়ন্ত্রণ</div>
            </div>
          </div>

          <div className="doctor-stat-item">
            <div className="doctor-stat-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Award size={18} />
            </div>
            <div>
              <div className="doctor-stat-val">২৪/৭</div>
              <div className="doctor-stat-lbl">ক্লিনিক্যাল সাপোর্ট</div>
            </div>
          </div>
        </div>
      </Container>

      {/* ── 3. CORE SERVICES GRID (Compact Bento Style) ── */}
      <section className="doctor-services-section">
        <Container>
          <div className="text-center mb-4">
            <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 32px)', fontWeight: 950, color: '#0F172A', marginBottom: '8px' }}>
              ডাক্তারদের জন্য মূল সুবিধাসমূহ
            </h2>
            <p style={{ color: '#64748B', fontSize: '14.5px', maxWidth: '520px', margin: '0 auto' }}>
              প্র্যাকটিস ম্যানেজমেন্টকে সহজ ও গতিময় করতে আধুনিক ডিজিটাল ফিচারস।
            </p>
          </div>

          <Row className="g-3">
            {doctorServices.map((service) => (
              <Col lg={4} md={6} sm={12} key={service.id}>
                <div className="doctor-service-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div className="doctor-service-icon-box" style={{ background: service.bg, color: service.color, border: `1px solid ${service.border}` }}>
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

                    <h3 className="doctor-service-title">{service.title}</h3>
                    <p className="doctor-service-desc">{service.desc}</p>
                  </div>

                  <div className="doctor-service-tags">
                    {service.tags.map((tag, idx) => (
                      <span key={idx} className="doctor-service-tag-pill">
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
      <section className="doctor-tab-section">
        <Container>
          <div className="text-center mb-3">
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 30px)', fontWeight: 950, color: '#0F172A', marginBottom: '6px' }}>
              সিস্টেম কীভাবে কাজ করে?
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>
              চেম্বারের মূল ফিচারগুলো এক ক্লিকে পরখ করে দেখুন।
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <div className="doctor-tab-nav">
              <button 
                className={`doctor-tab-btn ${activeTab === 'chamber' ? 'active' : ''}`}
                onClick={() => setActiveTab('chamber')}
              >
                <Calendar size={15} />
                <span>চেম্বার কন্ট্রোল</span>
              </button>

              <button 
                className={`doctor-tab-btn ${activeTab === 'display' ? 'active' : ''}`}
                onClick={() => setActiveTab('display')}
              >
                <Tv size={15} />
                <span>টিভি ডিসপ্লে</span>
              </button>

              <button 
                className={`doctor-tab-btn ${activeTab === 'prescription' ? 'active' : ''}`}
                onClick={() => setActiveTab('prescription')}
              >
                <FileText size={15} />
                <span>ই-প্রেসক্রিপশন</span>
              </button>

              <button 
                className={`doctor-tab-btn ${activeTab === 'records' ? 'active' : ''}`}
                onClick={() => setActiveTab('records')}
              >
                <Database size={15} />
                <span>পেশেন্ট রেকর্ড</span>
              </button>
            </div>
          </div>

          <div className="doctor-tab-box">
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

                <h3 className="doctor-tab-content-title">
                  {tabShowcases[activeTab].title}
                </h3>

                <p className="doctor-tab-content-desc">
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
                  <Link to="/register/doctor" style={{ 
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
                <div className="doctor-mockup-card" style={{ background: tabShowcases[activeTab].mockupBg }}>
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
      <section className="doctor-steps-section">
        <Container>
          <div className="text-center mb-4">
            <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 950, color: '#0F172A', marginBottom: '6px' }}>
              সহজ ৩টি ধাপে শুরু করুন
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>মাত্র ২ মিনিটেই আপনার স্মার্ট ডিজিটাল প্র্যাকটিস সেটআপ করুন।</p>
          </div>

          <Row className="g-3">
            {steps.map((st, idx) => (
              <Col lg={4} md={6} sm={12} key={idx}>
                <div className="doctor-step-card">
                  <div className="doctor-step-num">{st.num}</div>
                  <h3 className="doctor-step-title">{st.title}</h3>
                  <p className="doctor-step-desc">{st.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── 6. DATA SECURITY (Soft Mint Clean Card) ── */}
      <section className="doctor-security-section">
        <Container>
          <div className="doctor-security-card">
            <div className="doctor-security-inner">
              <div className="doctor-lock-icon-box">
                <ShieldCheck size={32} strokeWidth={2.2} />
              </div>

              <div style={{ flex: 1 }}>
                <h3 className="doctor-security-title">
                  চিকিৎসকের প্রেসক্রিপশন ও তথ্যের পূর্ণ নিরাপত্তা
                </h3>
                <p className="doctor-security-desc">
                  আপনার প্রেসক্রিপশন ও ক্লিনিক্যাল তথ্য আন্তর্জাতিক ডেটা স্ট্যান্ডার্ড এবং ২৫৬-বিট এসএসএল এনক্রিপশনে সুরক্ষিত। চিকিৎসকের অনুমতি ছাড়া তথ্য অপ্রাপ্য।
                </p>

                <div className="doctor-security-badges">
                  <span className="doctor-security-pill">
                    <CheckCircle2 size={13} color="#00B875" />
                    <span>২৫৬-বিট SSL</span>
                  </span>
                  <span className="doctor-security-pill">
                    <CheckCircle2 size={13} color="#00B875" />
                    <span>আন্তর্জাতিক ডেটা প্রটোকল</span>
                  </span>
                  <span className="doctor-security-pill">
                    <CheckCircle2 size={13} color="#00B875" />
                    <span>১০০% এনক্রিপ্টেড ব্যাকআপ</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 7. DOCTOR FAQS (4 Direct Questions) ── */}
      <section className="doctor-faq-section">
        <Container>
          <div className="text-center mb-4">
            <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 950, color: '#0F172A', marginBottom: '6px' }}>
              সচরাচর জিজ্ঞাসা
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>ডাক্তারদের সাধারণ প্রশ্নের দ্রুত ও পরিষ্কার উত্তর।</p>
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
                        className="doctor-faq-btn"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                      >
                        <span 
                          className="doctor-faq-q-badge"
                          style={{ 
                            background: isOpen ? '#00B875' : '#F1F5F9',
                            color: isOpen ? 'white' : '#64748B'
                          }}
                        >
                          ?
                        </span>
                        <span 
                          className="doctor-faq-question"
                          style={{ color: isOpen ? '#00B875' : '#0F172A' }}
                        >
                          {faq.q}
                        </span>
                        {isOpen ? <ChevronUp size={16} color="#00B875" /> : <ChevronDown size={16} color="#94A3B8" />}
                      </button>

                      {isOpen && (
                        <div className="doctor-faq-answer">
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
      <section className="doctor-bottom-cta">
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="doctor-bottom-cta-title">
            আজই যুক্ত হোন Doctor Booklet চিকিৎসক পরিবারে
          </h2>
          <p className="doctor-bottom-cta-desc">
            মাত্র ২ মিনিটে বিনামূল্যে আপনার প্রোফাইল তৈরি করুন এবং চেম্বার প্র্যাকটিসে আনুন আধুনিক ডিজিটাল গতি।
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register/doctor" className="doctor-hero-cta-btn">
              <Stethoscope size={17} />
              <span>বিনামূল্যে রেজিস্টার করুন</span>
              <ArrowRight size={16} />
            </Link>

            <Link to="/login/doctor" className="doctor-hero-secondary-btn">
              <Laptop size={16} />
              <span>লগইন করুন</span>
            </Link>
          </div>
        </Container>
      </section>

    </div>
  )
}

import React, { useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { 
  Users, Calendar, Clock, FileText, 
  ShieldCheck, ArrowRight, Sparkles, CheckCircle2,
  Laptop, ChevronDown, ChevronUp,
  MapPin, HeartPulse, Check,
  Stethoscope, Building2, Zap
} from 'lucide-react'

export default function PatientInfoPage() {
  const [activeTab, setActiveTab] = useState('booking')
  const [openFaq, setOpenFaq] = useState(0)

  // 6 Core Patient Benefits (Short, punchy & non-repetitive)
  const patientServices = [
    {
      id: 'booking',
      icon: <Calendar size={24} />,
      badge: 'সহজ সিরিয়াল',
      title: 'অনলাইন ডাক্তার সিরিয়াল',
      desc: 'চেম্বারে দীর্ঘ লাইনে না দাঁড়িয়ে সুবিধাজনক সময়ে ঘরে বসেই সিরিয়াল নিশ্চিত করুন।',
      tags: ['⚡ ১-ক্লিকে সিরিয়াল', '📱 এসএমএস রিসিট'],
      color: '#00B875',
      bg: '#F0FDF4',
      border: '#DCFCE7'
    },
    {
      id: 'livequeue',
      icon: <Clock size={24} />,
      badge: 'লাইভ ট্র্যাকার',
      title: 'লাইভ সিরিয়াল কিউ',
      desc: 'চেম্বারে কত নম্বর রোগী চলছে তা মোবাইলে দেখুন এবং সময়মতো পৌঁছে যান।',
      tags: ['⏱️ সময় সাশ্রয়', '🔔 রিয়েল-টাইম কল'],
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#DBEAFE'
    },
    {
      id: 'vault',
      icon: <FileText size={24} />,
      badge: 'ডিজিটাল ভল্ট',
      title: 'আজীবন প্রেসক্রিপশন ক্লাউড',
      desc: 'সকল ব্যবস্থাপত্র ও টেস্ট রিপোর্ট মোবাইলেই আজীবন নিরাপদ সংরক্ষণ করুন।',
      tags: ['📁 চিরতরে নিরাপদ', '🔒 ১০০% গোপনীয়'],
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#EDE9FE'
    },
    {
      id: 'location',
      icon: <MapPin size={24} />,
      badge: 'স্মার্ট ফিল্টার',
      title: 'নিকটস্থ বিশেষজ্ঞ ডাক্তার',
      desc: 'বিভাগ, জেলা ও উপজেলা অনুযায়ী আপনার এলাকার ভেরিফাইড চিকিৎসকদের খুঁজুন।',
      tags: ['📍 এলাকাভিত্তিক সার্চ', '🩺 বিএমডিসি ভেরিফাইড'],
      color: '#0D9488',
      bg: '#F0FDFA',
      border: '#CCFBF1'
    },
    {
      id: 'family',
      icon: <Users size={24} />,
      badge: 'ফ্যামিলি কেয়ার',
      title: 'এক অ্যাকাউন্টে পুরো পরিবার',
      desc: 'এক প্রোফাইল থেকেই মা-বাবা, সন্তান কিংবা স্ত্রীর সিরিয়াল ও হিস্ট্রি ম্যানেজ করুন।',
      tags: ['👨‍👩‍👧 ফ্যামিলি প্রোফাইল', '🔄 মাল্টি-পেশেন্ট'],
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FEF3C7'
    },
    {
      id: 'emergency',
      icon: <HeartPulse size={24} />,
      badge: 'জরুরি নেটওয়ার্ক',
      title: 'জরুরি সেবা ও হটলাইন',
      desc: 'নিকটস্থ হাসপাতালের ইমার্জেন্সি বিভাগ, অ্যাম্বুলেন্স ও হেল্পলাইনে তাৎক্ষণিক সংযোগ।',
      tags: ['🚑 ওয়ান-ট্যাপ কল', '🏥 ২৪/৭ তথ্য'],
      color: '#E11D48',
      bg: '#FFF1F2',
      border: '#FFE4E6'
    }
  ]

  // Interactive Tab Showcase Data (Concise)
  const tabShowcases = {
    booking: {
      tag: 'অনলাইন সিরিয়াল',
      title: 'পছন্দের সময়ে তাৎক্ষণিক অ্যাপয়েন্টমেন্ট',
      desc: 'ডাক্তার নির্বাচন করে আপনার সুবিধাজনক শিফট ও সময় স্লট বুক করুন। সাথে সাথেই মোবাইলে কনফার্মেশন পেয়ে যাবেন।',
      tags: ['কোনো সিরিয়াল ফি নেই', 'তাৎক্ষণিক এসএমএস টোকেন', 'জরুরিতে রিশিডিউল সুবিধা'],
      badgeColor: '#00B875',
      mockupBg: '#064E3B',
      mockupTitle: 'বুকিং টোকেন',
      mockupSub: 'ডাঃ তানভীর হাসান (কার্ডিওলজি)',
      mockupValue: '#DB-8492'
    },
    livequeue: {
      tag: 'লাইভ কিউ ট্র্যাকার',
      title: 'ওয়েটিং রুমে অযথা সময় নষ্ট নয়',
      desc: 'ডাক্তার এখন কত নম্বর রোগী দেখছেন তা ফোনে সরাসরি দেখা যাবে। নিজের সিরিয়ালের সময় অনুযায়ী বাসা থেকে বের হন।',
      tags: ['চলমান সিরিয়াল ডিসপ্লে', 'আনুমানিক সময়ের হিসেব', 'ভিড় ও ইনফেকশন এড়ান'],
      badgeColor: '#2563EB',
      mockupBg: '#1E3A8A',
      mockupTitle: 'লাইভ কিউ মনিটর',
      mockupSub: 'চলমান সিরিয়াল #১২ | আপনার সিরিয়াল #১৫',
      mockupValue: 'বাকি ১৫ মিনিট'
    },
    vault: {
      tag: 'প্রেসক্রিপশন ভল্ট',
      title: 'পুরোনো প্রেসক্রিপশন হারানোর ভয় নেই',
      desc: 'আপনার সব প্রেসক্রিপশন ও ডায়াগনস্টিক রিপোর্ট প্রোফাইলে সেভ থাকবে, যেকোনো নতুন ডাক্তারকে মুহূর্তেই দেখাতে পারবেন।',
      tags: ['ডিজিটাল হিস্ট্রি', 'স্মার্টফোন থেকে ভিউ', 'ব্যাংক-লেভেল এনক্রিপশন'],
      badgeColor: '#7C3AED',
      mockupBg: '#4C1D95',
      mockupTitle: 'ডিজিটাল প্রেসক্রিপশন',
      mockupSub: 'কার্ডিওলজি ফলো-আপ',
      mockupValue: 'আজীবন ক্লাউড ব্যাকআপ'
    },
    family: {
      tag: 'ফ্যামিলি প্রোফাইল',
      title: 'এক ড্যাশবোর্ডে মা-বাবা ও সন্তানের সেবা',
      desc: 'পরিবারের সবার জন্য আলাদা প্রোফাইল তৈরি করে দূর থেকেই সিরিয়াল নেওয়া ও চিকিৎসার তথ্য সাজিয়ে রাখুন।',
      tags: ['পিতা-মাতার বুকিং', 'শিশুর ভ্যাকসিন ট্র্যাক', 'এক আইডি থেকে নিয়ন্ত্রণ'],
      badgeColor: '#0D9488',
      mockupBg: '#134E4A',
      mockupTitle: 'ফ্যামিলি ড্যাশবোর্ড',
      mockupSub: 'পিতা (৬২) ও সন্তান (৭)',
      mockupValue: '২ জন সংযুক্ত'
    }
  }

  // 3 Simple Steps
  const steps = [
    {
      num: '১',
      title: 'ফ্রি একাউন্ট খুলুন',
      desc: 'মোবাইল নম্বর দিয়ে মাত্র ১ মিনিটে সাইন-আপ করুন।'
    },
    {
      num: '২',
      title: 'ডাক্তার ও সময় বাছুন',
      desc: 'এলাকা বা রোগ অনুযায়ী বিশেষজ্ঞ নির্বাচন করে বুকিং দিন।'
    },
    {
      num: '৩',
      title: 'লাইভ ট্র্যাক করে সেবা নিন',
      desc: 'মোবাইলে সিরিয়াল দেখে সঠিক সময়ে গিয়ে চিকিৎসা নিন।'
    }
  ]

  // Direct, 1-2 line FAQs
  const faqs = [
    {
      q: 'Doctor Booklet-এ রোগী হিসেবে রেজিস্ট্রেশন করতে কি কোনো টাকা লাগবে?',
      a: 'না, এটি রোগীদের জন্য আজীবন ১০০% বিনামূল্যে। কোনো রেজিস্ট্রেশন বা বুকিং ফি নেই।'
    },
    {
      q: 'পরিবারের মা-বাবা বা সন্তানের জন্য কি সিরিয়াল নেওয়া যাবে?',
      a: 'হ্যাঁ, আপনার একাউন্ট থেকেই পরিবারের প্রতিটি সদস্যের জন্য আলাদা প্রোফাইল ও সিরিয়াল নিয়ন্ত্রণ করতে পারবেন।'
    },
    {
      q: 'লাইভ সিরিয়াল কিউ কীভাবে কাজ করে?',
      a: 'চেম্বারে বর্তমানে কত নম্বর সিরিয়াল চলছে তা আপনার মোবাইলেই রিয়েল-টাইম দেখা যায়, ফলে হাসপাতালে দীর্ঘক্ষণ বসে থাকতে হয় না।'
    },
    {
      q: 'কোনো কারণে চেম্বারে যেতে না পারলে সিরিয়াল বাতিল করা যাবে?',
      a: 'হ্যাঁ, "My Appointments" থেকে খুব সহজেই বিনামূল্যে অ্যাপয়েন্টমেন্ট বাতিল বা সুবিধাজনক তারিখে পরিবর্তন করতে পারবেন।'
    }
  ]

  return (
    <div className="patient-info-page" style={{ background: '#F8FAFC', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ── RESPONSIVE COMPACT STYLING ── */}
      <style>{`
        .patient-hero-section {
          position: relative;
          background: linear-gradient(145deg, #022C22 0%, #064E3B 45%, #0B3B32 100%);
          padding: 120px 0 75px;
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
        .patient-hero-badge {
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
        .patient-hero-title {
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 950;
          line-height: 1.25;
          margin-bottom: 16px;
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
          font-size: clamp(14.5px, 1.6vw, 17px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.9);
          max-width: 680px;
          margin: 0 auto 30px;
        }
        .patient-hero-cta-btn {
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
        .patient-hero-cta-btn:hover {
          background: #059669;
          color: white;
          transform: translateY(-2px);
        }
        .patient-hero-secondary-btn {
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
        .patient-hero-trust-row {
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
        .patient-trust-bar {
          margin-top: -32px;
          position: relative;
          z-index: 10;
        }
        .patient-trust-card {
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
        .patient-stat-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .patient-stat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .patient-stat-val {
          font-size: 20px;
          font-weight: 950;
          color: #0F172A;
          line-height: 1.1;
        }
        .patient-stat-lbl {
          font-size: 12px;
          color: #64748B;
          font-weight: 700;
        }

        /* Service Cards (Compact & Punchy) */
        .patient-services-section {
          padding: 60px 0 50px;
        }
        .patient-service-card {
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
        .patient-service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 184, 117, 0.1);
          border-color: #A7F3D0;
        }
        .patient-service-icon-box {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .patient-service-title {
          font-size: 17px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .patient-service-desc {
          font-size: 13.5px;
          color: #64748B;
          line-height: 1.55;
          margin-bottom: 14px;
        }
        .patient-service-tags {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .patient-service-tag-pill {
          font-size: 11.5px;
          font-weight: 750;
          padding: 4px 10px;
          border-radius: 99px;
          background: #F8FAFC;
          color: #475569;
          border: 1px solid #E2E8F0;
        }

        /* Tabs Showcase */
        .patient-tab-section {
          padding: 55px 0;
          background: white;
          border-top: 1px solid #E2E8F0;
          border-bottom: 1px solid #E2E8F0;
        }
        .patient-tab-nav {
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
        .patient-tab-btn {
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
        .patient-tab-btn.active {
          background: #00B875;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 184, 117, 0.25);
        }
        .patient-tab-box {
          background: #F8FAFC;
          border-radius: 24px;
          border: 1px solid #E2E8F0;
          padding: clamp(20px, 3.5vw, 36px);
        }
        .patient-tab-content-title {
          font-size: clamp(19px, 2.2vw, 25px);
          font-weight: 950;
          color: #0F172A;
          margin-bottom: 10px;
        }
        .patient-tab-content-desc {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 18px;
        }
        .patient-mockup-card {
          border-radius: 18px;
          padding: 22px 18px;
          color: white;
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
        }

        /* Steps Section */
        .patient-steps-section {
          padding: 60px 0 50px;
        }
        .patient-step-card {
          background: white;
          border-radius: 18px;
          padding: 22px 18px;
          border: 1px solid #E2E8F0;
          height: 100%;
        }
        .patient-step-num {
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
        .patient-step-title {
          font-size: 16px;
          font-weight: 850;
          color: #0F172A;
          margin-bottom: 6px;
        }
        .patient-step-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.5;
          margin: 0;
        }

        /* Security Section (Soft Mint Clean Card) */
        .patient-security-section {
          padding: 45px 0;
          background: #F8FAFC;
        }
        .patient-security-card {
          background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 50%, #E6FFFA 100%);
          border: 1.5px solid #A7F3D0;
          border-radius: 22px;
          padding: clamp(20px, 3.5vw, 34px);
          box-shadow: 0 8px 24px rgba(0, 184, 117, 0.06);
        }
        .patient-security-inner {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .patient-lock-icon-box {
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
        .patient-security-title {
          font-size: clamp(18px, 2.2vw, 22px);
          font-weight: 950;
          margin-bottom: 8px;
          color: #064E3B;
        }
        .patient-security-desc {
          color: #334155;
          font-size: 13.5px;
          line-height: 1.55;
          margin: 0 0 12px 0;
        }
        .patient-security-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .patient-security-pill {
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
        .patient-faq-section {
          padding: 55px 0;
        }
        .patient-faq-btn {
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
        .patient-faq-q-badge {
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
        .patient-faq-question {
          font-weight: 700;
          font-size: 15px;
          line-height: 1.35;
          flex: 1;
        }
        .patient-faq-answer {
          padding: 0 20px 16px;
        }
        .patient-faq-answer p {
          margin: 0;
          color: #475569;
          font-size: 13.5px;
          line-height: 1.55;
        }

        /* Bottom CTA */
        .patient-bottom-cta {
          padding: 70px 0;
          background: linear-gradient(145deg, #022C22 0%, #064E3B 100%);
          color: white;
          text-align: center;
        }
        .patient-bottom-cta-title {
          font-weight: 950 !important;
          font-size: clamp(22px, 3.2vw, 34px);
          margin-bottom: 10px;
          color: white;
        }
        .patient-bottom-cta-desc {
          color: rgba(255, 255, 255, 0.85);
          font-size: 15px;
          max-width: 580px;
          margin: 0 auto 26px;
        }

        /* ── RESPONSIVE MOBILE TWEAKS (max-width: 768px) ── */
        @media (max-width: 768px) {
          .patient-hero-section {
            padding: 95px 0 45px !important;
          }
          .patient-hero-title {
            font-size: 25px !important;
          }
          .patient-hero-desc {
            font-size: 13px !important;
            margin-bottom: 20px !important;
          }
          .patient-hero-cta-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .patient-hero-secondary-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .patient-hero-trust-row {
            flex-direction: column !important;
            gap: 6px !important;
            font-size: 11.5px !important;
          }
          .patient-trust-card {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            padding: 10px !important;
          }
          .patient-stat-item {
            padding: 8px !important;
            background: #F8FAFC !important;
            border-radius: 10px !important;
          }
          .patient-stat-val {
            font-size: 16px !important;
          }
          .patient-stat-lbl {
            font-size: 10.5px !important;
          }
          .patient-services-section {
            padding: 30px 0 !important;
          }
          .patient-service-card {
            padding: 16px !important;
          }
          .patient-tab-section {
            padding: 30px 0 !important;
          }
          .patient-tab-nav {
            overflow-x: auto !important;
            justify-content: flex-start !important;
            scrollbar-width: none !important;
          }
          .patient-tab-box {
            padding: 16px 12px !important;
          }
          .patient-steps-section {
            padding: 30px 0 !important;
          }
          .patient-security-section {
            padding: 22px 0 !important;
          }
          .patient-security-card {
            padding: 18px 12px !important;
            text-align: center !important;
          }
          .patient-security-inner {
            flex-direction: column !important;
            align-items: center !important;
            gap: 12px !important;
          }
          .patient-security-badges {
            justify-content: center !important;
          }
          .patient-bottom-cta {
            padding: 40px 0 85px !important;
          }
        }
      `}</style>

      {/* ── 1. HERO SECTION ── */}
      <section className="patient-hero-section">
        <div className="patient-hero-grid" />
        <div className="patient-hero-glow-1" />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="justify-content-center text-center">
            <Col lg={10} md={12}>
              <div className="patient-hero-badge">
                <Sparkles size={14} color="#34D399" />
                <span>রোগী ও পরিবারের ডিজিটাল স্বাস্থ্যসেবা</span>
              </div>

              <h1 className="patient-hero-title">
                সুস্থ জীবনের স্মার্ট সমাধান — <br />
                <span className="patient-hero-title-accent">ঘরে বসেই বিশেষজ্ঞ ডাক্তার ও সেবা</span>
              </h1>

              <p className="patient-hero-desc">
                লাইলে দাঁড়িয়ে সময় নষ্ট না করে পছন্দের শিফটে সিরিয়াল বুক করুন এবং লাইভ কিউ ট্র্যাক করে সময়মতো সেবা নিন।
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
                <Link to="/register/patient" className="patient-hero-cta-btn">
                  <Users size={17} />
                  <span>ফ্রি একাউন্ট খুলুন</span>
                  <ArrowRight size={16} />
                </Link>

                <Link to="/doctors" className="patient-hero-secondary-btn">
                  <Stethoscope size={16} />
                  <span>ডাক্তার তালিকা দেখুন</span>
                </Link>
              </div>

              <div className="patient-hero-trust-row">
                <span><CheckCircle2 size={14} color="#34D399" /> ১০০% ফ্রি রেজিস্ট্রেশন</span>
                <span><CheckCircle2 size={14} color="#34D399" /> BMDC ভেরিফাইড ডাক্তার</span>
                <span><CheckCircle2 size={14} color="#34D399" /> রিয়েল-টাইম লাইভ কিউ</span>
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
              <Users size={18} />
            </div>
            <div>
              <div className="patient-stat-val">৫০,০০০+</div>
              <div className="patient-stat-lbl">রোগী সেবাগ্রহণকারী</div>
            </div>
          </div>

          <div className="patient-stat-item">
            <div className="patient-stat-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Stethoscope size={18} />
            </div>
            <div>
              <div className="patient-stat-val">১,৫০০+</div>
              <div className="patient-stat-lbl">ভেরিফাইড ডাক্তার</div>
            </div>
          </div>

          <div className="patient-stat-item">
            <div className="patient-stat-icon-wrap" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <Building2 size={18} />
            </div>
            <div>
              <div className="patient-stat-val">২৫০+</div>
              <div className="patient-stat-lbl">হাসপাতাল পার্টনার</div>
            </div>
          </div>

          <div className="patient-stat-item">
            <div className="patient-stat-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Zap size={18} />
            </div>
            <div>
              <div className="patient-stat-val">৯৯.৮%</div>
              <div className="patient-stat-lbl">সন্তুষ্টি রেটিং</div>
            </div>
          </div>
        </div>
      </Container>

      {/* ── 3. CORE SERVICES GRID (Compact Bento Style) ── */}
      <section className="patient-services-section">
        <Container>
          <div className="text-center mb-4">
            <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 32px)', fontWeight: 950, color: '#0F172A', marginBottom: '8px' }}>
              Doctor Booklet কেন ব্যবহার করবেন?
            </h2>
            <p style={{ color: '#64748B', fontSize: '14.5px', maxWidth: '520px', margin: '0 auto' }}>
              রোগীদের সময় ও ঝামেলা কমাতে প্রয়োজনীয় সব সেবা এক প্ল্যাটফর্মে।
            </p>
          </div>

          <Row className="g-3">
            {patientServices.map((service) => (
              <Col lg={4} md={6} sm={12} key={service.id}>
                <div className="patient-service-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div className="patient-service-icon-box" style={{ background: service.bg, color: service.color, border: `1px solid ${service.border}` }}>
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

                    <h3 className="patient-service-title">{service.title}</h3>
                    <p className="patient-service-desc">{service.desc}</p>
                  </div>

                  <div className="patient-service-tags">
                    {service.tags.map((tag, idx) => (
                      <span key={idx} className="patient-service-tag-pill">
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
      <section className="patient-tab-section">
        <Container>
          <div className="text-center mb-3">
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 30px)', fontWeight: 950, color: '#0F172A', marginBottom: '6px' }}>
              সেবা কীভাবে কাজ করে?
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>
              ট্যাব নির্বাচন করে সরাসরি লাইভ সুবিধাগুলো দেখুন।
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <div className="patient-tab-nav">
              <button 
                className={`patient-tab-btn ${activeTab === 'booking' ? 'active' : ''}`}
                onClick={() => setActiveTab('booking')}
              >
                <Calendar size={15} />
                <span>বুকিং</span>
              </button>

              <button 
                className={`patient-tab-btn ${activeTab === 'livequeue' ? 'active' : ''}`}
                onClick={() => setActiveTab('livequeue')}
              >
                <Clock size={15} />
                <span>লাইভ কিউ</span>
              </button>

              <button 
                className={`patient-tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
                onClick={() => setActiveTab('vault')}
              >
                <FileText size={15} />
                <span>প্রেসক্রিপশন</span>
              </button>

              <button 
                className={`patient-tab-btn ${activeTab === 'family' ? 'active' : ''}`}
                onClick={() => setActiveTab('family')}
              >
                <Users size={15} />
                <span>পরিবার</span>
              </button>
            </div>
          </div>

          <div className="patient-tab-box">
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

                <h3 className="patient-tab-content-title">
                  {tabShowcases[activeTab].title}
                </h3>

                <p className="patient-tab-content-desc">
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
                  <Link to="/register/patient" style={{ 
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
                    <span>শুরু করুন</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </Col>

              <Col lg={5} md={12}>
                <div className="patient-mockup-card" style={{ background: tabShowcases[activeTab].mockupBg }}>
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
      <section className="patient-steps-section">
        <Container>
          <div className="text-center mb-4">
            <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 950, color: '#0F172A', marginBottom: '6px' }}>
              সহজ ৩টি ধাপে সেবা গ্রহণ
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>কোনো জটিলতা ছাড়াই মাত্র কয়েক মিনিটেই সিরিয়াল নিশ্চিত করুন।</p>
          </div>

          <Row className="g-3">
            {steps.map((st, idx) => (
              <Col lg={4} md={6} sm={12} key={idx}>
                <div className="patient-step-card">
                  <div className="patient-step-num">{st.num}</div>
                  <h3 className="patient-step-title">{st.title}</h3>
                  <p className="patient-step-desc">{st.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── 6. DATA SECURITY GUARANTEE (Idea 1 Soft Mint Card) ── */}
      <section className="patient-security-section">
        <Container>
          <div className="patient-security-card">
            <div className="patient-security-inner">
              <div className="patient-lock-icon-box">
                <ShieldCheck size={32} strokeWidth={2.2} />
              </div>

              <div style={{ flex: 1 }}>
                <h3 className="patient-security-title">
                  আপনার স্বাস্থ্য তথ্যের পূর্ণ গোপনীয়তা
                </h3>
                <p className="patient-security-desc">
                  আপনার প্রেসক্রিপশন ও মেডিকেল হিস্ট্রি ব্যাংক-লেভেল ২৫৬-বিট এনক্রিপশনে সম্পূর্ণ সুরক্ষিত। আপনার সম্মতি ছাড়া কেউ তা দেখতে পারে না।
                </p>

                <div className="patient-security-badges">
                  <span className="patient-security-pill">
                    <CheckCircle2 size={13} color="#00B875" />
                    <span>২৫৬-বিট SSL</span>
                  </span>
                  <span className="patient-security-pill">
                    <CheckCircle2 size={13} color="#00B875" />
                    <span>আন্তর্জাতিক নিরাপত্তা মান</span>
                  </span>
                  <span className="patient-security-pill">
                    <CheckCircle2 size={13} color="#00B875" />
                    <span>১০০% ক্লাউড সুরক্ষিত</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 7. PATIENT FAQS (4 Direct Questions) ── */}
      <section className="patient-faq-section">
        <Container>
          <div className="text-center mb-4">
            <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 950, color: '#0F172A', marginBottom: '6px' }}>
              সচরাচর জিজ্ঞাসা
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>রোগীদের সাধারণ প্রশ্নের দ্রুত ও স্পষ্ট উত্তর।</p>
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
                        className="patient-faq-btn"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                      >
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
                        {isOpen ? <ChevronUp size={16} color="#00B875" /> : <ChevronDown size={16} color="#94A3B8" />}
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

      {/* ── 8. BOTTOM CTA BANNER ── */}
      <section className="patient-bottom-cta">
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="patient-bottom-cta-title">
            আজই যুক্ত হোন Doctor Booklet স্বাস্থ্য পরিবারে
          </h2>
          <p className="patient-bottom-cta-desc">
            মাত্র ১ মিনিটে বিনামূল্যে আপনার অ্যাকাউন্ট খুলে আধুনিক স্বাস্থ্যসেবার অভিজ্ঞতা নিন।
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register/patient" className="patient-hero-cta-btn">
              <Users size={17} />
              <span>বিনামূল্যে রেজিস্টার করুন</span>
              <ArrowRight size={16} />
            </Link>

            <Link to="/login" className="patient-hero-secondary-btn">
              <Laptop size={16} />
              <span>লগইন করুন</span>
            </Link>
          </div>
        </Container>
      </section>

    </div>
  )
}

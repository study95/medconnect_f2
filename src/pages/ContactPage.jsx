import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Modal } from 'react-bootstrap'
import { 
  MapPin, Phone, Mail, Globe, Clock, Send, ShieldCheck, 
  Headset, CheckCircle2, Copy, ExternalLink,
  Building2, ArrowRight, MessageSquare, ChevronDown,
  Sparkles, MessageCircle, User, Stethoscope, 
  CreditCard, Wrench, Navigation, Check, HelpCircle, Plus, Minus, AlertTriangle,
  Search, RefreshCw, Calendar, ArrowLeft, X
} from 'lucide-react'
import { getContent, fetchContentFromBackend } from '../utils/contentService'
import axiosInstance from '../api/axiosInstance'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'

export default function ContactPage() {
  const [cms, setCms] = useState(getContent())

  useEffect(() => {
    const handleUpdate = () => setCms(getContent())
    window.addEventListener('cms-updated', handleUpdate)
    fetchContentFromBackend()
    return () => window.removeEventListener('cms-updated', handleUpdate)
  }, [])

  const site = cms.site || {}
  const contact = cms.contact || {}
  const faqCms = cms.faq || {}

  const [activeFormTab, setActiveFormTab] = useState('send') // 'send' or 'track'
  const [activeDepartment, setActiveDepartment] = useState('general')
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    subject: 'অ্যাপয়েন্টমেন্ট ও রোগী সেবা', 
    extraField: '', 
    message: '' 
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [copiedField, setCopiedField] = useState(null)
  const [activeFaq, setActiveFaq] = useState(null)

  // Token ID (CID) & Modal state for public contact messages
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [newCidToken, setNewCidToken] = useState('')
  const [copiedCid, setCopiedCid] = useState(false)

  // Public Tracking state
  const [trackCid, setTrackCid] = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackResult, setTrackResult] = useState(null)
  const [trackError, setTrackError] = useState('')

  // Determine if office is currently open (BD time Saturday to Thursday 9:00 AM - 8:00 PM)
  const [isOfficeOpen, setIsOfficeOpen] = useState(true)
  useEffect(() => {
    try {
      const now = new Date()
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
      const bdTime = new Date(utc + (3600000 * 6))
      const day = bdTime.getDay()
      const hour = bdTime.getHours()
      if (day === 5) {
        setIsOfficeOpen(false)
      } else {
        setIsOfficeOpen(hour >= 9 && hour < 20)
      }
    } catch {
      setIsOfficeOpen(true)
    }
  }, [])

  const DEPARTMENTS = [
    {
      id: 'general',
      label: 'অ্যাপয়েন্টমেন্ট ও রোগী সেবা',
      icon: <Headset size={16} />,
      badge: 'গড় রেসপন্স ১৫ মিনিট',
      placeholderSubject: 'অ্যাপয়েন্টমেন্ট ও রোগী সেবা',
      extraLabel: null
    },
    {
      id: 'doctor',
      label: 'ডাক্তার নিবন্ধন সেবা',
      icon: <Stethoscope size={16} />,
      badge: 'ভেরিফিকেশন টিম',
      placeholderSubject: 'ডাক্তার নিবন্ধন সেবা',
      extraLabel: 'বিএমডিসি নম্বর (BMDC Reg No)'
    },
    {
      id: 'hospital',
      label: 'হাসপাতাল ও ক্লিনিক সেবা',
      icon: <Building2 size={16} />,
      badge: 'প্রাতিষ্ঠানিক সাপোর্ট',
      placeholderSubject: 'হাসপাতাল ও ক্লিনিক সেবা',
      extraLabel: 'হাসপাতাল / প্রতিষ্ঠানের নাম'
    },
    {
      id: 'billing',
      label: 'ফি ও পেমেন্ট সংক্রান্ত',
      icon: <CreditCard size={16} />,
      badge: 'অ্যাকাউন্টস ডেস্ক',
      placeholderSubject: 'ফি ও পেমেন্ট সংক্রান্ত',
      extraLabel: 'ট্রানজ্যাকশন আইডি (ঐচ্ছিক)'
    },
    {
      id: 'tech',
      label: 'লগইন ও টেকনিক্যাল সাপোর্ট',
      icon: <Wrench size={16} />,
      badge: 'আইটি সাপোর্ট',
      placeholderSubject: 'লগইন ও টেকনিক্যাল সাপোর্ট',
      extraLabel: 'ডিভাইস বা ব্রাউজার বিবরণ'
    }
  ]

  const handleDepartmentChange = (dept) => {
    setActiveDepartment(dept.id)
    setForm(prev => ({
      ...prev,
      subject: dept.label
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.message) {
      return
    }
    setLoading(true)
    setSubmitError('')
    setSubmitted(false)

    try {
      const activeDeptObj = DEPARTMENTS.find(d => d.id === activeDepartment)
      const fullSubject = form.extraField?.trim()
        ? `${form.subject} (${activeDeptObj?.extraLabel || 'রেফারেন্স'}: ${form.extraField.trim()})`
        : form.subject

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        department: form.subject,
        extra_field: form.extraField?.trim() || null,
        subject: fullSubject,
        message: form.message.trim(),
      }

      const res = await axiosInstance.post('/contact-messages', payload)
      const generatedCid = res.data?.token_id || res.data?.data?.token_id || ''

      setNewCidToken(generatedCid)
      setShowSuccessModal(true)

      setForm({ 
        name: '', 
        email: '', 
        phone: '', 
        subject: DEPARTMENTS.find(d => d.id === activeDepartment)?.label || 'অ্যাপয়েন্টমেন্ট ও রোগী সেবা', 
        extraField: '', 
        message: '' 
      })
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 8000)
    } catch (err) {
      const msg = err.response?.data?.message || 'বার্তা পাঠানো সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন বা হেল্পলাইনে কল করুন।'
      setSubmitError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleTrack = async (cidToTrack) => {
    const token = (cidToTrack !== undefined ? cidToTrack : trackCid).trim().toUpperCase()
    if (!token) {
      setTrackError('অনুগ্রহ করে ট্র্যাকিং আইডি (CID) লিখুন।')
      return
    }
    setTrackLoading(true)
    setTrackError('')
    setTrackResult(null)

    try {
      const res = await axiosInstance.get(`/contact-messages/track/${token}`)
      setTrackResult(res.data)
    } catch (err) {
      const msg = err.response?.data?.message || 'এই ট্র্যাকিং আইডি (CID) দিয়ে কোনো বার্তা খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক আইডিটি দিন।'
      setTrackError(msg)
    } finally {
      setTrackLoading(false)
    }
  }

  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
    }
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2500)
  }

  const DEFAULT_FAQS = [
    {
      q: 'অনলাইনে সিরিয়াল নেওয়ার পর এসএমএস না আসলে কী করব?',
      a: 'সাধারণত সিরিয়াল নিশ্চিত হওয়ামাত্রই স্বয়ংক্রিয় এসএমএস প্রেরিত হয়। মোবাইল নেটওয়ার্ক বিলম্বের কারণে এসএমএস না পেলে আপনার ড্যাশবোর্ডের "আমার সিরিয়াল" সেকশনে লগইন করে তাৎক্ষণিক ডিজিটাল টিকিট ডাউনলোড বা দেখতে পারেন অথবা আমাদের হেল্পলাইনে কল করুন।'
    },
    {
      q: 'ডাক্তার হিসেবে Doctor Booklet প্ল্যাটফর্মে কীভাবে যুক্ত হব?',
      a: 'ওয়েবসাইটের মেন্যু থেকে "ডাক্তার রেজিস্ট্রেশন" অপশনে গিয়ে আপনার বিএমডিসি রেজিস্ট্রেশন নম্বর, বিশেষত্ব ও প্রয়োজনীয় তথ্য প্রদান করুন। আমাদের মেডিকেল ভেরিফিকেশন টিম সর্বোচ্চ ২৪ ঘণ্টার মধ্যে সনদ যাচাই করে আপনার ডিজিটাল চেম্বার সক্রিয় করবে।'
    },
    {
      q: 'হাসপাতাল বা ক্লিনিকের ডিসপ্লে বোর্ড ও ওপিডি সফটওয়্যার কীভাবে নেব?',
      a: 'হাসপাতাল পার্টনারশিপ ক্যাটাগরি নির্বাচন করে আমাদের কাছে বার্তা পাঠান। আমাদের এন্টারপ্রাইজ টিম সরাসরি আপনার স্বাস্থ্যসেবা প্রতিষ্ঠান পরিদর্শন করবে এবং কাস্টমাইজড ডিসপ্লে বোর্ড ও সিরিয়াল ম্যানেজমেন্ট সিস্টেম সেটআপ করে দেবে।'
    },
    {
      q: 'ভুলবশত বুকিং হয়ে গেলে বা তারিখ পরিবর্তন করতে চাইলে করণীয় কী?',
      a: 'অ্যাপয়েন্টমেন্ট সময়ের অন্তত ৪ ঘণ্টা পূর্বে আপনার রোগী প্রোফাইল থেকে সহজেই তারিখ রিশিডিউল করতে পারবেন। কোনো অসুবিধা হলে আমাদের ২৪/৭ কাস্টমার সাপোর্টে কল করলে প্রতিনিধি আপনাকে তৎক্ষণাৎ সাহায্য করবেন।'
    }
  ]

  const FAQS = Array.isArray(faqCms.items) && faqCms.items.length > 0
    ? faqCms.items.slice(0, 5)
    : DEFAULT_FAQS

  const phoneValue = (contact.phone && contact.phone !== '017 XXXX XXXX')
    ? contact.phone
    : ((site.phone && site.phone !== '017 XXXX XXXX') ? site.phone : '09613868438')
  const whatsappValue = contact.whatsapp || phoneValue || '01747465666'
  const cleanWhatsappPhone = (() => {
    const digits = whatsappValue.replace(/[^0-9]/g, '')
    if (!digits) return '8801747465666'
    if (digits.startsWith('880')) return digits
    if (digits.startsWith('01')) return `88${digits}`
    return digits
  })()
  const emailValue = contact.email || site.email_support || site.email || 'info@doctorbooklet.com.bd'
  
  // Clean address to remove legacy "মেডকানেক্ট" references
  const rawAddress = contact.address || site.address || 'বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা-১২০৫'
  const addressValue = rawAddress.replace(/মেডকানেক্ট\s*কমপ্লেক্স,?\s*/gi, 'ডাক্তার বুকলেট হেডকোয়ার্টার, ')
  
  const officeHoursValue = contact.office_hours || site.office_hours || 'শনিবার - বৃহস্পতিবার: সকাল ৯:০০ - রাত ৮:০০'
  
  // Facebook / Messenger URL
  const facebookUrl = site.facebook || 'https://facebook.com'
  const messengerUrl = contact.messenger
    ? (contact.messenger.startsWith('http') ? contact.messenger : `https://m.me/${contact.messenger.replace(/^@/, '')}`)
    : (facebookUrl.includes('facebook.com') && !facebookUrl.endsWith('facebook.com')
      ? facebookUrl.replace('facebook.com', 'm.me')
      : 'https://m.me/doctorbooklet')

  return (
    <div className="page-wrapper contact-page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <style>{`
        /* ── HERO & BASE STYLES ── */
        .contact-hero {
          background: radial-gradient(130% 100% at 50% 0%, #064E3B 0%, #022C22 55%, #011C15 100%);
          padding-bottom: 95px;
          position: relative;
          overflow: hidden;
          color: white;
        }
        @media (max-width: 768px) {
          .contact-hero {
            padding-bottom: 55px;
          }
        }
        .contact-hero-grid {
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
        .contact-hero-glow-1 {
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
        .contact-hero-glow-2 {
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
        .contact-hero-glow-3 {
          position: absolute;
          bottom: -80px;
          left: 35%;
          width: 500px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%);
          filter: blur(50px);
          pointer-events: none;
        }

        /* ── SLA HERO GRID ── */
        .contact-sla-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          max-width: 580px;
        }
        .contact-sla-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 14px;
          padding: 8px 14px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        @media (max-width: 768px) {
          .contact-sla-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .contact-sla-card {
            padding: 8px 10px !important;
            border-radius: 12px !important;
            gap: 8px !important;
          }
          .contact-sla-title {
            font-size: 10.5px !important;
          }
          .contact-sla-desc {
            font-size: 12px !important;
          }
        }
        @media (max-width: 380px) {
          .contact-sla-grid {
            gap: 6px !important;
          }
          .contact-sla-card {
            padding: 6px 8px !important;
          }
        }

        /* ── QUICK ACTION STRIP ── */
        .contact-strip-container {
          margin-top: -60px;
          position: relative;
          z-index: 10;
        }
        @media (max-width: 768px) {
          .contact-strip-container {
            margin-top: -30px;
          }
        }

        .channel-action-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 22px 20px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .channel-action-card:hover {
          transform: translateY(-5px);
        }

        /* ── DEPARTMENT PILLS (MOBILE TOUCH-FRIENDLY & DESKTOP BALANCED GRID) ── */
        .dept-tabs-container {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-bottom: 22px;
        }
        @media (max-width: 991px) {
          .dept-tabs-container {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 6px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
          }
        }
        .dept-tabs-container::-webkit-scrollbar {
          height: 4px;
        }
        .dept-tabs-container::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }

        .dept-pill-btn {
          white-space: nowrap;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          width: 100%;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
        }
        @media (max-width: 991px) {
          .dept-pill-btn {
            width: auto;
            padding: 9px 16px;
          }
        }
        .dept-pill-btn:hover {
          border-color: #00B875;
          color: #065F46;
          background: #F0FDF4;
        }
        .dept-pill-btn.active {
          background: #064E3B;
          border-color: #064E3B;
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(6, 78, 59, 0.25);
        }

        /* ── FORM ELEMENTS ── */
        .contact-form-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 34px 30px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        @media (max-width: 768px) {
          .contact-form-card {
            padding: 22px 18px;
            border-radius: 20px;
          }
        }

        .input-group-custom {
          position: relative;
        }
        .input-group-custom .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          pointer-events: none;
          transition: color 0.2s ease;
        }
        .input-group-custom .contact-input {
          padding-left: 44px;
        }
        .input-group-custom:focus-within .input-icon {
          color: #00B875;
        }

        .contact-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 13px;
          border: 1.5px solid #E2E8F0;
          font-size: 14.5px;
          outline: none;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
          transition: all 0.2s ease;
          background: #F8FAFC;
          color: #0F172A;
          font-weight: 500;
        }
        .contact-input:focus {
          border-color: #00B875;
          background: #FFFFFF;
          box-shadow: 0 0 0 3.5px rgba(0, 184, 117, 0.15);
        }
        .contact-input::placeholder {
          color: #94A3B8;
          font-weight: 400;
        }

        /* ── RIGHT COLUMN INFO CARDS ── */
        .contact-info-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 28px 24px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        @media (max-width: 768px) {
          .contact-info-card {
            padding: 20px 18px;
            border-radius: 20px;
          }
        }

        /* ── FAQ ACCORDION ITEM ── */
        @keyframes contactFaqFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .contact-faq-item {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          transition: all 0.25s ease;
          margin-bottom: 12px;
        }
        .contact-faq-item.active {
          border-color: #86EFAC;
          box-shadow: 0 4px 20px rgba(0, 184, 117, 0.08);
        }
        .contact-faq-header {
          width: 100%;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          background: transparent;
          border: none;
          text-align: left;
          gap: 12px;
          user-select: none;
          outline: none;
        }
        .contact-faq-q-badge {
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
        .contact-faq-q-text {
          font-size: 15.5px;
          font-weight: 600;
          font-family: 'Hind Siliguri', sans-serif;
          line-height: 1.4;
          flex: 1;
          transition: color 0.2s ease;
        }
        .contact-faq-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .contact-faq-body {
          padding: 0 24px 20px;
          animation: contactFaqFadeIn 0.3s ease;
        }
        .contact-faq-body p {
          margin: 0;
          color: #475569;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.6;
          font-family: 'Hind Siliguri', sans-serif;
        }
        @media (max-width: 768px) {
          .contact-faq-header {
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          .contact-faq-q-badge {
            width: 25px !important;
            height: 25px !important;
            font-size: 12.5px !important;
          }
          .contact-faq-q-text {
            font-size: 14.2px !important;
            line-height: 1.38 !important;
            font-weight: 600 !important;
          }
          .contact-faq-icon {
            width: 26px !important;
            height: 26px !important;
          }
          .contact-faq-icon svg {
            width: 15px !important;
            height: 15px !important;
          }
          .contact-faq-body {
            padding: 0 14px 14px !important;
          }
          .contact-faq-body p {
            font-size: 13.5px !important;
            line-height: 1.55 !important;
          }
        }
        .btn-faq-more {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #00B875 0%, #059669 100%);
          color: #FFFFFF !important;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 14px;
          text-decoration: none !important;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.25);
          transition: all 0.25s ease;
          white-space: nowrap;
        }
        .btn-faq-more:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(0, 184, 117, 0.4) !important;
          color: white !important;
        }
        .faq-more-wrapper {
          text-align: center;
          margin-top: 24px;
          margin-bottom: 20px;
        }
        @media (max-width: 576px) {
          .btn-faq-more {
            width: 100% !important;
            max-width: 310px;
            padding: 11px 18px !important;
            font-size: 13.5px !important;
          }
          .faq-more-wrapper {
            margin-bottom: 35px !important;
          }
        }

        /* ── CID SUCCESS MODAL (RESPONSIVE) ── */
        .cid-success-modal .modal-dialog {
          margin: 16px auto;
          max-width: 440px;
        }
        .cid-modal-card {
          padding: 32px 28px;
          text-align: center;
          background: #FFFFFF;
          border-radius: 24px;
        }
        .cid-token-container {
          background: #F0FDF4;
          border: 1.5px dashed #059669;
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 16px;
          text-align: left;
        }
        .cid-inner-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: #FFFFFF;
          border: 1.5px solid #86EFAC;
          border-radius: 12px;
          padding: 8px 12px;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.05);
        }

        /* ── CONTACT CARD TABS & SEARCH (SEGMENTED & RESPONSIVE) ── */
        .contact-switcher-bar {
          display: flex;
          background: #F1F5F9;
          padding: 6px;
          gap: 6px;
          border-bottom: 1px solid #E2E8F0;
        }
        .contact-switcher-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 11px 14px;
          border-radius: 12px;
          border: none;
          font-weight: 800;
          font-size: 13.5px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #64748B;
          white-space: nowrap;
        }
        .contact-switcher-btn.active {
          background: #FFFFFF;
          color: #064E3B;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .live-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 99px;
          background: #DCFCE7;
          color: #15803D;
        }
        .contact-form-body {
          padding: 28px 24px;
        }
        .cid-search-btn {
          height: 48px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #00B875 0%, #059669 100%);
          color: white;
          font-weight: 800;
          font-size: 15px;
          padding: 0 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.25);
          white-space: nowrap;
          cursor: pointer;
          flex-shrink: 0;
        }

        /* ── TRACK RESULT CARD ── */
        .track-result-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }
        .track-cid-badge {
          font-family: monospace;
          font-size: 17px;
          font-weight: 900;
          color: #064E3B;
          background: #ECFDF5;
          padding: 5px 12px;
          border-radius: 10px;
          border: 1.5px solid #A7F3D0;
          letter-spacing: 0.8px;
          white-space: nowrap;
        }
        .track-copy-btn {
          background: #F1F5F9;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #475569;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .track-status-pill {
          font-size: 11.5px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 99px;
          white-space: nowrap;
        }
        .track-status-pill.unread {
          background: #FFFBEB;
          color: #B45309;
          border: 1px solid #FDE68A;
        }
        .track-status-pill.read {
          background: #EFF6FF;
          color: #1D4ED8;
          border: 1px solid #BFDBFE;
        }
        .track-status-pill.replied {
          background: #ECFDF5;
          color: #047857;
          border: 1px solid #A7F3D0;
        }

        /* ── INFO CARD (SENDER & DEPT) ── */
        .track-info-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 12px 14px;
          margin: 14px 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .track-info-col {
          min-width: 0;
        }
        .track-info-label {
          font-size: 10.5px;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: block;
          margin-bottom: 2px;
        }
        .track-info-value {
          font-size: 13.5px;
          font-weight: 800;
          color: #1E293B;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── STEPPER TIMELINE ── */
        .stepper-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 16px 14px;
          margin-bottom: 14px;
        }
        .stepper-title {
          font-size: 11.5px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 14px;
        }
        .stepper-track {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
        }
        .stepper-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
          z-index: 2;
        }
        .stepper-node {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #E2E8F0;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 13px;
          margin-bottom: 6px;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        .stepper-item.step-done .stepper-node {
          background: #059669;
          color: #FFFFFF;
          box-shadow: 0 3px 10px rgba(5, 150, 105, 0.25);
        }
        .stepper-item.step-current .stepper-node {
          background: #F59E0B;
          color: #FFFFFF;
          box-shadow: 0 3px 10px rgba(245, 158, 11, 0.25);
        }
        .stepper-label {
          font-size: 12px;
          font-weight: 800;
          color: #64748B;
          white-space: nowrap;
          line-height: 1.2;
        }
        .stepper-item.step-done .stepper-label {
          color: #065F46;
        }
        .stepper-item.step-current .stepper-label {
          color: #92400E;
        }
        .stepper-sub {
          font-size: 10px;
          color: #94A3B8;
          margin-top: 2px;
          white-space: nowrap;
        }
        .stepper-connector {
          flex: 1;
          height: 3px;
          background: #E2E8F0;
          margin-top: 15px;
          margin-left: -6px;
          margin-right: -6px;
          z-index: 1;
          border-radius: 2px;
          transition: background 0.3s ease;
        }
        .stepper-connector.active {
          background: #059669;
        }

        /* ── MESSAGE & REPLY CARDS ── */
        .track-msg-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 12px;
        }
        .track-msg-badge {
          font-size: 10.5px;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: block;
          margin-bottom: 4px;
        }
        .track-msg-body {
          margin: 0;
          font-size: 13px;
          color: #334155;
          line-height: 1.6;
        }
        .track-reply-card {
          background: #ECFDF5;
          border: 1.5px solid #6EE7B7;
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 12px;
        }
        .track-reply-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 900;
          color: #064E3B;
          margin-bottom: 6px;
        }
        .track-reply-body {
          margin: 0;
          font-size: 13.5px;
          color: #065F46;
          line-height: 1.7;
          font-weight: 600;
          white-space: pre-wrap;
        }
        .track-pending-card {
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #92400E;
          line-height: 1.5;
        }
        .track-new-msg-btn {
          width: 100%;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 11px 16px;
          color: #065F46;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .track-new-msg-btn:hover {
          background: #F0FDF4;
          border-color: #86EFAC;
        }

        @media (max-width: 576px) {
          .cid-success-modal .modal-dialog {
            margin: 12px;
            max-width: calc(100% - 24px);
          }
          .cid-modal-card {
            padding: 24px 16px !important;
            border-radius: 20px !important;
          }
          .cid-token-container {
            padding: 12px 12px !important;
            margin-bottom: 14px !important;
            border-radius: 14px !important;
          }
          .cid-inner-bar {
            padding: 7px 10px !important;
          }
          .cid-modal-icon {
            width: 58px !important;
            height: 58px !important;
            margin-bottom: 14px !important;
          }
          .cid-modal-icon svg {
            width: 32px !important;
            height: 32px !important;
          }
          .cid-modal-title {
            font-size: 20px !important;
            margin-bottom: 6px !important;
          }
          .cid-modal-desc {
            font-size: 13px !important;
            margin-bottom: 14px !important;
            line-height: 1.5 !important;
          }
          .contact-switcher-bar {
            padding: 5px !important;
            gap: 4px !important;
          }
          .contact-switcher-btn {
            padding: 9px 8px !important;
            font-size: 12.5px !important;
            gap: 5px !important;
          }
          .contact-form-body {
            padding: 16px 12px !important;
          }
          .cid-search-btn {
            width: 100% !important;
            padding: 12px 20px !important;
            height: 46px !important;
          }
          .track-result-card {
            padding: 14px 12px !important;
            border-radius: 14px !important;
          }
          .track-info-card {
            padding: 10px 10px !important;
            gap: 8px !important;
            margin: 10px 0 !important;
          }
          .track-info-value {
            font-size: 12.5px !important;
          }
          .stepper-box {
            padding: 12px 6px !important;
          }
          .stepper-node {
            width: 28px !important;
            height: 28px !important;
            font-size: 11px !important;
          }
          .stepper-connector {
            margin-top: 13px !important;
          }
          .stepper-label {
            font-size: 11px !important;
          }
          .stepper-sub {
            font-size: 9px !important;
          }
        }
        @media (max-width: 768px) {
          .contact-main-section {
            padding: 24px 0 95px !important;
          }
        }
      `}</style>

      {/* ── HERO SECTION ── */}
      <section className="contact-hero">
        <div className="contact-hero-grid" />
        <div className="contact-hero-glow-1" />
        <div className="contact-hero-glow-2" />
        <div className="contact-hero-glow-3" />

        {/* Architectural Subtle Ambient Light Wave */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.16, pointerEvents: 'none', overflow: 'hidden' }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 400" fill="none" preserveAspectRatio="none">
            <path d="M-100 280 C300 400, 700 120, 1100 250 C1300 320, 1500 180, 1600 200" stroke="rgba(52, 211, 153, 0.45)" strokeWidth="1.5" fill="none" />
            <path d="M-100 230 C350 350, 750 80, 1150 200 C1350 270, 1550 140, 1600 160" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1" strokeDasharray="6 6" fill="none" />
            <path d="M-100 330 C250 450, 650 170, 1050 300 C1250 370, 1450 230, 1600 250" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1" fill="none" />
          </svg>
        </div>

        <BreadcrumbHUD links={[{ label: 'যোগাযোগ' }]} variant="light" />

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
                <span style={{ 
                  width: 8, height: 8, borderRadius: '50%', 
                  background: '#34D399', display: 'inline-block',
                  boxShadow: '0 0 10px #34D399'
                }} />
                <span>{contact.hero_badge || 'সার্বক্ষণিক কানেক্টিভিটি ও কাস্টমার কেয়ার'}</span>
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
                {contact.hero_title || 'ডাক্তার বুকলেট কন্টাক্ট হাব: আমরা সার্বক্ষণিক আপনার পাশে'}
              </h1>

              <p style={{ 
                color: 'rgba(255,255,255,0.92)', 
                fontSize: 'clamp(14px, 1.8vw, 16px)', 
                lineHeight: 1.7, 
                marginBottom: 24, 
                maxWidth: 620,
                fontWeight: 400
              }}>
                {contact.hero_subtitle || 'রোগী, নিবন্ধিত ডাক্তার কিংবা হাসপাতাল কর্তৃপক্ষ—যেকোনো প্রশ্ন, প্রযুক্তিগত সহায়তা বা প্রাতিষ্ঠানিক অংশীদারিত্বের জন্য আমাদের বিশেষজ্ঞ টিমের সাথে যোগাযোগ করুন।'}
              </p>

              {/* Service SLA Highlights: Balanced 2x2 Grid with Zero Gaps */}
              <div className="contact-sla-grid">
                {[
                  { icon: <ShieldCheck size={16} />, title: 'তথ্য সুরক্ষা', desc: '২৫৬-বিট এনক্রিপশন' },
                  { icon: <Headset size={16} />, title: 'সরাসরি হটলাইন', desc: '২৪/৭ ডেডিকেটেড' }
                ].map((sla, i) => (
                  <div key={i} className="contact-sla-card">
                    <div style={{ 
                      width: 32, height: 32, borderRadius: 10,
                      background: 'rgba(52, 211, 153, 0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#34D399', flexShrink: 0
                    }}>
                      {sla.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="contact-sla-title" style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sla.title}</div>
                      <div className="contact-sla-desc" style={{ color: 'white', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sla.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Col>

            {/* Desktop Visual Indicator Badge */}
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
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>সেন্ট্রাল সাপোর্ট ডেস্ক</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>ডাক্তার বুকলেট বাংলাদেশ</div>
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
                  <div style={{ color: '#34D399', fontWeight: 700, marginBottom: 2 }}>● সাপোর্ট ডেস্ক সক্রিয়</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.85)' }}>যেকোনো জরুরি জিজ্ঞাসা বা সিস্টেমে সাহায্যের জন্য সরাসরি যোগাযোগ করুন।</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 11.5, color: 'rgba(255,255,255,0.75)' }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {officeHoursValue.split('|')[0]?.trim() || 'শনি-বৃহ: সকাল ৯টা - রাত ৮টা'}
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── QUICK ACTION CHANNELS STRIP (INSTANT BRAND RECOGNITION) ── */}
      <Container className="contact-strip-container">
        <Row className="g-3">
          {/* 1. Phone Hotline Card */}
          <Col lg={3} sm={6} xs={12}>
            <div 
              className="channel-action-card" 
              style={{
                background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 35%)',
                borderColor: '#BBF7D0'
              }}
            >
              {/* Brand Top Line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#00B875' }} />
              
              {/* Watermark Icon */}
              <div style={{ position: 'absolute', right: -12, bottom: -12, color: '#00B875', opacity: 0.05, pointerEvents: 'none' }}>
                <Phone size={95} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 14, 
                    background: '#00B875', color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(0, 184, 117, 0.3)'
                  }}>
                    <Phone size={22} />
                  </div>
                  <span style={{ 
                    fontSize: 11.5, fontWeight: 800, 
                    background: '#DCFCE7', color: '#166534', 
                    border: '1px solid #86EFAC',
                    padding: '4px 10px', borderRadius: 99,
                    display: 'inline-flex', alignItems: 'center', gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                    {contact.phone_badge || '২৪/৭ হেল্পলাইন'}
                  </span>
                </div>
                <h5 style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginBottom: 4 }}>টেলিফোন কল</h5>
                <p style={{ color: '#00B875', fontWeight: 900, fontSize: 16, margin: 0, letterSpacing: '0.3px' }}>
                  {phoneValue}
                </p>
                <p style={{ color: '#64748B', fontSize: 12, margin: '3px 0 0' }}>
                  {contact.phone_subtitle || 'সরাসরি সেন্ট্রাল কল সেন্টারে কথা বলুন'}
                </p>
              </div>

              <div style={{ marginTop: 18, position: 'relative', zIndex: 2 }}>
                <a 
                  href={`tel:${phoneValue.replace(/[^0-9+]/g, '')}`} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: '#00B875',
                    color: 'white',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Phone size={15} />
                  <span>সরাসরি কল করুন</span>
                </a>
              </div>
            </div>
          </Col>

          {/* 2. WhatsApp Direct Card (Instant Green Recognition) */}
          <Col lg={3} sm={6} xs={12}>
            <div 
              className="channel-action-card" 
              style={{
                background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 35%)',
                borderColor: '#86EFAC'
              }}
            >
              {/* WhatsApp Brand Top Line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#25D366' }} />

              {/* Watermark WhatsApp Logo */}
              <div style={{ position: 'absolute', right: -12, bottom: -12, color: '#25D366', opacity: 0.06, pointerEvents: 'none' }}>
                <svg width="95" height="95" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 14, 
                    background: '#25D366', color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(37, 211, 102, 0.35)'
                  }}>
                    {/* Official WhatsApp SVG Logo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <span style={{ 
                    fontSize: 11.5, fontWeight: 800, 
                    background: '#DCFCE7', color: '#15803D', 
                    border: '1px solid #86EFAC',
                    padding: '4px 10px', borderRadius: 99,
                    display: 'inline-flex', alignItems: 'center', gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#25D366', display: 'inline-block' }} />
                    {contact.whatsapp_badge || 'WhatsApp Live'}
                  </span>
                </div>
                <h5 style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginBottom: 4 }}>হোয়াটসঅ্যাপ সাপোর্ট</h5>
                <p style={{ color: '#15803D', fontWeight: 800, fontSize: 14.5, margin: 0 }}>
                  {contact.whatsapp_title || 'তাৎক্ষণিক চ্যাট ও প্রেসক্রিপশন'}
                </p>
                <p style={{ color: '#64748B', fontSize: 12, margin: '3px 0 0' }}>
                  {contact.whatsapp_subtitle || 'ডকুমেন্ট, ছবি ও প্রশ্ন সরাসরি পাঠান'}
                </p>
              </div>

              <div style={{ marginTop: 18, position: 'relative', zIndex: 2 }}>
                <a 
                  href={`https://wa.me/${cleanWhatsappPhone}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: '#25D366',
                    color: 'white',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp-এ মেসেজ দিন</span>
                </a>
              </div>
            </div>
          </Col>

          {/* 3. Official Email Card */}
          <Col lg={3} sm={6} xs={12}>
            <div 
              className="channel-action-card" 
              style={{
                background: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 35%)',
                borderColor: '#BFDBFE'
              }}
            >
              {/* Brand Top Line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#2563EB' }} />

              {/* Watermark Mail Icon */}
              <div style={{ position: 'absolute', right: -12, bottom: -12, color: '#2563EB', opacity: 0.05, pointerEvents: 'none' }}>
                <Mail size={95} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 14, 
                    background: '#2563EB', color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(37, 99, 235, 0.3)'
                  }}>
                    <Mail size={22} />
                  </div>
                  <span style={{ 
                    fontSize: 11.5, fontWeight: 800, 
                    background: '#DBEAFE', color: '#1E40AF', 
                    border: '1px solid #93C5FD',
                    padding: '4px 10px', borderRadius: 99,
                    display: 'inline-flex', alignItems: 'center', gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} />
                    {contact.email_badge || 'অফিসিয়াল ইমেইল'}
                  </span>
                </div>
                <h5 style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginBottom: 4 }}>ইমেইল হেল্পডেস্ক</h5>
                <p style={{ color: '#1E40AF', fontWeight: 800, fontSize: 13, margin: 0, wordBreak: 'break-all' }}>
                  {emailValue}
                </p>
                <p style={{ color: '#64748B', fontSize: 12, margin: '3px 0 0' }}>
                  {contact.email_subtitle || 'সর্বোচ্চ ২ ঘণ্টার মধ্যে আনুষ্ঠানিক উত্তর'}
                </p>
              </div>

              <div style={{ marginTop: 18, position: 'relative', zIndex: 2, display: 'flex', gap: 8 }}>
                <a 
                  href={`mailto:${emailValue}`}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: '#2563EB',
                    color: 'white',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontWeight: 800,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Mail size={15} />
                  <span>ইমেইল পাঠান</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(emailValue, 'topEmail')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    background: '#F8FAFC',
                    color: '#475569',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="ইমেইল কপি করুন"
                >
                  {copiedField === 'topEmail' ? <Check size={15} color="#059669" /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          </Col>

          {/* 4. Facebook Messenger Card (Instant Messenger Gradient Recognition) */}
          <Col lg={3} sm={6} xs={12}>
            <div 
              className="channel-action-card" 
              style={{
                background: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 35%)',
                borderColor: '#BAE6FD'
              }}
            >
              {/* Messenger Official Gradient Top Line */}
              <div style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, height: 4, 
                background: 'linear-gradient(90deg, #00C6FF 0%, #0072FF 50%, #9B51E0 100%)' 
              }} />

              {/* Watermark Messenger Lightning Logo */}
              <div style={{ position: 'absolute', right: -12, bottom: -12, color: '#0084FF', opacity: 0.05, pointerEvents: 'none' }}>
                <svg width="95" height="95" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.145 2 11.258C2 14.17 3.433 16.745 5.672 18.39V22L9.123 20.106C10.038 20.364 11.002 20.516 12 20.516C17.523 20.516 22 16.371 22 11.258C22 6.145 17.523 2 12 2ZM13.082 14.437L10.938 12.146L6.758 14.437L11.353 9.549L13.528 11.84L17.677 9.549L13.082 14.437Z" />
                </svg>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 14, 
                    background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 50%, #9B51E0 100%)', 
                    color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(0, 114, 255, 0.35)'
                  }}>
                    {/* Official Messenger SVG Lightning Logo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C6.477 2 2 6.145 2 11.258C2 14.17 3.433 16.745 5.672 18.39V22L9.123 20.106C10.038 20.364 11.002 20.516 12 20.516C17.523 20.516 22 16.371 22 11.258C22 6.145 17.523 2 12 2ZM13.082 14.437L10.938 12.146L6.758 14.437L11.353 9.549L13.528 11.84L17.677 9.549L13.082 14.437Z" />
                    </svg>
                  </div>
                  <span style={{ 
                    fontSize: 11.5, fontWeight: 800, 
                    background: '#E0F2FE', color: '#0369A1', 
                    border: '1px solid #7DD3FC',
                    padding: '4px 10px', borderRadius: 99,
                    display: 'inline-flex', alignItems: 'center', gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284C7', display: 'inline-block' }} />
                    {contact.messenger_badge || 'Messenger Chat'}
                  </span>
                </div>
                <h5 style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginBottom: 4 }}>ফেসবুক মেসেঞ্জার</h5>
                <p style={{ color: '#0284C7', fontWeight: 800, fontSize: 14.5, margin: 0 }}>
                  {contact.messenger_title || 'সরাসরি অফিসিয়াল ইনবক্স'}
                </p>
                <p style={{ color: '#64748B', fontSize: 12, margin: '3px 0 0' }}>
                  {contact.messenger_subtitle || 'সোশ্যাল সাপোর্ট টিম সার্বক্ষণিক সক্রিয়'}
                </p>
              </div>

              <div style={{ marginTop: 18, position: 'relative', zIndex: 2 }}>
                <a 
                  href={messengerUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #00B2FF 0%, #006AFF 100%)',
                    color: 'white',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0, 106, 255, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258C2 14.17 3.433 16.745 5.672 18.39V22L9.123 20.106C10.038 20.364 11.002 20.516 12 20.516C17.523 20.516 22 16.371 22 11.258C22 6.145 17.523 2 12 2ZM13.082 14.437L10.938 12.146L6.758 14.437L11.353 9.549L13.528 11.84L17.677 9.549L13.082 14.437Z" />
                  </svg>
                  <span>মেসেঞ্জারে নক দিন</span>
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* ── MAIN INTERACTIVE CONTACT SECTION ── */}
      <section className="contact-main-section" style={{ padding: '48px 0 65px' }}>
        <Container>
          {/* 1. TOP: FULL WIDTH Enterprise Message Form with Tabs (Layout Diagram Part 1) */}
          <div className="contact-form-card" style={{ marginBottom: 30, padding: 0, overflow: 'hidden' }}>
            {/* Form / Tracking Top Switcher (Segmented, No Horizontal Overflow) */}
            <div className="contact-switcher-bar">
              <button
                type="button"
                onClick={() => { setActiveFormTab('send'); setTrackError(''); }}
                className={`contact-switcher-btn ${activeFormTab === 'send' ? 'active' : ''}`}
              >
                <Send size={15} />
                <span>নতুন বার্তা</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('track')}
                className={`contact-switcher-btn ${activeFormTab === 'track' ? 'active' : ''}`}
              >
                <Search size={15} />
                <span>স্ট্যাটাস (CID)</span>
                <span className="live-badge">লাইভ</span>
              </button>
            </div>

            <div className="contact-form-body">
              {activeFormTab === 'send' ? (
                <div>
                  {/* Header */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ 
                        background: '#ECFDF5', 
                        color: '#059669', 
                        fontSize: 12, 
                        fontWeight: 800, 
                        padding: '4px 12px', 
                        borderRadius: 99,
                        border: '1px solid #A7F3D0'
                      }}>
                        মেসেজ পাঠান
                      </span>
                      <span style={{ color: '#64748B', fontSize: 12.5, fontWeight: 600 }}>
                        • গড় উত্তর সময়: ১৫-৩০ মিনিট
                      </span>
                    </div>
                    <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 'clamp(21px, 3.2vw, 25px)', marginBottom: 6 }}>
                      আপনার জিজ্ঞাসা বা মতামত জানান
                    </h3>
                    <p style={{ color: '#64748B', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                      নিচের বিভাগ নির্বাচন করে আপনার বার্তাটি পাঠান। আমাদের ডেডিকেটেড টিম দ্রুত আপনার সাথে যোগাযোগ করবে।
                    </p>
                  </div>

                  {/* Department Selector Tabs */}
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 8 }}>
                      বিভাগ বা বিষয়ের ধরন নির্বাচন করুন:
                    </label>
                    <div className="dept-tabs-container">
                      {DEPARTMENTS.map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => handleDepartmentChange(dept)}
                          className={`dept-pill-btn ${activeDepartment === dept.id ? 'active' : ''}`}
                        >
                          {dept.icon}
                          <span>{dept.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error Banner */}
                  {submitError && (
                    <div style={{ 
                      background: '#FEF2F2', 
                      border: '1.5px solid #FECACA', 
                      borderRadius: 16, 
                      padding: '14px 18px', 
                      marginBottom: 20, 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: 12,
                      color: '#991B1B'
                    }}>
                      <AlertTriangle size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>
                        {submitError}
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit}>
                    <Row className="g-3">
                      {/* Name */}
                      <Col md={6} xs={12}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                          আপনার পুরো নাম <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="input-group-custom">
                          <User size={17} className="input-icon" />
                          <input
                            id="contact-name"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                            placeholder="উদাঃ মোঃ রহিম আহমেদ"
                            className="contact-input"
                          />
                        </div>
                      </Col>

                      {/* Phone */}
                      <Col md={6} xs={12}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                          মোবাইল নম্বর <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="input-group-custom">
                          <Phone size={17} className="input-icon" />
                          <input
                            id="contact-phone"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            required
                            placeholder="017XXXXXXXX"
                            className="contact-input"
                          />
                        </div>
                      </Col>

                      {/* Email */}
                      <Col md={6} xs={12}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                          ইমেইল ঠিকানা <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="input-group-custom">
                          <Mail size={17} className="input-icon" />
                          <input
                            id="contact-email"
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            required
                            placeholder="rahim@example.com"
                            className="contact-input"
                          />
                        </div>
                      </Col>

                      {/* Subject Line */}
                      <Col md={6} xs={12}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                          বার্তার বিষয় <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className="input-group-custom">
                          <MessageSquare size={17} className="input-icon" />
                          <input
                            id="contact-subject"
                            value={form.subject}
                            readOnly
                            tabIndex={-1}
                            required
                            placeholder="বার্তার মূল বিষয়"
                            className="contact-input"
                            style={{
                              background: '#F1F5F9',
                              color: '#0F172A',
                              fontWeight: 700,
                              cursor: 'not-allowed',
                              userSelect: 'none'
                            }}
                          />
                        </div>
                      </Col>

                      {/* Dynamic Extra Field based on department */}
                      {DEPARTMENTS.find(d => d.id === activeDepartment)?.extraLabel && (
                        <Col xs={12}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                            {DEPARTMENTS.find(d => d.id === activeDepartment).extraLabel}
                          </label>
                          <input
                            id="contact-extra"
                            value={form.extraField}
                            onChange={e => setForm({ ...form, extraField: e.target.value })}
                            placeholder="প্রাসঙ্গিক তথ্য এখানে লিখুন"
                            className="contact-input"
                          />
                        </Col>
                      )}

                      {/* Message Box */}
                      <Col xs={12}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>
                            আপনার বিস্তারিত বার্তা <span style={{ color: '#EF4444' }}>*</span>
                          </label>
                          <span style={{ fontSize: 11.5, color: '#94A3B8' }}>{form.message.length}/500 অক্ষর</span>
                        </div>
                        <textarea
                          id="contact-message"
                          value={form.message}
                          onChange={e => setForm({ ...form, message: e.target.value.slice(0, 500) })}
                          required
                          rows={4}
                          placeholder="আপনার জিজ্ঞাসা, সমস্যা বা প্রয়োজনীয় সেবা সম্পর্কে বিস্তারিত লিখুন..."
                          className="contact-input"
                          style={{ resize: 'vertical', minHeight: 115 }}
                        />
                      </Col>

                      {/* Submit Button & Privacy note */}
                      <Col xs={12} className="mt-2">
                        <button
                          id="contact-submit"
                          type="submit"
                          disabled={loading}
                          style={{
                            background: 'linear-gradient(135deg, #00B875 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 14,
                            padding: '14px 28px',
                            fontWeight: 800,
                            fontSize: 15,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                            boxShadow: '0 8px 20px rgba(0, 184, 117, 0.3)',
                            transition: 'all 0.25s ease',
                            opacity: loading ? 0.8 : 1
                          }}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                              বার্তা পাঠানো হচ্ছে...
                            </>
                          ) : (
                            <>
                              <Send size={18} /> 
                              <span>বার্তা পাঠান</span>
                            </>
                          )}
                        </button>

                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: 6, 
                          marginTop: 12, 
                          color: '#64748B', 
                          fontSize: 12 
                        }}>
                          <ShieldCheck size={14} color="#059669" />
                          <span>আপনার প্রদত্ত সকল তথ্য কঠোরভাবে সুরক্ষিত ও গোপন রাখা হয়।</span>
                        </div>
                      </Col>
                    </Row>
                  </form>
                </div>
              ) : (
                /* LIVE TRACKING TAB */
                <div>
                  {/* Tracking Header */}
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ 
                        background: '#ECFDF5', 
                        color: '#059669', 
                        fontSize: 12, 
                        fontWeight: 800, 
                        padding: '4px 12px', 
                        borderRadius: 99,
                        border: '1px solid #A7F3D0'
                      }}>
                        লাইভ স্ট্যাটাস ট্র্যাকার
                      </span>
                      <span style={{ color: '#64748B', fontSize: 12.5, fontWeight: 600 }}>
                        • তাৎক্ষণিক ফলাফল
                      </span>
                    </div>
                    <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 'clamp(21px, 3.2vw, 25px)', marginBottom: 6 }}>
                      পূর্বে পাঠানো বার্তার স্ট্যাটাস দেখুন
                    </h3>
                    <p style={{ color: '#64748B', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                      বার্তা প্রেরণের সময় প্রাপ্ত <strong>CID ট্র্যাকিং আইডি</strong> (উদাঃ CID-123456) লিখে অনুসন্ধান করুন।
                    </p>
                  </div>

                  {/* Search Box */}
                  <form onSubmit={(e) => { e.preventDefault(); handleTrack(); }} style={{ marginBottom: 22 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 280px', position: 'relative' }}>
                        <input
                          type="text"
                          value={trackCid}
                          onChange={(e) => setTrackCid(e.target.value.toUpperCase())}
                          placeholder="আপনার CID লিখুন (উদাঃ CID-782914)"
                          style={{
                            width: '100%',
                            height: 48,
                            borderRadius: 14,
                            border: '2px solid #CBD5E1',
                            padding: trackCid ? '0 42px 0 44px' : '0 16px 0 44px',
                            fontSize: 15,
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            letterSpacing: 1,
                            outline: 'none',
                            background: '#FFFFFF'
                          }}
                        />
                        <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: 16, top: 15, pointerEvents: 'none' }} />
                        {trackCid && (
                          <button
                            type="button"
                            onClick={() => {
                              setTrackCid('')
                              setTrackError(null)
                              setTrackResult(null)
                            }}
                            title="মুছে ফেলুন"
                            style={{
                              position: 'absolute',
                              right: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: '#F1F5F9',
                              border: 'none',
                              borderRadius: '50%',
                              width: 26,
                              height: 26,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#64748B',
                              padding: 0,
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#E2E8F0'
                              e.currentTarget.style.color = '#0F172A'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#F1F5F9'
                              e.currentTarget.style.color = '#64748B'
                            }}
                          >
                            <X size={15} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={trackLoading}
                        className="cid-search-btn"
                      >
                        {trackLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                            <span>অনুসন্ধান হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Search size={18} />
                            <span>স্ট্যাটাস যাচাই করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Error Message */}
                  {trackError && (
                    <div style={{
                      background: '#FEF2F2',
                      border: '1.5px solid #FECACA',
                      borderRadius: 14,
                      padding: '14px 18px',
                      marginBottom: 20,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      color: '#991B1B'
                    }}>
                      <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13.5, fontWeight: 700 }}>{trackError}</span>
                    </div>
                  )}

                  {/* Result Display */}
                  {trackResult && (
                    <div className="track-result-card">
                      {/* Top Details */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="track-cid-badge">{trackResult.token_id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(trackResult.token_id, 'result-cid')}
                              className="track-copy-btn"
                              title="কপি করুন"
                            >
                              {copiedField === 'result-cid' ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                              <span>{copiedField === 'result-cid' ? 'কপি হয়েছে' : 'কপি'}</span>
                            </button>
                          </div>

                          <span className={`track-status-pill ${trackResult.status}`}>
                            {trackResult.status === 'replied' ? '✓ উত্তর সম্পন্ন' : (trackResult.status === 'read' ? '• পর্যালোচিত' : '• অপেক্ষমান')}
                          </span>
                        </div>

                        {trackResult.submitted_at && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}>
                            <Clock size={13} />
                            <span>প্রেরণ: {new Date(trackResult.submitted_at).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        )}
                      </div>

                      {/* 2-Column Info Card (Sender & Dept) */}
                      <div className="track-info-card">
                        <div className="track-info-col">
                          <span className="track-info-label">প্রেরকের নাম</span>
                          <span className="track-info-value">{trackResult.name}</span>
                        </div>
                        <div className="track-info-col" style={{ textAlign: 'right' }}>
                          <span className="track-info-label">বিভাগ / বিষয়</span>
                          <span className="track-info-value" style={{ color: '#059669' }}>{trackResult.department || trackResult.subject}</span>
                        </div>
                      </div>

                      {/* Horizontal Stepper Timeline */}
                      <div className="stepper-box">
                        <div className="stepper-title">বার্তার বর্তমান অগ্রগতি:</div>
                        
                        {(() => {
                          const isUnread = trackResult.status === 'unread'
                          const isRead = trackResult.status === 'read'
                          const isReplied = trackResult.status === 'replied'

                          const step1Done = true
                          const step2Done = isRead || isReplied
                          const step3Done = isReplied

                          return (
                            <div className="stepper-track">
                              {/* Step 1 */}
                              <div className="stepper-item step-done">
                                <div className="stepper-node">✓</div>
                                <div className="stepper-label">জমা হয়েছে</div>
                                <div className="stepper-sub">গৃহীত</div>
                              </div>

                              {/* Connector 1 */}
                              <div className={`stepper-connector ${step2Done ? 'active' : ''}`} />

                              {/* Step 2 */}
                              <div className={`stepper-item ${step2Done ? 'step-done' : (isUnread ? 'step-current' : '')}`}>
                                <div className="stepper-node">{step2Done ? '✓' : '২'}</div>
                                <div className="stepper-label">পর্যালোচনাধীন</div>
                                <div className="stepper-sub">{step2Done ? 'দেখা হয়েছে' : 'অপেক্ষমান'}</div>
                              </div>

                              {/* Connector 2 */}
                              <div className={`stepper-connector ${step3Done ? 'active' : ''}`} />

                              {/* Step 3 */}
                              <div className={`stepper-item ${step3Done ? 'step-done' : ''}`}>
                                <div className="stepper-node">{step3Done ? '✓' : '৩'}</div>
                                <div className="stepper-label">উত্তর সম্পন্ন</div>
                                <div className="stepper-sub">{step3Done ? 'প্রদত্ত' : 'প্রক্রিয়াধীন'}</div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>

                      {/* Admin Reply / Note if available */}
                      {trackResult.admin_note ? (
                        <div className="track-reply-card">
                          <div className="track-reply-header">
                            <CheckCircle2 size={18} color="#059669" />
                            <span>প্রতিনিধির অফিসিয়াল উত্তর:</span>
                          </div>
                          <p className="track-reply-body">{trackResult.admin_note}</p>
                          {trackResult.replied_at && (
                            <div style={{ fontSize: 11.5, color: '#047857', marginTop: 8, textAlign: 'right' }}>
                              {new Date(trackResult.replied_at).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="track-pending-card">
                          <Clock size={16} color="#D97706" style={{ flexShrink: 0 }} />
                          <span>আমাদের প্রতিনিধি বার্তাটি পর্যবেক্ষণ করছেন। উত্তর পাওয়া মাত্র এখানে দেখতে পাবেন।</span>
                        </div>
                      )}

                      {/* Original message text preview */}
                      <div className="track-msg-card">
                        <span className="track-msg-badge">আপনার প্রেরিত বার্তা</span>
                        <p className="track-msg-body">{trackResult.message}</p>
                      </div>

                      {/* Bottom Switch button */}
                      <div style={{ marginTop: 14 }}>
                        <button
                          type="button"
                          onClick={() => { setActiveFormTab('send'); setTrackResult(null); setTrackCid(''); }}
                          className="track-new-msg-btn"
                        >
                          <span>নতুন আরেকটি বার্তা পাঠাবেন?</span>
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── CID SUCCESS POPUP MODAL (RESPONSIVE) ── */}
          <Modal
            show={showSuccessModal}
            onHide={() => setShowSuccessModal(false)}
            backdrop="static"
            keyboard={false}
            centered
            size="md"
            dialogClassName="cid-success-modal"
          >
            <div className="cid-modal-card">
              <div className="cid-modal-icon" style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 8px 24px rgba(5, 150, 105, 0.16)',
                border: '2px solid #A7F3D0'
              }}>
                <CheckCircle2 size={38} strokeWidth={2.4} />
              </div>

              <h4 className="cid-modal-title" style={{ fontWeight: 900, color: '#064E3B', fontSize: 22, marginBottom: 8 }}>
                বার্তা সফলভাবে জমা হয়েছে!
              </h4>
              <p className="cid-modal-desc" style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.6, marginBottom: 18, maxWidth: 380, margin: '0 auto 18px' }}>
                আপনার অনুসন্ধানটি আমাদের ডেটাবেসে নথিভুক্ত হয়েছে। বার্তার লাইভ স্ট্যাটাস বা প্রতিনিধির উত্তর দেখার জন্য নিচের ট্র্যাকিং আইডিটি (CID) সংরক্ষণ করুন।
              </p>

              {/* CID Box with Clean Inner Bar (Never Wraps on Mobile) */}
              <div className="cid-token-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    কন্টাক্ট ট্র্যাকিং আইডি (CID)
                  </span>
                  <span style={{ fontSize: 10.5, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                    সংরক্ষণ করুন
                  </span>
                </div>

                <div className="cid-inner-bar">
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: 'clamp(17px, 5.2vw, 21px)',
                    fontWeight: 900,
                    color: '#064E3B',
                    letterSpacing: 1,
                    whiteSpace: 'nowrap',
                    userSelect: 'all',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {newCidToken || 'CID-XXXXXX'}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard && newCidToken) {
                        navigator.clipboard.writeText(newCidToken)
                        setCopiedCid(true)
                        setTimeout(() => setCopiedCid(false), 2500)
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: copiedCid ? '#059669' : '#ECFDF5',
                      color: copiedCid ? '#FFFFFF' : '#047857',
                      border: '1px solid #A7F3D0',
                      borderRadius: 8,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {copiedCid ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedCid ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                  </button>
                </div>
              </div>

              {/* Tip info pill */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 12,
                color: '#475569',
                lineHeight: 1.55,
                marginBottom: 20,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8
              }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
                <span>এই আইডি দিয়ে আপনি যেকোনো সময় এই পৃষ্ঠার <strong>"স্ট্যাটাস দেখুন"</strong> ট্যাবে গিয়ে প্রতিনিধির উত্তর ও অগ্রগতি পর্যবেক্ষণ করতে পারবেন।</span>
              </div>

              {/* Symmetrical Action Buttons (50-50 on mobile) */}
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #00B875 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontWeight: 800,
                    fontSize: 14.5,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 184, 117, 0.3)',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ঠিক আছে
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false)
                    setActiveFormTab('track')
                    setTrackCid(newCidToken)
                    handleTrack(newCidToken)
                  }}
                  style={{
                    flex: 1,
                    background: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  স্ট্যাটাস দেখুন
                </button>
              </div>
            </div>
          </Modal>

          {/* 2. BOTTOM: Office Details on Left & Map on Right (Layout Diagram Part 2) */}
          <Row className="g-4 align-items-stretch">
            {/* Bottom Left: Office Details Card */}
            <Col lg={6} md={12}>
              <div className="contact-info-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, 
                        background: '#ECFDF5', color: '#059669', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <Building2 size={18} />
                      </div>
                      <h4 style={{ fontWeight: 800, color: '#0F172A', fontSize: 17, margin: 0 }}>
                        {contact.office_title || 'প্রধান কার্যালয়'}
                      </h4>
                    </div>

                    <span style={{
                      background: isOfficeOpen ? '#DCFCE7' : '#FEF3C7',
                      color: isOfficeOpen ? '#166534' : '#92400E',
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 99,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span style={{ 
                        width: 7, height: 7, borderRadius: '50%', 
                        background: isOfficeOpen ? '#22C55E' : '#F59E0B', 
                        display: 'inline-block',
                        boxShadow: isOfficeOpen ? '0 0 6px #22C55E' : 'none'
                      }} />
                      {isOfficeOpen ? 'অফিস খোলা রয়েছে' : 'অনলাইন ডেস্ক সক্রিয়'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Corporate Address */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, 
                        background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#475569', flexShrink: 0 
                      }}>
                        <MapPin size={17} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, marginBottom: 2 }}>ঠিকানা ও অবস্থান</div>
                        <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
                          {addressValue}
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, 
                        background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#2563EB', flexShrink: 0 
                      }}>
                        <Mail size={17} />
                      </div>
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, marginBottom: 2 }}>অফিসিয়াল ইমেইল</div>
                        <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-all' }}>
                          {emailValue}
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleCopy(emailValue, 'officeEmail')}
                        style={{ 
                          border: 'none', background: '#F1F5F9', color: '#475569', 
                          borderRadius: 8, padding: '5px 8px', fontSize: 11.5, 
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 
                        }}
                        title="ইমেইল কপি করুন"
                      >
                        {copiedField === 'officeEmail' ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                        <span>{copiedField === 'officeEmail' ? 'কপি হয়েছে' : 'কপি'}</span>
                      </button>
                    </div>

                    {/* Office Hours */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, 
                        background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#E11D48', flexShrink: 0 
                      }}>
                        <Clock size={17} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, marginBottom: 2 }}>কার্যক্রমের সময়সূচী</div>
                        <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
                          {officeHoursValue}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 700, marginTop: 2 }}>
                          অনলাইন সিরিয়াল ও হটলাইন: ২৪ ঘণ্টা চালু
                        </div>
                      </div>
                    </div>

                    {/* Official Portal */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, 
                        background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#9333EA', flexShrink: 0 
                      }}>
                        <Globe size={17} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, marginBottom: 2 }}>অফিসিয়াল পোর্টাল</div>
                        <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
                          {site.website || 'www.doctorbooklet.com.bd'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </Col>

            {/* Bottom Right: Interactive Google Map Embed Card */}
            <Col lg={6} md={12}>
              <div id="office-map" className="contact-info-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, 
                        background: '#EFF6FF', color: '#2563EB', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <Navigation size={18} />
                      </div>
                      <h4 style={{ fontWeight: 800, color: '#0F172A', fontSize: 17, margin: 0 }}>
                        ম্যাপ লোকেশন ও ডিরেকশন
                      </h4>
                    </div>

                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressValue)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#059669', 
                        fontSize: 12.5, 
                        fontWeight: 800, 
                        textDecoration: 'none', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 4 
                      }}
                    >
                      <span>গুগল ম্যাপে ডিরেকশন</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>

                  <div style={{ borderRadius: 16, overflow: 'hidden', height: 260, position: 'relative' }}>
                    {contact.map_embed ? (
                      <iframe 
                        src={contact.map_embed} 
                        width="100%" 
                        height="260" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade" 
                        title="Doctor Booklet Office Location Map" 
                      />
                    ) : (
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14608.036944849319!2d90.36710724874272!3d23.747049993356064!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b33cffc3fb%3A0x4a826f475fd312af!2sDhanmondi%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1710000000000!5m2!1sen!2sbd"
                        width="100%"
                        height="260"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Doctor Booklet Dhanmondi Map"
                      />
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 700 }}>{contact.office_title || 'প্রধান কার্যালয়'} — {addressValue.split(',').slice(-2).join(',').trim() || 'ধানমন্ডি, ঢাকা'}</span>
                  <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>{site.name || 'Doctor Booklet Bangladesh'}</span>
                </div>
              </div>
            </Col>
          </Row>

          {/* ── QUICK FAQ ACCORDION SECTION ── */}
          <div style={{ marginTop: 55 }}>
            <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 28px' }}>
              <span style={{ 
                background: '#ECFDF5', 
                color: '#059669', 
                fontSize: 12, 
                fontWeight: 800, 
                padding: '4px 14px', 
                borderRadius: 99, 
                border: '1px solid #A7F3D0',
                display: 'inline-block',
                marginBottom: 8
              }}>
                দ্রুত সমাধান (Quick FAQs)
              </span>
              <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 'clamp(20px, 3.2vw, 26px)', margin: '0 0 6px' }}>
                যোগাযোগের আগে সাধারণ জিজ্ঞাসাসমূহ
              </h3>
              <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
                আপনার কাঙ্ক্ষিত প্রশ্নের তাৎক্ষণিক সমাধান নিচে পেয়ে যেতে পারেন
              </p>
            </div>

            <Row className="justify-content-center">
              <Col lg={10}>
                {FAQS.map((faq, idx) => {
                  const isOpen = activeFaq === idx
                  return (
                    <div 
                      key={idx} 
                      className={`contact-faq-item ${isOpen ? 'active' : ''}`}
                    >
                      <button 
                        type="button"
                        className="contact-faq-header"
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                      >
                        <span
                          className="contact-faq-q-badge"
                          style={{
                            background: isOpen ? '#00B875' : '#F1F5F9',
                            color: isOpen ? '#FFFFFF' : '#64748B',
                            border: isOpen ? '1px solid #00B875' : '1px solid #E2E8F0'
                          }}
                        >
                          ?
                        </span>
                        <span className="contact-faq-q-text" style={{ color: isOpen ? '#15803D' : '#1E293B' }}>
                          {faq.q}
                        </span>
                        <span
                          className="contact-faq-icon"
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
                        <div className="contact-faq-body">
                          <div style={{ height: 1, background: '#F1F5F9', marginBottom: 12 }} />
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* More Questions / Help Center Button */}
                <div className="faq-more-wrapper">
                  <Link
                    to="/support"
                    className="btn-faq-more"
                  >
                    <HelpCircle size={18} />
                    <span>সকল প্রশ্নোত্তর ও সাহায্য কেন্দ্র</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>
    </div>
  )
}

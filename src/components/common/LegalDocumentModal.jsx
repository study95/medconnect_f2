import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { getContent } from '../../utils/contentService'
import { ShieldCheck, Lock, RotateCcw, ExternalLink, Check, X, AlertCircle } from 'lucide-react'

export default function LegalDocumentModal({ show, type = 'terms', onClose, onAgree }) {
  if (!show) return null

  const cms = getContent()

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
    title: 'গোপনীয়তা ও ডেটা সুরক্ষা নীতি (Privacy Policy)',
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
    title: 'রিফান্ড ও বাতিলকরণ নীতি (Refund Policy)',
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
      }
    ]
  }

  // Pick document data
  let doc = defaultTerms
  let icon = <ShieldCheck size={20} color="#00B875" />
  let themeColor = '#00B875'

  if (type === 'privacy') {
    doc = cms.legal_privacy || defaultPrivacy
    icon = <Lock size={20} color="#0D9488" />
    themeColor = '#0D9488'
  } else if (type === 'refund') {
    doc = cms.legal_refund || defaultRefund
    icon = <RotateCcw size={20} color="#0284C7" />
    themeColor = '#0284C7'
  } else {
    doc = cms.legal_terms || defaultTerms
    icon = <ShieldCheck size={20} color="#00B875" />
    themeColor = '#00B875'
  }

  const sections = doc.sections && doc.sections.length > 0 
    ? doc.sections 
    : (type === 'privacy' ? defaultPrivacy.sections : defaultTerms.sections)

  const handleAgreeAndClose = () => {
    if (onAgree) onAgree()
    onClose()
  }

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="lg"
      backdrop="static"
      style={{ zIndex: 1060 }}
      dialogClassName="legal-modal-dialog"
      contentClassName="border-0 shadow-2xl rounded-4 overflow-hidden"
    >
      <style>{`
        .legal-modal-dialog {
          max-width: 760px !important;
          margin: 1.75rem auto;
        }
        @media (max-width: 768px) {
          .legal-modal-dialog {
            margin: 8px auto !important;
            max-width: calc(100vw - 16px) !important;
          }
        }
        .legal-modal-container {
          background: #FFFFFF;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 85vh;
          max-height: 85vh;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
        }
        @media (max-width: 768px) {
          .legal-modal-container {
            height: 94vh !important;
            max-height: 94vh !important;
            border-radius: 16px !important;
          }
        }

        /* ── HEADER ── */
        .legal-modal-header {
          padding: 18px 24px;
          background: linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%);
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .legal-modal-header {
            padding: 12px 14px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
        }

        .legal-header-top-mobile {
          display: none;
        }
        @media (max-width: 768px) {
          .legal-header-top-mobile {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            width: 100%;
          }
          .legal-header-actions-desktop {
            display: none !important;
          }
          .legal-header-compliance-badge-desktop {
            display: none !important;
          }
        }

        .legal-header-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }
        @media (max-width: 768px) {
          .legal-header-title-row {
            gap: 10px !important;
            width: 100% !important;
          }
        }

        .legal-doc-title {
          margin: 0;
          font-weight: 800;
          color: #0F172A;
          font-size: 18px;
          line-height: 1.35;
          word-break: normal;
          overflow-wrap: break-word;
        }
        @media (max-width: 768px) {
          .legal-doc-title {
            font-size: 15.5px !important;
            line-height: 1.3 !important;
          }
        }

        /* ── BODY ── */
        .legal-modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
          line-height: 1.7;
          color: #334155;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 768px) {
          .legal-modal-body {
            padding: 12px 14px !important;
            line-height: 1.6 !important;
          }
        }

        .legal-clause-card {
          padding: 16px 18px;
          border-radius: 14px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }
        @media (max-width: 768px) {
          .legal-clause-card {
            padding: 12px 13px !important;
            border-radius: 12px !important;
          }
        }

        .legal-clause-text {
          margin: 0;
          font-size: 13.5px;
          color: #475569;
          line-height: 1.65;
        }
        @media (max-width: 768px) {
          .legal-clause-text {
            font-size: 12.5px !important;
            line-height: 1.6 !important;
          }
        }

        /* ── FOOTER ── */
        .legal-modal-footer {
          padding: 14px 24px;
          background: #F8FAFC;
          border-top: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .legal-modal-footer {
            padding: 10px 14px !important;
            flex-direction: column-reverse !important;
            gap: 8px !important;
            align-items: stretch !important;
          }
          .legal-footer-date {
            text-align: center !important;
            font-size: 11px !important;
            opacity: 0.85;
          }
          .legal-footer-btns {
            display: flex !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .legal-footer-btn-close {
            flex: 1 !important;
            padding: 9px 8px !important;
            font-size: 13px !important;
          }
          .legal-footer-btn-agree {
            flex: 2 !important;
            padding: 9px 12px !important;
            font-size: 13px !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <div className="legal-modal-container">
        {/* MODAL HEADER */}
        <div className="legal-modal-header">
          {/* Top Bar for Mobile View */}
          <div className="legal-header-top-mobile">
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10.5,
              fontWeight: 800,
              color: themeColor,
              background: 'rgba(0, 184, 117, 0.1)',
              padding: '3px 8px',
              borderRadius: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              অফিসিয়াল আইনি দলিল
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <a
                href={`/legal?tab=${type}`}
                target="_blank"
                rel="noopener noreferrer"
                title="নতুন ট্যাবে সম্পূর্ণ পেজ দেখুন"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 9px',
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#065F46',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  textDecoration: 'none'
                }}
              >
                <ExternalLink size={12} />
                <span>ট্যাবে খুলুন</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Title Row */}
          <div className="legal-header-title-row">
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0, 184, 117, 0.12)',
              border: '1px solid #DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="legal-header-compliance-badge-desktop" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 800,
                color: themeColor,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 2
              }}>
                অফিসিয়াল আইনি দলিল • DOCTOR BOOKLET COMPLIANCE
              </div>
              <h5 className="legal-doc-title">
                {doc.title}
              </h5>
            </div>
          </div>

          {/* Actions for Desktop View */}
          <div className="legal-header-actions-desktop" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
              href={`/legal?tab=${type}`}
              target="_blank"
              rel="noopener noreferrer"
              title="নতুন ট্যাবে সম্পূর্ণ পেজ দেখুন"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 9,
                fontSize: 12.5,
                fontWeight: 700,
                color: '#065F46',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#D1FAE5'
                e.currentTarget.style.borderColor = '#6EE7B7'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#ECFDF5'
                e.currentTarget.style.borderColor = '#A7F3D0'
              }}
            >
              <ExternalLink size={14} />
              <span>ট্যাবে খুলুন</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#F1F5F9'
                e.currentTarget.style.color = '#0F172A'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#FFFFFF'
                e.currentTarget.style.color = '#64748B'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE DOCUMENT) */}
        <div className="legal-modal-body">
          {doc.subtitle && (
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>
              {doc.subtitle}
            </p>
          )}

          {doc.notice && (
            <div style={{
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start'
            }}>
              <AlertCircle size={16} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600, lineHeight: 1.5 }}>
                {doc.notice}
              </div>
            </div>
          )}

          {/* Clauses / Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sections.map((sec, idx) => (
              <div key={idx} className="legal-clause-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: 5,
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#0F172A',
                    flexShrink: 0
                  }}>
                    ধারা {sec.num}
                  </span>
                  <h6 style={{ margin: 0, fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
                    {sec.heading}
                  </h6>
                </div>
                <p className="legal-clause-text">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="legal-modal-footer">
          <div className="legal-footer-date" style={{ fontSize: 12, color: '#64748B' }}>
            কার্যকরী তারিখ: <strong>{doc.effective_date || 'অক্টোবর ২০২৬'}</strong>
          </div>

          <div className="legal-footer-btns" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              variant="outline-secondary"
              onClick={onClose}
              className="legal-footer-btn-close"
              style={{
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                padding: '8px 18px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569'
              }}
            >
              বন্ধ করুন
            </Button>

            {onAgree && (
              <Button
                onClick={handleAgreeAndClose}
                className="legal-footer-btn-agree"
                style={{
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, #00B875 0%, #009960 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)'
                }}
              >
                <Check size={16} />
                <span>আমি পড়েছি ও সম্মত</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

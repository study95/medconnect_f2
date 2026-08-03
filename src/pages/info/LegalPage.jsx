import { useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import BreadcrumbHUD from '../../components/common/BreadcrumbHUD'
import { useTheme } from '../../context/ThemeContext'
import { 
  IconShieldCheck, 
  IconLock, 
  IconReceiptRefund, 
  IconMail, 
  IconInfoCircle,
  IconCheck,
  IconFileText,
  IconClock
} from '@tabler/icons-react'

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState('terms')
  const { theme } = useTheme()

  const tabs = [
    { 
      id: 'terms', 
      title: 'ব্যবহারের শর্তাবলী', 
      englishTitle: 'Terms of Service',
      icon: <IconShieldCheck size={20} />,
      updatedDate: '২৪ জুলাই, ২০২৬'
    },
    { 
      id: 'privacy', 
      title: 'গোপনীয়তা নীতি', 
      englishTitle: 'Privacy Policy',
      icon: <IconLock size={20} />,
      updatedDate: '২৪ জুলাই, ২০২৬'
    },
    { 
      id: 'refund', 
      title: 'রিফান্ড ও বাতিলকরণ নীতি', 
      englishTitle: 'Refund & Cancellation Policy',
      icon: <IconReceiptRefund size={20} />,
      updatedDate: '২৪ জুলাই, ২০২৬'
    }
  ]

  const legalContent = {
    terms: {
      title: 'ব্যবহারের শর্তাবলী (Terms of Service)',
      subtitle: 'Doctor Booklet ডিজিটাল স্বাস্থ্যসেবা প্ল্যাটফর্ম ব্যবহারের জন্য আবশ্যকীয় নিয়ম ও সুবিধাসমূহ।',
      notice: 'দয়া করে Doctor Booklet সার্ভিস ব্যবহারের পূর্বে নিম্নোক্ত শর্তাবলী মনোযোগ দিয়ে পড়ুন। প্ল্যাটফর্মটি ব্যবহারের মাধ্যমে আপনি এই নিয়মাবলীতে সম্মত বলে গণ্য হবেন।',
      sections: [
        {
          num: '১.১',
          heading: 'ভূমিকা ও সেবা পরিচিতি',
          content: 'Doctor Booklet একটি সমন্বিত ডিজিটাল হেলথকেয়ার প্ল্যাটফর্ম যা রোগী, অভিজ্ঞ চিকিৎসক এবং স্বনামধন্য হাসপাতালগুলোর মধ্যে দ্রুত ও নিরবচ্ছিন্ন সংযোগ নিশ্চিত করে। প্ল্যাটফর্মটির মাধ্যমে অনলাইন সিরিয়াল বুকিং, হেলথ রেকর্ড সংরক্ষণ এবং স্বাস্থ্যসেবা সংক্রান্ত তথ্যাদি প্রদান করা হয়।'
        },
        {
          num: '১.২',
          heading: 'অ্যাকাউন্ট নিবন্ধন ও তথ্য সঠিকতা',
          content: 'আমাদের প্ল্যাটফর্মে অ্যাকাউন্ট তৈরির সময় আপনাকে সঠিক ও হালনাগাদ তথ্য প্রদান করতে হবে। আপনার অ্যাকাউন্টের গোপনীয়তা ও পাসওয়ার্ডের নিরাপত্তার পূর্ণ দায়িত্ব আপনার। ভুল বা মিথ্যা তথ্য প্রদানের কারণে কোনো জটিলতা তৈরি হলে Doctor Booklet কর্তৃপক্ষ দায়ী থাকবে না।'
        },
        {
          num: '১.৩',
          heading: 'ডাক্তার অ্যাপয়েন্টমেন্ট ও সিরিয়াল বুকিং',
          content: 'Doctor Booklet প্ল্যাটফর্মের মাধ্যমে ডাক্তার বা হাসপাতালের অ্যাপয়েন্টমেন্ট কনফার্মেশনের পর একটি ডিজিটালি ভেরিফাইড সিরিয়াল কার্ড প্রদান করা হয়। নির্ধারিত সময়ে চেম্বারে উপস্থিত হওয়া রোগীর দায়িত্ব। চেম্বারের জরুরি পরিস্থিতি বা ডাক্তার সাহেবের সময়সূচি পরিবর্তনের কারণে সিরিয়াল সময় সাময়িক পরিবর্তিত হতে পারে।'
        },
        {
          num: '১.৪',
          heading: 'মেডিকেল ডিসক্লেমার ও সীমাবদ্ধতা',
          content: 'Doctor Booklet সরাসরি কোনো চিকিৎসা সেবা বা জরুরি অ্যাম্বুলেন্স সেবা প্রদান করে না। এটি একটি প্রযুক্তিগত প্ল্যাটফর্ম যা রোগী ও স্বাস্থ্যসেবা প্রদানকারীদের সংযোগ ঘটায়। যেকোনো তীব্র শারীরিক জরুরি অবস্থায় (Emergency) অনুগ্রহ করে নিকটস্থ হাসপাতালের ইমার্জেন্সি বিভাগে সরাসরি যোগাযোগ করুন।'
        },
        {
          num: '১.৫',
          heading: 'ব্যবহারকারীর আচরণ বিধি',
          content: 'প্ল্যাটফর্মে যেকোনো অনৈতিক, বেআইনি বা উদ্দেশ্যপ্রণোদিত ভুল তথ্য প্রদান কঠোরভাবে নিষিদ্ধ। প্ল্যাটফর্মের কোনো ডেটা বা সিস্টেম ক্ষতিগ্রস্ত করার চেষ্টা করা হলে সংশ্লিষ্ট অ্যাকাউন্টের অ্যাক্সেস স্থায়ীভাবে বাতিল করা হবে এবং আইনি ব্যবস্থা গ্রহণ করা হতে পারে।'
        },
        {
          num: '১.৬',
          heading: 'মেধা সম্পত্তি ও স্বত্বাধিকার',
          content: 'Doctor Booklet ওয়েবসাইটের লোগো, কনটেন্ট, ইন্টারফেস ডিজাইন এবং সকল সফ্টওয়্যার কোড Doctor Booklet-এর নিজস্ব সম্পদ। পূর্বানুমতি ব্যতিরেকে এগুলো কপি বা বাণিজ্যিক উদ্দেশ্যে ব্যবহার করা সম্পূর্ণ আইনত দণ্ডনীয়।'
        }
      ]
    },
    privacy: {
      title: 'গোপনীয়তা নীতি (Privacy Policy)',
      subtitle: 'আপনার ব্যক্তিগত ও চিকিৎসা সংক্রান্ত তথ্যের নিরাপত্তা এবং গোপনীয়তা রক্ষায় আমাদের অঙ্গীকার।',
      notice: 'Doctor Booklet আপনার তথ্যের সর্বোচ্চ সুরক্ষায় বিশ্বমানের এনক্রিপশন ও সিকিউরিটি প্রোটোকল অনুসরণ করে। আমরা আপনার সম্মতি ছাড়া কোনো ব্যক্তিগত তথ্য বাণিজ্যিক উদ্দেশ্যে বিক্রি করি না।',
      sections: [
        {
          num: '২.১',
          heading: 'তথ্য সংগ্রহ ও এর ধরন',
          content: 'সেবা প্রদানের লক্ষ্যে আমরা ব্যবহারকারীর নাম, ফোন নম্বর, ইমেইল ঠিকানা, জন্মতারিখ, লিঙ্গ এবং প্রয়োজনীয় ক্ষেত্রে পূর্ববর্তী স্বাস্থ্য বিবরণী সংগ্রহ করে থাকি। এই তথ্যসমূহ শুধুমাত্র অ্যাপয়েন্টমেন্ট বুকিং ও মানসম্মত সেবা নিশ্চিত করতে ব্যবহৃত হয়।'
        },
        {
          num: '২.২',
          heading: 'স্বাস্থ্য তথ্যের সর্বোচ্চ গোপনীয়তা',
          content: 'আপনার চিকিৎসা রেকর্ড ও ব্যক্তিগত স্বাস্থ্য সংক্রান্ত তথ্য অত্যন্ত সংবেদনশীল। শুধুমাত্র আপনার অনুমোদিত ডাক্তার বা সংশ্লিষ্ট হাসপাতাল অ্যাপয়েন্টমেন্ট চলাকালীন আপনার প্রয়োজনীয় স্বাস্থ্য তথ্য দেখতে পারবেন।'
        },
        {
          num: '২.৩',
          heading: 'তথ্য নিরাপত্তা ও এনক্রিপশন',
          content: 'Doctor Booklet-এ সংরক্ষিত সকল ডেটা SSL/TLS এনক্রিপশন এবং নিরাপদ ক্লাউড সার্ভারে সংরক্ষণের মাধ্যমে সুরক্ষিত রাখা হয়। আমরা অননুমোদিত অ্যাক্সেস বা সাইবার আক্রমণ প্রতিরোধে নিয়মিত সিকিউরিটি অডিট পরিচালনা করি।'
        },
        {
          num: '২.৪',
          heading: 'তৃতীয় পক্ষের সাথে তথ্য শেয়ারিং নীতি',
          content: 'আমরা কোনো বীমা কোম্পানি, বিজ্ঞাপনদাতা বা থার্ড পার্টি মার্কেটিং এজেন্সির কাছে ব্যবহারকারীর কোনো তথ্য বিক্রি বা শেয়ার করি না। আইন প্রয়োগকারী সংস্থা কর্তৃক বাধ্যতামূলক আইনি আদেশ ব্যতীত কোনো অবস্থায় তথ্য প্রকাশ করা হয় না।'
        },
        {
          num: '২.৫',
          heading: 'ব্যবহারকারীর অধিকার ও ডেটা মুছে ফেলার অনুরোধ',
          content: 'আপনার নিজস্ব তথ্য সংশোধন, আপডেট কিংবা প্ল্যাটফর্ম থেকে আপনার ডিরেক্টরি প্রোফাইল মুছে ফেলার পূর্ণ অধিকার রয়েছে। যেকোনো ডেটা ডিলিটেশনের জন্য আমাদের সাপোর্ট ইমেইলে লিখিত অনুরোধ জানাতে পারেন।'
        }
      ]
    },
    refund: {
      title: 'রিফান্ড ও বাতিলকরণ নীতি (Refund & Cancellation Policy)',
      subtitle: 'অ্যাপয়েন্টমেন্ট বাতিল, ফি রিফান্ড এবং অর্থ ফেরত সংক্রান্ত স্বচ্ছ নিয়মাবলী।',
      notice: 'রোগীদের সুবিধার্থে সহজ ও স্বচ্ছ রিফান্ড নীতি প্রণয়ন করা হয়েছে। অনাকাঙ্ক্ষিত পরিস্থিতিতে অ্যাপয়েন্টমেন্ট বাতিল হলে নিয়ম অনুযায়ী ফি ফেরত দেওয়া হয়।',
      sections: [
        {
          num: '৩.১',
          heading: 'রোগী কর্তৃক অ্যাপয়েন্টমেন্ট বাতিলকরণ',
          content: 'নির্ধারিত অ্যাপয়েন্টমেন্টের সময়সূচির অন্তত ৬ ঘণ্টা পূর্বে অ্যাপয়েন্টমেন্ট বাতিল করলে পরিশোধিত সার্ভিস চার্জ বা ফি সম্পূর্ণ রিফান্ড পাওয়ার যোগ্য হবেন।'
        },
        {
          num: '৩.২',
          heading: 'ডাক্তার বা হাসপাতাল কর্তৃক বাতিলকরণ',
          content: 'যদি কোনো অনাকাঙ্ক্ষিত কারণে ডাক্তার সাহেব অনুপস্থিত থাকেন অথবা হাসপাতাল কর্তৃপক্ষ অ্যাপয়েন্টমেন্ট বাতিল ঘোষণা করে, তবে রোগী ১০০% রিফান্ড পাবেন অথবা সুবিধাজনক পরবর্তী স্লটে ফ্রিতে পুনর্নির্ধারণ (Reschedule) করতে পারবেন।'
        },
        {
          num: '৩.৩',
          heading: 'রিফান্ড প্রসেসিং সময় ও মাধ্যম',
          content: 'অনুমোদিত রিফান্ডের টাকা সাধারণত ৩ থেকে ৭ কর্মদিবসের (Working Days) মধ্যে ব্যবহারকারীর মূল পেমেন্ট মাধ্যমে (বিকাশ, নগদ, রকেট বা ব্যাংক কার্ড) স্বয়ংক্রিয়ভাবে জমা হয়ে যায়।'
        },
        {
          num: '৩.৪',
          heading: 'অফ ফেরতযোগ্য ক্ষেত্রসমূহ (Non-Refundable Cases)',
          content: 'যদি রোগী নির্দিষ্ট সময়ে চেম্বারে উপস্থিত হতে না পারেন (No-Show) এবং সময় পার হওয়ার পূর্বে বাতিল না করেন, তবে উক্ত অ্যাপয়েন্টমেন্টের ফি অফ ফেরতযোগ্য বলে গণ্য হবে।'
        },
        {
          num: '৩.৫',
          heading: 'সহায়তা ও ক্লেম প্রক্রিয়া',
          content: 'রিফান্ড সংক্রান্ত যেকোনো জটিলতা বা অনুসন্ধানের জন্য হেল্পলাইন নম্বর অথবা refund@doctorbooklet.com.bd ইমেইলে ট্রানজেকশন আইডি সহ যোগাযোগ করতে অনুরোধ করা যাচ্ছে।'
        }
      ]
    }
  }

  const activeContent = legalContent[activeTab]
  const activeTabMeta = tabs.find(t => t.id === activeTab)

  return (
    <div className="page-wrapper" style={{ background: 'var(--mc-bg, #F8FAFC)', paddingBottom: 100, minHeight: '80vh' }}>
      <Container className="pt-4">
        {/* Breadcrumb */}
        <BreadcrumbHUD links={[{ label: 'আইনি ও পলিসি কেন্দ্র' }]} />

        {/* Hero Banner Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          borderRadius: 5,
          padding: '40px 36px',
          color: 'white',
          marginTop: 20,
          marginBottom: 36,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)'
        }}>
          {/* Subtle Glows */}
          <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, background: 'radial-gradient(circle, rgba(0,212,175,0.25) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -40, width: 220, height: 220, background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: 800 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 5, background: 'rgba(0,212,175,0.12)', border: '1px solid rgba(0,212,175,0.3)', color: '#00D4AF', fontSize: 13, fontWeight: 800, marginBottom: 16 }}>
              <IconShieldCheck size={16} /> Doctor Booklet Legal Documentation
            </div>
            <h1 style={{ fontWeight: 900, fontSize: 'clamp(26px, 4vw, 36px)', color: 'white', marginBottom: 12, letterSpacing: '-0.5px' }}>
              আইনি ও অফিসিয়াল পলিসি কেন্দ্র
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
              আমাদের প্ল্যাটফর্মের ব্যবহারবিধি, গোপনীয়তা সুরক্ষা এবং বাতিলকরণ নীতি সম্পর্কিত বিস্তারিত দিকনির্দেশনা নিচে প্রদান করা হলো।
            </p>
          </div>
        </div>

        <Row className="g-4">
          {/* Sidebar Tabs */}
          <Col lg={4} xl={3}>
            <div style={{ 
              background: theme === 'dark' ? '#1E293B' : '#FFFFFF', 
              borderRadius: 5, 
              padding: 20, 
              border: '1px solid var(--mc-border, rgba(0,0,0,0.08))',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              position: 'sticky',
              top: 110
            }}>
              <h6 style={{ 
                fontSize: 12, 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em', 
                color: 'var(--mc-text-muted, #64748B)',
                marginBottom: 16,
                paddingLeft: 8
              }}>
                নীতিসূচি (Policies)
              </h6>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        textAlign: 'left',
                        padding: '16px 18px',
                        borderRadius: 5,
                        border: isActive ? '1px solid #00D4AF' : '1px solid transparent',
                        background: isActive 
                          ? (theme === 'dark' ? 'rgba(0,212,175,0.15)' : '#ECFDF5') 
                          : (theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC'),
                        color: isActive ? (theme === 'dark' ? '#00D4AF' : '#047857') : 'var(--mc-text, #1E293B)',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: 14,
                        transition: 'all 0.25s ease',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        gap: 12,
                        width: '100%'
                      }}
                    >
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 36, 
                        height: 36, 
                        borderRadius: 5, 
                        background: isActive ? '#00A88C' : 'rgba(0,0,0,0.05)', 
                        color: isActive ? 'white' : 'var(--mc-text-muted, #64748B)',
                        flexShrink: 0,
                        transition: 'all 0.25s ease'
                      }}>
                        {tab.icon}
                      </span>
                      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 14, fontWeight: isActive ? 800 : 700, lineHeight: 1.3 }}>
                          {tab.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--mc-text-muted, #64748B)', marginTop: 2, fontWeight: 500 }}>
                          {tab.englishTitle}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Quick Contact Box */}
              <div style={{ 
                marginTop: 24, 
                padding: 16, 
                borderRadius: 5, 
                background: 'linear-gradient(135deg, rgba(0,168,140,0.08) 0%, rgba(0,168,140,0.02) 100%)', 
                border: '1px solid rgba(0,168,140,0.2)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00A88C', fontWeight: 800, fontSize: 13, marginBottom: 6 }}>
                  <IconInfoCircle size={18} /> সহায়তার জন্য
                </div>
                <p style={{ fontSize: 12, color: 'var(--mc-text-muted, #475569)', margin: 0, lineHeight: 1.5 }}>
                  যেকোনো আইনি প্রশ্ন বা সহায়তার জন্য ইমেইল করুন:
                </p>
                <a href="mailto:legal@doctorbooklet.com.bd" style={{ fontSize: 12, fontWeight: 800, color: '#00A88C', textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
                  legal@doctorbooklet.com.bd
                </a>
              </div>
            </div>
          </Col>

          {/* Main Content Area */}
          <Col lg={8} xl={9}>
            <div style={{ 
              background: theme === 'dark' ? '#1E293B' : '#FFFFFF', 
              borderRadius: 5, 
              padding: 'clamp(24px, 4vw, 48px)', 
              border: '1px solid var(--mc-border, rgba(0,0,0,0.08))', 
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)' 
            }}>
              {/* Document Header */}
              <div style={{ borderBottom: '1px solid var(--mc-border, rgba(0,0,0,0.08))', paddingBottom: 24, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: 5, 
                    background: '#ECFDF5', 
                    color: '#047857', 
                    fontSize: 12, 
                    fontWeight: 800, 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 6 
                  }}>
                    <IconCheck size={14} /> অফিসিয়াল পলিসি
                  </span>
                  <span style={{ 
                    fontSize: 13, 
                    color: 'var(--mc-text-muted, #64748B)', 
                    fontWeight: 600, 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 6 
                  }}>
                    <IconClock size={14} /> সর্বশেষ হালনাগাদ: {activeTabMeta?.updatedDate}
                  </span>
                </div>

                <h2 style={{ 
                  fontWeight: 900, 
                  fontSize: 'clamp(22px, 3vw, 30px)', 
                  color: 'var(--mc-text, #0F172A)', 
                  marginBottom: 10,
                  letterSpacing: '-0.5px'
                }}>
                  {activeContent.title}
                </h2>
                
                <p style={{ fontSize: 16, color: 'var(--mc-text-muted, #475569)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                  {activeContent.subtitle}
                </p>
              </div>

              {/* Callout Notice */}
              <div style={{ 
                padding: '18px 22px', 
                borderRadius: 5, 
                background: 'rgba(0, 168, 140, 0.05)', 
                borderLeft: '4px solid #00A88C', 
                marginBottom: 36 
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <IconFileText size={22} color="#00A88C" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--mc-text, #1E293B)', lineHeight: 1.6, fontWeight: 600 }}>
                    {activeContent.notice}
                  </p>
                </div>
              </div>

              {/* Policy Clauses / Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {activeContent.sections.map((section, index) => (
                  <div 
                    key={index}
                    style={{ 
                      paddingBottom: index !== activeContent.sections.length - 1 ? 28 : 0,
                      borderBottom: index !== activeContent.sections.length - 1 ? '1px dashed var(--mc-border, rgba(0,0,0,0.08))' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 900, 
                        color: '#00A88C', 
                        background: 'rgba(0,168,140,0.1)', 
                        padding: '2px 8px', 
                        borderRadius: 5 
                      }}>
                        ধারাক্রম {section.num}
                      </span>
                      <h4 style={{ 
                        fontWeight: 800, 
                        fontSize: 18, 
                        color: 'var(--mc-text, #0F172A)', 
                        margin: 0 
                      }}>
                        {section.heading}
                      </h4>
                    </div>
                    
                    <p style={{ 
                      fontSize: 15, 
                      color: 'var(--mc-text-muted, #334155)', 
                      lineHeight: 1.8, 
                      fontWeight: 500, 
                      margin: 0 
                    }}>
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Document Footer Verification */}
              <div style={{ 
                marginTop: 48, 
                padding: '24px 28px', 
                borderRadius: 5, 
                background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC', 
                border: '1px solid var(--mc-border, rgba(0,0,0,0.06))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 5, background: 'linear-gradient(135deg, #00E5BC 0%, #00967D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <IconShieldCheck size={24} />
                  </div>
                  <div>
                    <h6 style={{ margin: 0, fontWeight: 800, fontSize: 14, color: 'var(--mc-text, #0F172A)' }}>Doctor Booklet Legal Compliance Team</h6>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--mc-text-muted, #64748B)', fontWeight: 500 }}>ঢাকা, বাংলাদেশ • সর্বস্বত্ব সংরক্ষিত</p>
                  </div>
                </div>

                <a 
                  href="mailto:legal@doctorbooklet.com.bd"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 5,
                    background: '#00A88C',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <IconMail size={16} /> সরাসরি যোগাযোগ করুন
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

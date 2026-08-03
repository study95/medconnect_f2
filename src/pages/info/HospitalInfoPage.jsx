import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { IconBuildingHospital, IconLayoutDashboard, IconUsersGroup, IconSearch, IconArrowRight, IconShieldCheck, IconSettingsAutomation } from '@tabler/icons-react'

function HospitalInfoPage() {
  const benefits = [
    { icon: <IconLayoutDashboard size={32} />, title: 'সেন্ট্রাল ম্যানেজমেন্ট ড্যাশবোর্ড', desc: 'একটি মাত্র প্যানেল থেকে আপনার হাসপাতালের সকল ডাক্তার ও সার্ভিস নিয়ন্ত্রণ করুন।' },
    { icon: <IconUsersGroup size={32} />, title: 'রোগী ব্যবস্থাপনা', desc: 'রোগীদের তথ্য এবং অ্যাপয়েন্টমেন্ট হিস্ট্রি ডিজিটালি সংরক্ষণ করুন।' },
    { icon: <IconSearch size={32} />, title: 'সার্চ রেজাল্টে প্রাধান্য', desc: 'আপনার এলাকার রোগীরা যখন হাসপাতাল খুঁজবে, তখন আপনাকে সবার আগে দেখাবে।' },
    { icon: <IconSettingsAutomation size={32} />, title: 'অটোমেটেড শিডিউলিং', desc: 'ডাক্তারদের রোস্টার এবং ডিউটি ম্যানেজমেন্ট আরও সহজ ও নির্ভুল করুন।' },
  ]

  return (
    <div style={{ background: '#FDF4FF', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{ 
        position: 'relative',
        padding: '120px 0 180px', 
        color: 'white',
        textAlign: 'center',
        overflow: 'hidden',
        background: '#701A75'
      }}>
        {/* Background Image with Overlay */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundImage: 'url("https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1600&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0
        }} />
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'linear-gradient(135deg, rgba(112, 26, 117, 0.75) 0%, rgba(217, 70, 239, 0.65) 100%)',
          zIndex: 1
        }} />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: 99, display: 'inline-block', marginBottom: 24, fontWeight: 700, fontSize: 14 }}>
            হাসপাতাল ও ক্লিনিক পার্টনারশিপ
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, marginBottom: 24, letterSpacing: '-0.02em' }}>
            আপনার হাসপাতালকে করুন <br /> <span style={{ color: '#FDF4FF' }}>স্মার্ট এবং ডিজিটাল</span>
          </h1>
          <p style={{ fontSize: 18, opacity: 0.9, maxWidth: 700, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Doctor Booklet প্ল্যাটফর্মে আপনার হাসপাতালকে যুক্ত করে স্বাস্থ্যসেবা প্রদানকে আরও গতিশীল করুন। আমরা দিচ্ছি একটি পূর্ণাঙ্গ ডিজিটাল ম্যানেজমেন্ট সিস্টেম।
          </p>
          <Link to="/register?role=hospital" style={{ 
            background: 'white', color: '#D946EF', padding: '16px 40px', borderRadius: 14, 
            fontWeight: 800, fontSize: 18, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 12,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            হাসপাতাল রেজিস্ট্রেশন করুন <IconArrowRight size={22} />
          </Link>
        </Container>
      </section>

      {/* Main Content */}
      <Container style={{ marginTop: '-80px', position: 'relative', zIndex: 10, paddingBottom: 100 }}>
        {/* Document Card */}
        <div style={{ background: 'white', borderRadius: 32, padding: 'clamp(30px, 6vw, 60px)', boxShadow: '0 40px 100px rgba(162, 28, 175, 0.08)', border: '1px solid rgba(250, 232, 255, 0.8)' }}>
          <Row className="g-5">
            <Col lg={8}>
              <div style={{ maxWidth: 700 }}>
                <h2 style={{ fontWeight: 900, color: '#1E293B', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FDF4FF', color: '#D946EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconBuildingHospital size={28} />
                  </div>
                  হাসপাতাল পার্টনার হওয়ার সুফল
                </h2>

                <div style={{ color: '#475569', fontSize: 17, lineHeight: 1.8 }}>
                  <p style={{ marginBottom: 24 }}>
                    একটি আধুনিক হাসপাতালের জন্য দক্ষ ব্যবস্থাপনা এবং রোগীদের সাথে সঠিক যোগাযোগ অত্যন্ত গুরুত্বপূর্ণ। Doctor Booklet-এর হাসপাতাল মডিউলটি এমনভাবে ডিজাইন করা হয়েছে যাতে আপনি আপনার প্রতিষ্ঠানের সব কাজ এক জায়গা থেকেই নিয়ন্ত্রণ করতে পারেন।
                  </p>
                  
                  <div style={{ marginBottom: 40 }}>
                    <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 16 }}>১. কেন্দ্রীয় ডাক্তার ও চেম্বার ম্যানেজমেন্ট</h4>
                    <p>আপনার হাসপাতালে কর্মরত সকল ডাক্তারদের প্রোফাইল এবং তাদের চেম্বারের সময়সূচী অ্যাপে প্রদর্শন করুন। কোনো ডাক্তারের সময় পরিবর্তন হলে রোগীরা তাৎক্ষণিকভাবে নোটিফিকেশন পেয়ে যাবে।</p>
                  </div>

                  <div style={{ marginBottom: 40 }}>
                    <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 16 }}>২. অনলাইন রোগী আকর্ষণ</h4>
                    <p>সার্চ রেজাল্টে আপনার হাসপাতালের সার্ভিসসমূহ (যেমন: প্যাথলজি, সার্জারি, আইসিইউ) প্রচার করুন। স্থানীয় রোগীরা সহজেই আপনার হাসপাতালের বিশেষত্ব সম্পর্কে জানতে পারবে।</p>
                  </div>

                  <div style={{ marginBottom: 40 }}>
                    <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 16 }}>৩. ডাটা-চালিত সিদ্ধান্ত গ্রহণ</h4>
                    <p>আপনার হাসপাতালের পারফরম্যান্স অ্যানালিটিক্স রিপোর্ট দেখে হাসপাতালের প্রবৃদ্ধি এবং সেবার মান উন্নয়নে গুরুত্বপূর্ণ সিদ্ধান্ত নিন।</p>
                  </div>

                  <div style={{ background: '#FDF4FF', padding: '30px', borderRadius: 20, borderLeft: '6px solid #D946EF' }}>
                    <h5 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 10 }}>প্রফেশনাল সাপোর্ট টিম</h5>
                    <p style={{ margin: 0 }}>আমাদের ডেডিকেটেড সাপোর্ট টিম আপনার হাসপাতালের স্টাফদের প্ল্যাটফর্মটি ব্যবহারে ট্রেনিং প্রদান করবে এবং যেকোনো সমস্যায় তাৎক্ষণিক সহায়তা দিবে।</p>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col lg={4}>
              <div style={{ position: 'sticky', top: 120 }}>
                <div style={{ background: '#FDF4FF', borderRadius: 24, padding: '30px', border: '1px solid #FAE8FF' }}>
                  <h5 style={{ fontWeight: 900, color: '#1E293B', marginBottom: 24 }}>মূল ফিচাসমূহ</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {benefits.map((b, i) => (
                      <div key={i} style={{ display: 'flex', gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'white', color: '#D946EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                          {React.cloneElement(b.icon, { size: 20 })}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#1E293B', marginBottom: 4 }}>{b.title}</div>
                          <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{b.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <hr style={{ margin: '30px 0', opacity: 0.1 }} />
                  <div className="text-center">
                    <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, fontWeight: 500 }}>আপনার প্রতিষ্ঠানের যাত্রা শুরু করুন</p>
                    <Link to="/register?role=hospital" style={{ 
                      display: 'block', background: '#D946EF', color: 'white', padding: '14px', borderRadius: 12, 
                      fontWeight: 800, textDecoration: 'none', transition: '0.3s' 
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#A21CAF'}
                    onMouseLeave={e => e.currentTarget.style.background = '#D946EF'}>
                      রেজিস্ট্রেশন শুরু করুন
                    </Link>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>

      {/* Bottom CTA Section */}
      <section style={{ padding: '80px 0', background: 'white', borderTop: '1px solid #FAE8FF' }}>
        <Container className="text-center">
          <h2 style={{ fontWeight: 900, color: '#1E293B', marginBottom: 16 }}>আপনার প্রতিষ্ঠানের জন্য কি প্রস্তুত?</h2>
          <p style={{ color: '#64748B', fontSize: 16, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            Doctor Booklet-এর সাথে আপনার হাসপাতালের ডিজিটাল রূপান্তর আজই শুরু করুন। আমরা দিচ্ছি পূর্ণাঙ্গ ডিজিটাল সমাধান।
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/support" style={{ 
              background: 'white', color: '#D946EF', border: '1.5px solid #D946EF', 
              padding: '14px 40px', borderRadius: 16, fontWeight: 800, fontSize: 18,
              textDecoration: 'none', transition: '0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FDF4FF'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              বিস্তারিত জানুন
            </Link>
            <Link to="/register?role=hospital" style={{ 
              background: '#D946EF', color: 'white', border: 'none', 
              padding: '14px 40px', borderRadius: 16, fontWeight: 800, fontSize: 18,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
              transition: '0.3s', boxShadow: '0 10px 20px rgba(217,70,239,0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#A21CAF'}
            onMouseLeave={e => e.currentTarget.style.background = '#D946EF'}>
              <IconBuildingHospital size={24} /> হাসপাতাল যুক্ত করুন
            </Link>
          </div>
        </Container>
      </section>
    </div>
  )
}

export default HospitalInfoPage

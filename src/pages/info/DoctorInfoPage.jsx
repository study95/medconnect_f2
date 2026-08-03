import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { IconStethoscope, IconCalendarStats, IconUsers, IconMessageCircle, IconShieldCheck, IconArrowRight, IconChartBar } from '@tabler/icons-react'

function DoctorInfoPage() {
  const benefits = [
    { icon: <IconCalendarStats size={32} />, title: 'অ্যাপয়েন্টমেন্ট ম্যানেজমেন্ট', desc: 'সহজেই আপনার চেম্বারের সময়সূচী এবং সিরিয়াল ম্যানেজ করুন।' },
    { icon: <IconUsers size={32} />, title: 'রোগীদের কাছে পৌঁছান', desc: 'প্রতিদিন হাজার হাজার রোগী আপনার প্রোফাইল দেখার সুযোগ পাবে।' },
    { icon: <IconMessageCircle size={32} />, title: 'ডিজিটাল প্রেসক্রিপশন', desc: 'আধুনিক এবং নির্ভুল ডিজিটাল প্রেসক্রিপশন প্রদানের সুবিধা।' },
    { icon: <IconChartBar size={32} />, title: 'প্র্যাকটিস অ্যানালিটিক্স', desc: 'আপনার প্র্যাকটিসের প্রবৃদ্ধি ট্র্যাক করার জন্য বিস্তারিত রিপোর্ট।' },
  ]

  return (
    <div style={{ background: '#F0F9FF', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{ 
        position: 'relative',
        padding: '120px 0 180px', 
        color: 'white',
        textAlign: 'center',
        overflow: 'hidden',
        background: '#1E40AF'
      }}>
        {/* Background Image with Overlay */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundImage: 'url("https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0
        }} />
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.85) 0%, rgba(59, 130, 246, 0.75) 100%)',
          zIndex: 1
        }} />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: 99, display: 'inline-block', marginBottom: 24, fontWeight: 700, fontSize: 14 }}>
            ডাক্তারদের জন্য বিশেষ প্ল্যাটফর্ম
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, marginBottom: 24, letterSpacing: '-0.02em' }}>
            আপনার প্র্যাকটিসকে নিয়ে যান <br /> <span style={{ color: '#BFDBFE' }}>ডিজিটাল উচ্চতায়</span>
          </h1>
          <p style={{ fontSize: 18, opacity: 0.9, maxWidth: 700, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Doctor Booklet-এ যোগ দিয়ে আপনার রোগীদের দিন আধুনিক স্বাস্থ্যসেবার অভিজ্ঞতা। আমরা দিচ্ছি অ্যাপয়েন্টমেন্ট থেকে শুরু করে প্রেসক্রিপশন পর্যন্ত সবকিছুর সহজ সমাধান।
          </p>
          <Link to="/register?role=doctor" style={{ 
            background: 'white', color: '#3B82F6', padding: '16px 40px', borderRadius: 14, 
            fontWeight: 800, fontSize: 18, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 12,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            এখনই রেজিস্ট্রেশন করুন <IconArrowRight size={22} />
          </Link>
        </Container>
      </section>

      {/* Main Content */}
      <Container style={{ marginTop: '-80px', position: 'relative', zIndex: 10, paddingBottom: 100 }}>
        {/* Document Card */}
        <div style={{ background: 'white', borderRadius: 32, padding: 'clamp(30px, 6vw, 60px)', boxShadow: '0 40px 100px rgba(59, 130, 246, 0.08)', border: '1px solid rgba(219, 234, 254, 0.8)' }}>
          <Row className="g-5">
            <Col lg={8}>
              <div style={{ maxWidth: 700 }}>
                <h2 style={{ fontWeight: 900, color: '#1E293B', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F0F9FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconStethoscope size={28} />
                  </div>
                  কেন Doctor Booklet-এ যোগ দিবেন?
                </h2>

                <div style={{ color: '#475569', fontSize: 17, lineHeight: 1.8 }}>
                  <p style={{ marginBottom: 24 }}>
                    বর্তমান প্রতিযোগিতামূলক যুগে রোগীদের কাছে পৌঁছানো এবং তাদের বিশ্বস্ততা অর্জন করা যেকোনো চিকিৎসকের জন্য গুরুত্বপূর্ণ। Doctor Booklet এমন একটি প্ল্যাটফর্ম যা চিকিৎসক এবং রোগীদের মধ্যে একটি শক্তিশালী ডিজিটাল সেতু তৈরি করে।
                  </p>
                  
                  <div style={{ marginBottom: 40 }}>
                    <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 16 }}>১. ডিজিটাল দৃশ্যমানতা (Digital Visibility)</h4>
                    <p>আপনার চেম্বারের অবস্থান, অভিজ্ঞতার বিবরণ এবং বিশেষত্ব হাজার হাজার সম্ভাব্য রোগীর কাছে পৌঁছে দিন। একটি পেশাদার প্রোফাইলের মাধ্যমে নিজের ব্র্যান্ড ইমেজ তৈরি করুন।</p>
                  </div>

                  <div style={{ marginBottom: 40 }}>
                    <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 16 }}>২. স্মার্ট অ্যাপয়েন্টমেন্ট সিস্টেম</h4>
                    <p>ফোনে সিরিয়াল নেওয়ার ঝামেলা শেষ! রোগীরা অনলাইনে আপনার ফ্রী সময় দেখে অ্যাপয়েন্টমেন্ট বুক করতে পারবে। আপনি আপনার ড্যাশবোর্ড থেকে সহজেই সব সিরিয়াল নিয়ন্ত্রণ করতে পারবেন।</p>
                  </div>

                  <div style={{ marginBottom: 40 }}>
                    <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 16 }}>৩. প্রেসক্রিপশন ও হিস্ট্রি ম্যানেজমেন্ট</h4>
                    <p>ডিজিটাল প্রেসক্রিপশন মডিউল ব্যবহার করে দ্রুত এবং নির্ভুলভাবে রোগীদের সেবা দিন। রোগীদের পূর্ববর্তী স্বাস্থ্য রিপোর্ট এবং হিস্ট্রি এক ক্লিকেই দেখে নিন।</p>
                  </div>

                  <div style={{ background: '#F0F9FF', padding: '30px', borderRadius: 20, borderLeft: '6px solid #3B82F6' }}>
                    <h5 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 10 }}>নিরাপত্তা আমাদের অগ্রাধিকার</h5>
                    <p style={{ margin: 0 }}>আপনার এবং আপনার রোগীদের সকল তথ্য আমাদের কাছে সম্পূর্ণ সুরক্ষিত। আমরা কঠোর এনক্রিপশন এবং ডেটা প্রোটেকশন পলিসি অনুসরণ করি।</p>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col lg={4}>
              <div style={{ position: 'sticky', top: 120 }}>
                <div style={{ background: '#F0F9FF', borderRadius: 24, padding: '30px', border: '1px solid #DBEAFE' }}>
                  <h5 style={{ fontWeight: 900, color: '#1E293B', marginBottom: 24 }}>মূল সুবিধাসমূহ</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {benefits.map((b, i) => (
                      <div key={i} style={{ display: 'flex', gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'white', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
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
                    <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, fontWeight: 500 }}>আপনার প্র্যাকটিস আজই শুরু করুন</p>
                    <Link to="/register?role=doctor" style={{ 
                      display: 'block', background: '#3B82F6', color: 'white', padding: '14px', borderRadius: 12, 
                      fontWeight: 800, textDecoration: 'none', transition: '0.3s' 
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#2563EB'}
                    onMouseLeave={e => e.currentTarget.style.background = '#3B82F6'}>
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
      <section style={{ padding: '80px 0', background: 'white', borderTop: '1px solid #DBEAFE' }}>
        <Container className="text-center">
          <h2 style={{ fontWeight: 900, color: '#1E293B', marginBottom: 16 }}>আপনি কি শুরু করতে প্রস্তুত?</h2>
          <p style={{ color: '#64748B', fontSize: 16, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            Doctor Booklet-এর সাথে আপনার ডিজিটাল স্বাস্থ্যসেবা যাত্রা আজই শুরু করুন। আমরা আছি আপনার প্রতিটি পদক্ষেপে।
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/support" style={{ 
              background: 'white', color: '#3B82F6', border: '1.5px solid #3B82F6', 
              padding: '14px 40px', borderRadius: 16, fontWeight: 800, fontSize: 18,
              textDecoration: 'none', transition: '0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F0F9FF'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              বিস্তারিত জানুন
            </Link>
            <Link to="/register?role=doctor" style={{ 
              background: '#3B82F6', color: 'white', border: 'none', 
              padding: '14px 40px', borderRadius: 16, fontWeight: 800, fontSize: 18,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
              transition: '0.3s', boxShadow: '0 10px 20px rgba(59,130,246,0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2563EB'}
            onMouseLeave={e => e.currentTarget.style.background = '#3B82F6'}>
              <IconStethoscope size={24} /> ডাক্তার যুক্ত করুন
            </Link>
          </div>
        </Container>
      </section>
    </div>
  )
}

export default DoctorInfoPage

import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { IconStarFilled, IconQuote } from '@tabler/icons-react';

const REVIEWS = [
  { id: 1, name: "Sarah Jenkins", role: "Patient", rating: 5, text: "The booking process was incredibly smooth. I found a great pediatrician within minutes! The premium feel of the platform gave me confidence.", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=600&auto=format&fit=crop" },
  { id: 2, name: "Michael Chang", role: "Patient", rating: 5, text: "Excellent platform. The doctors listed are highly qualified and scheduling is very professional. Saved me so much hassle.", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop" },
  { id: 3, name: "Aisha Rahman", role: "Patient", rating: 5, text: "I love the clean interface and the ease of finding specialists near me. A truly state-of-the-art medical directory.", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop" }
];

function ReviewSection() {
  const { t } = useTranslation();

  return (
    <section style={{ padding: '120px 0', background: 'var(--mc-bg)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Blur Orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '0', width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,168,140,0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '0', width: 400, height: 400, background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <Container>
        <div className="text-center mb-5">
           <div style={{
             display: 'inline-flex', alignItems: 'center', gap: 8,
             background: 'var(--mc-primary-light)', color: '#00A88C', fontSize: 11, fontWeight: 900,
             padding: '6px 20px', borderRadius: 99, marginBottom: 16, border: '1px solid rgba(0, 168, 140, 0.1)',
             textTransform: 'uppercase', letterSpacing: '0.15em'
           }}>
             <IconQuote size={14} /> {t('testimonials') || 'TESTIMONIALS'}
           </div>
           <h2 style={{ fontWeight: 950, fontSize: 'clamp(32px, 5vw, 48px)', color: 'var(--mc-text)', letterSpacing: '-2px', marginBottom: 16 }}>
             {t('patient_reviews_title') || 'What Our Patients Say'}
           </h2>
        </div>
        
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          style={{ paddingBottom: '80px', maxWidth: '1100px', margin: '0 auto' }}
        >
          {REVIEWS.map((review) => (
            <SwiperSlide key={review.id}>
              <div className="mc-glass" style={{
                borderRadius: '40px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 40px 100px rgba(0,0,0,0.06)',
                border: '1px solid var(--mc-border)'
              }}>
                <Row className="g-0 align-items-stretch">
                  <Col md={5}>
                     <div style={{
                       width: '100%', height: '100%', minHeight: '450px',
                       backgroundImage: `url(${review.image})`,
                       backgroundSize: 'cover',
                       backgroundPosition: 'center',
                       position: 'relative'
                     }}>
                       <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1))' }} />
                     </div>
                  </Col>
                  <Col md={7}>
                    <div style={{ padding: '60px 70px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                      <IconQuote size={80} color="#00A88C" opacity={0.1} style={{ position: 'absolute', top: 40, right: 40 }} />
                      
                      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
                        {[...Array(review.rating)].map((_, i) => <IconStarFilled key={i} size={22} color="#FBBF24" />)}
                      </div>

                      <p style={{ 
                        fontSize: '22px', 
                        color: 'var(--mc-text)', 
                        lineHeight: 1.7, 
                        marginBottom: 40, 
                        fontWeight: 600, 
                        fontStyle: 'normal',
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: '-0.5px'
                      }}>
                        "{review.text}"
                      </p>

                      <div className="d-flex align-items-center gap-4">
                        <div style={{ width: 48, height: 2, background: '#00A88C', borderRadius: 4 }} />
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: 'var(--mc-text)', letterSpacing: '-0.5px' }}>{review.name}</h4>
                          <span style={{ fontSize: 13, color: '#00A88C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>{review.role}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </section>
  );
}

export default ReviewSection;

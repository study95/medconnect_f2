import React, { useRef } from 'react'
import { Container } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDoctors } from '../../api/doctorApi'
import DoctorCard from '../common/DoctorCard'
import { DoctorCardSkeleton } from '../common/Skeletons'
import {
  IconChevronLeft,
  IconChevronRight,
  IconArrowRight
} from '@tabler/icons-react'
import 'swiper/css'
import 'swiper/css/navigation'

export default function TodayDoctorsSection() {
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['home-today-doctors'],
    queryFn: async () => {
      const res = await getDoctors({ date: 'today', per_page: 8 })
      const raw = res.data?.data || res.data || []
      return Array.isArray(raw) ? raw : []
    },
    staleTime: 5 * 60 * 1000
  })

  // If not loading and no doctors found for today, gracefully do not render empty section
  if (!isLoading && doctors.length === 0) {
    return null
  }

  return (
    <section id="today-doctors-section" style={{ padding: '24px 0 28px', background: '#F8FAFC', position: 'relative' }}>
      <Container>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 18,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#DCFCE7',
              color: '#059669',
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 99,
              marginBottom: 8,
              fontFamily: "'Hind Siliguri', sans-serif"
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span>লাইভ শিডিউল • আজকের ডাক্তার</span>
            </div>
            <h2 style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 4px 0',
              fontFamily: "'Hind Siliguri', sans-serif",
              letterSpacing: '-0.3px'
            }}>
              আজ যেসব ডাক্তার চেম্বারে বসছেন
            </h2>
            <p style={{
              fontSize: 13.5,
              color: '#64748B',
              margin: 0,
              fontFamily: "'Hind Siliguri', sans-serif"
            }}>
              আজকের তারিখে যেসব বিশেষজ্ঞ চিকিৎসকের চেম্বার খোলা আছে সরাসরি সিরিয়াল নিন
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View All Button */}
            <Link
              to="/doctors?date=today"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#FFFFFF',
                color: '#00B875',
                border: '1.5px solid #00B875',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: "'Hind Siliguri', sans-serif",
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 184, 117, 0.08)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#00B875'; e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#00B875' }}
            >
              <span>সকল ডাক্তার দেখুন</span>
              <IconArrowRight size={15} />
            </Link>

            {/* Prev / Next Slider Arrows */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                ref={prevRef}
                type="button"
                aria-label="আগের ডাক্তার"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00B875'; e.currentTarget.style.color = '#00B875' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#0F172A' }}
              >
                <IconChevronLeft size={18} />
              </button>
              <button
                ref={nextRef}
                type="button"
                aria-label="পরের ডাক্তার"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00B875'; e.currentTarget.style.color = '#00B875' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#0F172A' }}
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Slider or Skeleton */}
        {isLoading ? (
          <div style={{ display: 'flex', gap: 16, overflow: 'hidden', padding: '6px 0 16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ flex: 1, minWidth: 260 }}>
                <DoctorCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current
              swiper.params.navigation.nextEl = nextRef.current
            }}
            spaceBetween={16}
            slidesPerView={1.15}
            breakpoints={{
              576: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 2.5, spaceBetween: 16 },
              992: { slidesPerView: 3, spaceBetween: 16 },
              1200: { slidesPerView: 3.5, spaceBetween: 16 },
              1400: { slidesPerView: 4, spaceBetween: 16 }
            }}
            style={{ padding: '4px 2px 14px' }}
          >
            {doctors.map((doctor, index) => (
              <SwiperSlide key={doctor.id || index} style={{ height: 'auto' }}>
                <div style={{ height: '100%' }}>
                  <DoctorCard doctor={doctor} viewMode="grid" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </Container>
    </section>
  )
}

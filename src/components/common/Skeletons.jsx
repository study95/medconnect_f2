// WHY SKELETONS INSTEAD OF SPINNERS?
// A spinner says "something is loading" but the page looks empty.
// A skeleton shows the SHAPE of the content that's coming.
// This reduces "perceived loading time" — the user feels like
// the page loaded faster because they can see the layout forming.
// You've seen this on Facebook, LinkedIn, YouTube — it's standard
// in enterprise apps.
//
// HOW IT WORKS:
// We use a CSS animation (shimmer effect) on gray placeholder blocks
// that match the shape of the real content.

import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

// ─── Shimmer animation via a style tag injected once ───
const SHIMMER_STYLE = `
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  .skeleton-box {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 6px;
  }
`

function ShimmerStyle() {
  return <style>{SHIMMER_STYLE}</style>
}

// ─── Reusable skeleton box ───
// width/height: CSS value strings e.g. "100%", "80px"
// rounded: if true, makes a circle (for avatars)
export function SkeletonBox({ width = '100%', height = '16px', rounded = false, style = {} }) {
  return (
    <>
      <ShimmerStyle />
      <div
        className="skeleton-box"
        style={{
          width,
          height,
          borderRadius: rounded ? '50%' : 8,
          ...style,
        }}
      />
    </>
  )
}

// ─── Doctor card skeleton ───
// Matches the exact shape of DoctorCard.jsx
export function DoctorCardSkeleton() {
  return (
    <>
      <ShimmerStyle />
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          border: '1.5px solid #F1F5F9',
          padding: '16px',
          overflow: 'hidden',
          height: '100%',
          display: 'flex', 
          flexDirection: 'column'
        }}
      >
        {/* Avatar + info row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div className="skeleton-box" style={{ width: 100, height: 110, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4 }}>
            {/* Badge */}
            <div className="skeleton-box" style={{ height: 14, width: 60, borderRadius: 6, marginBottom: 4 }} />
            {/* Title */}
            <div className="skeleton-box" style={{ height: 20, width: '80%', marginBottom: 6 }} />
            {/* 4 Info rows */}
            <div className="skeleton-box" style={{ height: 14, width: '90%' }} />
            <div className="skeleton-box" style={{ height: 14, width: '70%' }} />
            <div className="skeleton-box" style={{ height: 14, width: '80%' }} />
            <div className="skeleton-box" style={{ height: 14, width: '60%' }} />
          </div>
        </div>

        {/* Buttons row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
          <div className="skeleton-box" style={{ flex: 1, height: 38, borderRadius: 8 }} />
          <div className="skeleton-box" style={{ flex: 1, height: 38, borderRadius: 8 }} />
        </div>
      </div>
    </>
  )
}

export function DoctorGridSkeleton({ count = 4 }) {
  return (
    <Row className="g-4">
      {Array.from({ length: count }).map((_, i) => (
        <Col key={i} xs={12} md={6} xl={4}>
          <DoctorCardSkeleton />
        </Col>
      ))}
    </Row>
  )
}

// ─── Hospital slider skeleton ───
export function HospitalSliderSkeleton() {
  return (
    <>
      <ShimmerStyle />
      <div style={{ display: 'flex', gap: 20, overflow: 'hidden' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-box"
            style={{ minWidth: 220, height: 220, borderRadius: 16, flexShrink: 0 }}
          />
        ))}
      </div>
    </>
  )
}

// ─── Doctor detail page skeleton ───
// ─── Doctor detail page skeleton ───
export function DoctorDetailSkeleton() {
  return (
    <>
      <ShimmerStyle />
      {/* Header Skeleton */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '40px 0', marginBottom: 40 }}>
        <Container>
          <Row className="g-4 align-items-start">
            <Col md={3} lg={3}>
              <div className="skeleton-box" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 24 }} />
            </Col>
            <Col md={9} lg={9}>
              <div className="skeleton-box" style={{ height: 32, width: '40%', marginBottom: 16 }} />
              <div className="skeleton-box" style={{ height: 20, width: '30%', marginBottom: 16 }} />
              <div className="d-flex gap-3 mb-4">
                <div className="skeleton-box" style={{ height: 16, width: 100 }} />
                <div className="skeleton-box" style={{ height: 16, width: 100 }} />
              </div>
              <div className="d-flex gap-2">
                <div className="skeleton-box" style={{ height: 40, width: 120, borderRadius: 12 }} />
                <div className="skeleton-box" style={{ height: 40, width: 120, borderRadius: 12 }} />
                <div className="skeleton-box" style={{ height: 40, width: 200, borderRadius: 12 }} />
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Tabs Skeleton */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '12px 0', marginBottom: 40 }}>
        <Container>
          <div className="d-flex gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton-box" style={{ height: 40, width: 120, borderRadius: 10 }} />
            ))}
          </div>
        </Container>
      </div>

      {/* Content Grid Skeleton */}
      <Container>
        <Row className="g-4">
          <Col lg={8}>
            <div className="skeleton-box" style={{ height: 200, borderRadius: 20, marginBottom: 24 }} />
            <div className="skeleton-box" style={{ height: 150, borderRadius: 20, marginBottom: 24 }} />
            <div className="skeleton-box" style={{ height: 400, borderRadius: 20 }} />
          </Col>
          <Col lg={4}>
            <div className="skeleton-box" style={{ height: 250, borderRadius: 20, marginBottom: 24 }} />
            <div className="skeleton-box" style={{ height: 200, borderRadius: 20, marginBottom: 24 }} />
            <div className="skeleton-box" style={{ height: 350, borderRadius: 20 }} />
          </Col>
        </Row>
      </Container>
    </>
  )
}


// ─── Appointment list skeleton ───
export function AppointmentListSkeleton({ count = 4 }) {
  return (
    <>
      <ShimmerStyle />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              background: 'white', borderRadius: 16,
              border: '1px solid #E5EAF0', padding: '20px 24px',
              display: 'flex', gap: 20, alignItems: 'center',
            }}
          >
            <div className="skeleton-box" style={{ width: 60, height: 60, borderRadius: 14, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-box" style={{ height: 15, width: '40%', marginBottom: 8 }} />
              <div className="skeleton-box" style={{ height: 12, width: '60%', marginBottom: 8 }} />
              <div className="skeleton-box" style={{ height: 12, width: '30%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton-box" style={{ width: 90, height: 32, borderRadius: 8 }} />
              <div className="skeleton-box" style={{ width: 90, height: 32, borderRadius: 8 }} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Hospital card skeleton ───
export function HospitalCardSkeleton() {
  return (
    <>
      <ShimmerStyle />
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          border: '1.5px solid #F1F5F9',
          padding: '16px',
          overflow: 'hidden',
          height: '100%',
          display: 'flex', 
          flexDirection: 'column'
        }}
      >
        {/* Avatar + info row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div className="skeleton-box" style={{ width: 100, height: 110, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4 }}>
            {/* Title */}
            <div className="skeleton-box" style={{ height: 20, width: '80%', marginBottom: 6 }} />
            {/* 3 Info rows */}
            <div className="skeleton-box" style={{ height: 14, width: '90%' }} />
            <div className="skeleton-box" style={{ height: 14, width: '70%' }} />
            <div className="skeleton-box" style={{ height: 14, width: '80%' }} />
          </div>
        </div>

        {/* Buttons row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
          <div className="skeleton-box" style={{ flex: 1, height: 38, borderRadius: 8 }} />
          <div className="skeleton-box" style={{ flex: 1, height: 38, borderRadius: 8 }} />
        </div>
      </div>
    </>
  )
}

export function HospitalGridSkeleton({ count = 6 }) {
  return (
    <Row className="g-4">
      {Array.from({ length: count }).map((_, i) => (
        <Col key={i} xs={12} md={6} xl={4}>
          <HospitalCardSkeleton />
        </Col>
      ))}
    </Row>
  )
}
// ─── Book Appointment Page Skeleton ───
export function BookAppointmentSkeleton() {
  return (
    <>
      <ShimmerStyle />
      
      {/* Doctor & Patient Row */}
      <Row className="g-4 mb-4">
        <Col md={6}>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5EAF0', padding: 24 }}>
            <div className="skeleton-box" style={{ width: '40%', height: 12, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="skeleton-box" style={{ width: 72, height: 72, borderRadius: 14 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-box" style={{ height: 18, width: '70%', marginBottom: 10 }} />
                <div className="skeleton-box" style={{ height: 14, width: '50%', marginBottom: 10 }} />
                <div className="skeleton-box" style={{ height: 14, width: '40%' }} />
              </div>
            </div>
          </div>
        </Col>
        <Col md={6}>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5EAF0', padding: 24 }}>
            <div className="skeleton-box" style={{ width: '40%', height: 12, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="skeleton-box" style={{ width: 72, height: 72, borderRadius: 14 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-box" style={{ height: 18, width: '70%', marginBottom: 10 }} />
                <div className="skeleton-box" style={{ height: 14, width: '50%' }} />
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Chamber selection box */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5EAF0', padding: 28, marginBottom: 28 }}>
        <div className="skeleton-box" style={{ width: '30%', height: 18, marginBottom: 10 }} />
        <div className="skeleton-box" style={{ width: '50%', height: 14, marginBottom: 24 }} />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton-box" style={{ width: 160, height: 80, borderRadius: 14 }} />
          ))}
        </div>
      </div>

      {/* Form area */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5EAF0', padding: 32 }}>
        <Row className="g-3">
          <Col sm={6}><div className="skeleton-box" style={{ height: 44, borderRadius: 10 }} /></Col>
          <Col sm={6}><div className="skeleton-box" style={{ height: 44, borderRadius: 10 }} /></Col>
          <Col xs={12}><div className="skeleton-box" style={{ height: 120, borderRadius: 16 }} /></Col>
          <Col xs={12}><div className="skeleton-box" style={{ height: 50, borderRadius: 14 }} /></Col>
        </Row>
      </div>
    </>
  )
}
// ─── Hospital detail page skeleton ───
export function HospitalDetailSkeleton() {
  return (
    <>
      <ShimmerStyle />
      <Row className="g-4">
        {/* Left side: Image and contact card */}
        <Col lg={4}>
          <div style={{ background: 'white', borderRadius: 32, padding: 10, border: '1px solid #E5EAF0', marginBottom: 24 }}>
            <div className="skeleton-box" style={{ width: '100%', height: 280, borderRadius: 24 }} />
          </div>
          <div style={{ background: 'white', padding: '32px', borderRadius: 32, border: '1px solid #E5EAF0' }}>
            <div className="skeleton-box" style={{ height: 20, width: '50%', marginBottom: 24 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <div className="skeleton-box" style={{ height: 10, width: '30%', marginBottom: 8 }} />
                  <div className="skeleton-box" style={{ height: 20, width: '80%' }} />
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* Right side: Services and Doctors */}
        <Col lg={8}>
          <div style={{ background: 'white', padding: '40px', borderRadius: 32, border: '1px solid #E5EAF0', marginBottom: 32 }}>
            <div className="skeleton-box" style={{ height: 24, width: '40%', marginBottom: 24 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-box" style={{ width: 120, height: 40, borderRadius: 16 }} />
              ))}
            </div>
          </div>
          <div style={{ background: 'white', padding: '40px', borderRadius: 32, border: '1px solid #E5EAF0' }}>
            <div className="skeleton-box" style={{ height: 28, width: '30%', marginBottom: 32 }} />
            <Row className="g-4">
              {[1, 2].map(i => (
                <Col xs={12} sm={6} key={i}>
                  <div className="skeleton-box" style={{ height: 200, borderRadius: 16 }} />
                </Col>
              ))}
            </Row>
          </div>
        </Col>
      </Row>
    </>
  )
}

// ─── Enterprise Table Skeleton ───
export function TableSkeleton({
  rowCount = 6,
  columnWidths = ['100px', '30%', '20%', '15%', '15%', '10%'],
  headers = [],
}) {
  return (
    <div className="table-skeleton-container" style={{ width: '100%', overflow: 'hidden' }}>
      <ShimmerStyle />
      {headers && headers.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: columnWidths.map(w => (typeof w === 'number' ? `${w}px` : w)).join(' '),
            padding: '12px 16px',
            background: 'var(--admin-table-header-bg, rgba(99,102,241,0.03))',
            borderBottom: '1px solid var(--admin-border, #e2e8f0)',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {headers.map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {h}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Array.from({ length: rowCount }).map((_, rIdx) => (
          <div
            key={rIdx}
            style={{
              display: 'grid',
              gridTemplateColumns: columnWidths.map(w => (typeof w === 'number' ? `${w}px` : w)).join(' '),
              padding: '14px 16px',
              borderBottom: '1px solid var(--admin-border, #e2e8f0)',
              gap: 12,
              alignItems: 'center',
              background: rIdx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
            }}
          >
            {columnWidths.map((_, cIdx) => (
              <div
                key={cIdx}
                className="skeleton-box"
                style={{
                  height: 16,
                  width: cIdx === 0 ? '60%' : cIdx === columnWidths.length - 1 ? '40%' : `${70 + ((rIdx * 7 + cIdx * 13) % 25)}%`,
                  borderRadius: 6,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card Skeleton ───
export function CardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      <ShimmerStyle />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: 'var(--admin-card-bg, #fff)', border: '1px solid var(--admin-border, #e2e8f0)', borderRadius: 16, padding: 20 }}>
          <div className="skeleton-box" style={{ height: 20, width: '40%', marginBottom: 12 }} />
          <div className="skeleton-box" style={{ height: 14, width: '80%', marginBottom: 8 }} />
          <div className="skeleton-box" style={{ height: 14, width: '60%' }} />
        </div>
      ))}
    </div>
  )
}

// ─── Detail Skeleton ───
export function DetailSkeleton() {
  return (
    <div style={{ background: 'var(--admin-card-bg, #fff)', border: '1px solid var(--admin-border, #e2e8f0)', borderRadius: 16, padding: 24 }}>
      <ShimmerStyle />
      <div className="skeleton-box" style={{ height: 28, width: '30%', marginBottom: 16 }} />
      <div className="skeleton-box" style={{ height: 16, width: '60%', marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="skeleton-box" style={{ height: 12, width: '40%', marginBottom: 6 }} />
            <div className="skeleton-box" style={{ height: 18, width: '80%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Form Skeleton ───
export function FormSkeleton() {
  return (
    <div style={{ background: 'var(--admin-card-bg, #fff)', border: '1px solid var(--admin-border, #e2e8f0)', borderRadius: 16, padding: 24 }}>
      <ShimmerStyle />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="skeleton-box" style={{ height: 14, width: '25%', marginBottom: 8 }} />
            <div className="skeleton-box" style={{ height: 40, width: '100%', borderRadius: 8 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

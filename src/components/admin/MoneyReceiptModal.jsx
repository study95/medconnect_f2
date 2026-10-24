import React, { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer, X, Receipt } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

/**
 * RubberStamp Component
 * - Single stroke with adjustable width (default 2.8px)
 * - Extra bold typography (Arial Black / Impact, 900 weight)
 * - Equal symmetrical padding on all 4 sides
 * - Perfectly centered text without side dots
 * - Authentic slight tilt (-7deg)
 */
function RubberStamp({ status = 'PAID', strokeWidth = 3 }) {
  const isPaid = String(status).toUpperCase() === 'PAID'
  // Emerald green for PAID (#059669), classic crimson red for UNPAID (#C92A2A)
  const stampColor = isPaid ? '#059669' : '#C92A2A'
  const text = isPaid ? 'PAID' : 'UNPAID'

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7px 14px 5px 14px',
        border: `${strokeWidth}px solid ${stampColor}`,
        borderRadius: 4,
        transform: 'rotate(-7deg)',
        userSelect: 'none',
        flexShrink: 0,
        background: 'rgba(255, 255, 255, 0.98)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <span
        style={{
          fontFamily: '"Arial Black", Impact, -apple-system, sans-serif',
          fontSize: text === 'UNPAID' ? 14 : 16.5,
          fontWeight: 900,
          letterSpacing: '0.04em',
          color: stampColor,
          textTransform: 'uppercase',
          lineHeight: 1,
          textAlign: 'center',
          display: 'block',
        }}
      >
        {text}
      </span>
    </div>
  )
}

export default function MoneyReceiptModal({ show, onClose, payment }) {
  const receiptRef = useRef(null)
  const { user: authUser } = useAuth()

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Money-Receipt-${payment?.public_id || payment?.id || 'doc'}`,
  })

  if (!show || !payment) return null

  // Patient Info
  const patientName = payment.patient?.name || payment.patient_name || payment.user_name || 'Patient'
  const patientPhone = payment.patient?.phone || payment.patient_phone || payment.user_phone || '—'
  
  // Doctor & Location Info
  const doctorName = payment.doctor?.name || payment.doctor_name || 'Medical Specialist'
  const doctorDegree = payment.doctor?.degree || payment.doctor_degree || ''
  const doctorSpecialty = payment.doctor?.specialty?.name || payment.doctor?.specialty_name || payment.doctor?.department || payment.doctor_specialty || ''
  const hospitalName = payment.hospital?.name || payment.hospital_name || payment.chamber?.hospital?.name || ''
  const chamberName = payment.chamber?.name || payment.chamber_name || hospitalName || 'Main Chamber'
  const chamberAddress = payment.chamber?.address || payment.hospital?.address || ''

  // Payment Financials
  const amount = Number(payment.fee || payment.amount || payment.total_amount || 0)
  const method = (payment.payment_method || 'CASH').toUpperCase()
  const status = (payment.payment_status || 'Paid').toUpperCase()
  const receiptNo = payment.public_id || payment.appointment?.public_id || (payment.registration_id ? `REG-${payment.registration_id}` : `REC-${String(payment.id).padStart(6, '0')}`)

  // Timestamps
  const dateObj = payment.created_at ? new Date(payment.created_at) : (payment.appointment_date ? new Date(payment.appointment_date) : new Date())
  const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  // Receiver identification (Dynamic from current logged in panel user)
  const receivedBy = payment.collector_name || payment.created_by_user?.name || authUser?.name || 'Counter Reception'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="money-receipt-modal-box"
        style={{
          background: 'var(--admin-card-bg, #FFFFFF)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: 440,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '96vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--admin-border, #E2E8F0)',
            background: 'var(--admin-bg, #F8FAFC)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={17} style={{ color: '#00A88C' }} />
            <span style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--admin-text, #0F172A)' }}>
              মানি রিসিট (Money Receipt)
            </span>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--admin-text-muted, #64748B)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Printable Voucher Area */}
        <div className="money-receipt-scroll-area" style={{ overflowY: 'auto', overflowX: 'hidden', padding: '10px 12px', flex: 1 }}>
          <div
            ref={receiptRef}
            className="money-receipt-container"
            style={{
              background: '#FFFFFF',
              border: '1.5px dashed #CBD5E1',
              borderRadius: 10,
              padding: '16px 14px',
              color: '#0F172A',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              position: 'relative',
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '1.5px solid #E2E8F0', paddingBottom: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#00A88C', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <img src="/favicon.png" alt="DoctorBooklet" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <span>DoctorBooklet</span>
              </div>
              {(chamberName || hospitalName) && (
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', marginTop: 2 }}>
                  {chamberName || hospitalName}
                </div>
              )}
              {chamberAddress && (
                <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 1, wordBreak: 'break-word' }}>
                  {chamberAddress}
                </div>
              )}

              {/* Centered Pill with Green Background & Balanced Top/Bottom Gaps */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, marginBottom: 2 }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '3px 16px',
                    borderRadius: 99,
                    background: '#00A88C',
                    color: '#FFFFFF',
                    fontSize: 10.5,
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0, 168, 140, 0.25)',
                  }}
                >
                  MONEY RECEIPT
                </div>
              </div>
            </div>

            {/* Core Details (Patient & Doctor) - Guaranteed Side by Side on Mobile & Desktop */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 12,
                fontSize: 11.5,
              }}
            >
              {/* Left Column: Patient */}
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ color: '#64748B', fontSize: 10 }}>
                  Receipt No: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{receiptNo}</strong>
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ color: '#64748B', fontSize: 10 }}>Patient: </span>
                  <strong style={{ color: '#0F172A', fontSize: 12.5 }}>{patientName}</strong>
                </div>
                <div style={{ color: '#475569', fontSize: 11, marginTop: 1 }}>Phone: {patientPhone}</div>
                {payment.serial_number && (
                  <div style={{ color: '#00A88C', fontSize: 11, fontWeight: 700, marginTop: 1 }}>
                    Serial No: #{payment.serial_number}
                  </div>
                )}
              </div>

              {/* Right Column: Doctor & Date */}
              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <div style={{ color: '#64748B', fontSize: 10 }}>
                  Date: <strong style={{ color: '#0F172A' }}>{formattedDate}</strong>
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ color: '#64748B', fontSize: 10 }}>Doctor: </span>
                  <strong style={{ color: '#0F172A', fontSize: 12.5 }}>{doctorName}</strong>
                </div>
                {doctorDegree && (
                  <div style={{ color: '#334155', fontSize: 11, fontWeight: 700, marginTop: 1 }}>
                    {doctorDegree}
                  </div>
                )}
                {doctorSpecialty && (
                  <div style={{ color: '#64748B', fontSize: 10.5, marginTop: doctorDegree ? 1 : 2 }}>
                    {doctorSpecialty}
                  </div>
                )}
              </div>
            </div>

            {/* Service Fee Table */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F8FAFC', fontSize: 10.5, fontWeight: 700, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
                <span>Particulars / Service</span>
                <span>Amount</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', fontSize: 11.5 }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Doctor Consultation Fee</span>
                <strong style={{ color: '#0F172A' }}>৳{amount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: 11.5 }}>
                <div style={{ color: '#64748B', fontSize: 10.5 }}>
                  Payment Method: <strong style={{ color: '#0F172A' }}>{method}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#64748B', fontSize: 10.5, whiteSpace: 'nowrap' }}>Total Paid:</span>
                  <strong style={{ fontSize: 14, fontWeight: 900, color: '#00A88C', whiteSpace: 'nowrap' }}>
                    ৳{amount.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Received By & Rubber Stamp Row - Balanced Top Gap & Solid Bold Stamp */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingTop: 12,
                marginTop: 2,
                gap: 6,
              }}
            >
              {/* Receiver Info - strictly one line */}
              <div style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 10.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                  Received By: <strong style={{ color: '#0F172A', fontWeight: 800 }}>{receivedBy}</strong>
                </div>
                <div style={{ fontSize: 9.5, color: '#94A3B8', marginTop: 1, whiteSpace: 'nowrap' }}>
                  Time: {formattedTime}
                </div>
              </div>

              {/* Single Stroke Adjustable Bold Rubber Stamp */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RubberStamp status={status} strokeWidth={2.8} />
              </div>

              {/* Authorized Sign */}
              <div style={{ textAlign: 'center', width: 75, flexShrink: 0 }}>
                <div style={{ borderBottom: '1px solid #94A3B8', height: 18, marginBottom: 3 }} />
                <div style={{ fontSize: 8.5, fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
                  Authorized Sign
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '10px 16px',
            borderTop: '1px solid var(--admin-border, #E2E8F0)',
            background: 'var(--admin-bg, #F8FAFC)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-outline"
            style={{ padding: '7px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            বন্ধ করুন
          </button>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #00A88C 0%, #059669 100%)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 168, 140, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            <Printer size={14} />
            <span>রিসিট প্রিন্ট করুন</span>
          </button>
        </div>
      </div>
    </div>
  )
}

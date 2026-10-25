// CommissionMemo.jsx — Clean, Professional & Minimalist Commission Memo
import React, { useRef, useMemo } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer, Download, X } from 'lucide-react'

export default function CommissionMemo({ show, onClose, data = [], summary = {}, filters = {}, doctor, hospital }) {
  const componentRef = useRef()

  // Target Entity Details
  const targetName = doctor?.name || hospital?.name || 'All Healthcare Partners'
  const rawId = hospital ? (hospital.id || hospital.code) : doctor ? (doctor.id || doctor.doctor_code) : null
  const targetId = rawId ? String(rawId) : 'ALL'
  const targetContact = doctor?.phone || hospital?.phone || doctor?.user?.phone || hospital?.user?.phone || ''

  // Billing Period
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const period = filters.month && filters.year 
    ? `${monthNames[Number(filters.month) - 1]} ${filters.year}`
    : filters.year 
      ? `${filters.year}`
      : 'All Time'

  // Stable Unique 4-Digit Voucher Serial per memo opening
  const uniqueSerial = useMemo(() => {
    return Math.floor(1000 + Math.random() * 9000)
  }, [show, doctor?.id, hospital?.id, filters.month, filters.year])

  // Professional Memo Number Format: CM-HP-SX3ZBQ-7412 or CM-DR-XXXX-7412 or CM-GEN-7412
  let entityTag = 'GEN'
  if (hospital) {
    const hid = String(hospital.id || hospital.code || '')
    entityTag = hid.toUpperCase().startsWith('HP-') ? hid.toUpperCase() : `HP-${hid}`
  } else if (doctor) {
    const did = String(doctor.id || doctor.doctor_code || doctor.code || '')
    entityTag = did.toUpperCase().startsWith('DR-') ? did.toUpperCase() : `DR-${did}`
  }

  const memoNumber = `CM-${entityTag}-${uniqueSerial}`
  const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const formatMemoDate = (val) => {
    if (!val) return '—'
    try {
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val).split('T')[0]
      return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
    } catch {
      return String(val).split('T')[0]
    }
  }

  // Financial Summary
  const totalCount = data.length
  const totalFees = data.reduce((acc, cur) => acc + Number(cur.amount || 0), 0) || Number(summary.total_fees || 0)
  const totalCommission = data.reduce((acc, cur) => acc + Number(cur.commission_amount || 0), 0) || Number(summary.total_commission || 0)

  // Status
  const isPaid = data.length > 0 && data.every(d => d.commission_status === 'paid')
  const statusText = isPaid ? 'PAID' : (filters.status ? filters.status.toUpperCase() : 'PENDING')
  const statusColor = isPaid ? '#10B981' : '#F59E0B'

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Commission_Memo_${memoNumber}`
  })

  const handleDownloadPdf = async () => {
    const element = componentRef.current
    if (!element) return

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `Commission_Memo_${memoNumber}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    
    const { default: html2pdf } = await import('html2pdf.js')
    html2pdf().from(element).set(opt).save()
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        maxWidth: 860,
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        
        {/* Top Action Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFC'
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
            Commission Memo Preview
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #CBD5E1',
                background: '#ffffff',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <Printer size={15} />
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                background: '#00A88C',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <Download size={15} />
              Download PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#F1F5F9',
          padding: '24px 16px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div
            ref={componentRef}
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '760px',
              padding: '36px 40px',
              borderRadius: 6,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              color: '#1E293B',
              boxSizing: 'border-box'
            }}
          >
            {/* Header: Brand & Document Title */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: 20,
              borderBottom: '2px solid #00A88C'
            }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#00A88C' }}>
                  Doctor Booklet
                </h1>
                <p style={{ margin: '3px 0 0 0', fontSize: 12, color: '#64748B' }}>
                  Digital Healthcare Platform
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '0.5px' }}>
                  COMMISSION MEMO
                </h2>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  <strong>Memo No:</strong> <span style={{ color: '#0F172A', fontWeight: 700, fontFamily: 'monospace' }}>{memoNumber}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  <strong>Date:</strong> {todayDate}
                </div>
              </div>
            </div>

            {/* Recipient & Billing Info (Clean 2-Column) */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '16px 0',
              borderBottom: '1px solid #E2E8F0',
              marginBottom: 20
            }}>
              {/* Left: Recipient */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Recipient Details
                </span>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 3 }}>
                  {targetName}
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                  ID: {targetId}
                </div>
                {targetContact && (
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 1 }}>
                    Contact: {targetContact}
                  </div>
                )}
              </div>

              {/* Right: Period & Status */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Billing Info
                </span>
                <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, marginTop: 3 }}>
                  Period: {period}
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    background: isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: statusColor,
                    border: `1px solid ${statusColor}`
                  }}>
                    {statusText}
                  </span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ marginBottom: 24, overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 12,
                tableLayout: 'fixed'
              }}>
                <thead>
                  <tr style={{
                    background: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                    borderBottom: '2px solid #CBD5E1',
                    textAlign: 'left'
                  }}>
                    <th style={{ padding: '10px 12px', width: '6%', color: '#475569', whiteSpace: 'nowrap' }}>No.</th>
                    <th style={{ padding: '10px 12px', width: '13%', color: '#475569', whiteSpace: 'nowrap' }}>Date</th>
                    <th style={{ padding: '10px 12px', width: '22%', color: '#475569', whiteSpace: 'nowrap' }}>Patient Name</th>
                    <th style={{ padding: '10px 12px', width: '18%', color: '#475569', whiteSpace: 'nowrap' }}>Appointment ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', width: '15%', color: '#475569', whiteSpace: 'nowrap' }}>Doctor Fee</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', width: '10%', color: '#475569', whiteSpace: 'nowrap' }}>Rate</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', width: '16%', color: '#475569', whiteSpace: 'nowrap' }}>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                        No records found for this period.
                      </td>
                    </tr>
                  ) : (
                    data.map((row, index) => (
                      <tr
                        key={row.id || index}
                        style={{
                          borderBottom: '1px solid #F1F5F9'
                        }}
                      >
                        <td style={{ padding: '10px 12px', color: '#64748B' }}>{index + 1}</td>
                        <td style={{ padding: '10px 12px', color: '#334155', whiteSpace: 'nowrap' }}>{formatMemoDate(row.date || row.appointment_date)}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.patient_name}</td>
                        <td style={{ padding: '10px 12px', color: '#475569', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>
                          {row.public_id || row.registration_id}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#334155', whiteSpace: 'nowrap' }}>
                          ৳{Number(row.amount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {row.commission_rate}%
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#00A88C', whiteSpace: 'nowrap' }}>
                          ৳{Number(row.commission_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Section */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 40
            }}>
              <div style={{
                width: 260,
                background: '#F8FAFC',
                padding: '14px 18px',
                borderRadius: 8,
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Total Appointments:</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{totalCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Total Doctor Fees:</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>৳{totalFees.toLocaleString()}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '1px solid #CBD5E1',
                  fontSize: 14,
                  fontWeight: 800
                }}>
                  <span style={{ color: '#0F172A' }}>Total Commission:</span>
                  <span style={{ color: '#00A88C' }}>
                    ৳{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingTop: 30,
              borderTop: '1px solid #F1F5F9'
            }}>
              <div style={{ textAlign: 'center', width: 170 }}>
                <div style={{ borderBottom: '1px solid #CBD5E1', marginBottom: 6 }}></div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                  Doctor Booklet Authority
                </div>
              </div>

              <div style={{ textAlign: 'center', width: 170 }}>
                <div style={{ borderBottom: '1px solid #CBD5E1', marginBottom: 6 }}></div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                  Receiver Signature
                </div>
              </div>
            </div>

            {/* Clean Note */}
            <div style={{
              textAlign: 'center',
              fontSize: 11,
              color: '#94A3B8',
              marginTop: 24
            }}>
              Thank you for partnering with Doctor Booklet.
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

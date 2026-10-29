// CommissionMemo.jsx — Official Monthly Billing Statement & Automated Commission Invoice
import React, { useRef, useMemo } from 'react'
import { useReactToPrint } from 'react-to-print'
import { 
  Printer, Download, X, Building2, Stethoscope, 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  CreditCard, Phone, MapPin, Receipt, Landmark, Smartphone
} from 'lucide-react'

export default function CommissionMemo({ show, onClose, data = [], summary = {}, filters = {}, doctor, hospital }) {
  const componentRef = useRef()

  // Target Entity Details with smart fallbacks
  const targetName = useMemo(() => {
    if (doctor?.name && doctor.name !== 'Doctor Earnings Statement') {
      return doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`
    }
    if (hospital?.name && hospital.name !== 'Hospital Facility Statement') {
      return hospital.name
    }
    if (data[0]?.hospital_name) {
      return data[0].hospital_name
    }
    if (data[0]?.doctor_name) {
      return data[0].doctor_name.startsWith('Dr.') ? data[0].doctor_name : `Dr. ${data[0].doctor_name}`
    }
    return doctor?.name || hospital?.name || 'All Healthcare Partners'
  }, [doctor, hospital, data])

  const targetId = useMemo(() => {
    const raw = (hospital && hospital.name !== 'Hospital Facility Statement') 
      ? (hospital.public_id || hospital.id || hospital.code)
      : (doctor && doctor.name !== 'Doctor Earnings Statement')
        ? (doctor.public_id || doctor.id || doctor.doctor_code)
        : data[0]?.hospital_public_id || data[0]?.doctor_public_id || null
    return raw ? String(raw) : 'ALL'
  }, [hospital, doctor, data])

  const targetContact = doctor?.phone || hospital?.phone || doctor?.user?.phone || hospital?.user?.phone || data[0]?.booking_phone || data[0]?.patient_phone || ''
  const targetAddress = hospital?.address || doctor?.chamber?.address || doctor?.chamber_address || ''

  // Billing Period
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const isMonthly = Boolean(filters.month && filters.year)
  const period = isMonthly 
    ? `${monthNames[Number(filters.month) - 1]} ${filters.year}`
    : filters.year 
      ? `Year ${filters.year}`
      : 'All Time Statement'

  // Stable Unique 4-Digit Serial per memo opening
  const uniqueSerial = useMemo(() => {
    return Math.floor(1000 + Math.random() * 9000)
  }, [show, doctor?.id, hospital?.id, filters.month, filters.year])

  // Professional Invoice / Memo Number Format: INV-202610-HP-MS9CXR-7412 or CM-DR-XXXX-7412
  let entityTag = 'GEN'
  if (hospital && hospital.name !== 'Hospital Facility Statement') {
    const hid = String(hospital.public_id || hospital.id || hospital.code || '')
    entityTag = hid.toUpperCase().startsWith('HP-') ? hid.toUpperCase() : `HP-${hid}`
  } else if (doctor && doctor.name !== 'Doctor Earnings Statement') {
    const did = String(doctor.public_id || doctor.id || doctor.doctor_code || doctor.code || '')
    entityTag = did.toUpperCase().startsWith('DR-') ? did.toUpperCase() : `DR-${did}`
  } else if (data[0]?.hospital_name) {
    entityTag = 'HP'
  } else if (data[0]?.doctor_name) {
    entityTag = 'DR'
  }

  const memoNumber = isMonthly
    ? `INV-${filters.year}${String(filters.month).padStart(2, '0')}-${entityTag}-${uniqueSerial}`
    : `CM-${entityTag}-${uniqueSerial}`

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

  // Financial Metrics
  const totalCount = data.length
  const totalFees = data.reduce((acc, cur) => acc + Number(cur.amount || 0), 0) || Number(summary.total_fees || summary.total_billed || 0)
  const totalCommission = data.reduce((acc, cur) => acc + Number(cur.commission_amount || 0), 0) || Number(summary.total_commission || 0)
  const netEarnings = Math.max(0, totalFees - totalCommission)

  // Counter Cash Breakdown
  const counterCashCount = data.filter(d => 
    d.payment_method === 'Cash' || 
    ['hospital', 'doctor', 'admin'].includes(d.payment_collected_by_role) || 
    d.created_by_role === 'manager'
  ).length
  const counterCashAmount = data.filter(d => 
    d.payment_method === 'Cash' || 
    ['hospital', 'doctor', 'admin'].includes(d.payment_collected_by_role) || 
    d.created_by_role === 'manager'
  ).reduce((acc, cur) => acc + Number(cur.amount || 0), 0) || Number(summary.counter_cash_amount || 0)

  // Status Check
  const isPaid = data.length > 0 && data.every(d => (d.commission_status || '').toLowerCase() === 'paid')
  const isVerifying = data.length > 0 && data.some(d => (d.commission_status || '').toLowerCase() === 'verifying')
  const statusText = isPaid ? 'PAID & SETTLED' : isVerifying ? 'VERIFYING / IN REVIEW' : 'UNPAID / DUE'
  const statusColor = isPaid ? '#10B981' : isVerifying ? '#D97706' : '#EF4444'
  const statusBg = isPaid ? 'rgba(16, 185, 129, 0.1)' : isVerifying ? 'rgba(217, 119, 6, 0.1)' : 'rgba(239, 68, 68, 0.1)'

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Statement_${memoNumber}`
  })

  const handleDownloadPdf = async () => {
    const element = componentRef.current
    if (!element) return

    const opt = {
      margin:       [8, 8, 8, 8],
      filename:     `Monthly_Statement_${memoNumber}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    
    try {
      const { default: html2pdf } = await import('html2pdf.js')
      html2pdf().from(element).set(opt).save()
    } catch (e) {
      console.error('PDF export failed:', e)
      handlePrint()
    }
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        maxWidth: 920,
        width: '100%',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #CBD5E1',
        overflow: 'hidden'
      }}>
        
        {/* Top Action Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#00A88C',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              <Receipt size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                {isMonthly ? 'মাসিক বিলিং স্টেটমেন্ট ও ইনভয়েস' : 'কমিশন মেমো ও স্টেটমেন্ট প্রিভিউ'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                ইনভয়েস নং: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>{memoNumber}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
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
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                background: '#00A88C',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 168, 140, 0.3)'
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
                padding: 6,
                borderRadius: 6
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Statement Body */}
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
            className="printable-statement"
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '820px',
              padding: '36px 42px',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              color: '#1E293B',
              boxSizing: 'border-box'
            }}
          >
            {/* Header: Brand & Document Meta */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: 20,
              borderBottom: '2.5px solid #00A88C'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#00A88C',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 18
                  }}>
                    D
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#00A88C', letterSpacing: '-0.3px' }}>
                      Doctor Booklet
                    </h1>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                      Digital Healthcare Platform & Chamber Network
                    </p>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 10, lineHeight: 1.5 }}>
                  Dhaka, Bangladesh • Helpline: +880 1747-465666<br />
                  Email: billing@doctorbooklet.com • Web: doctorbooklet.com
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '3px 9px',
                  borderRadius: 4,
                  background: 'rgba(0, 168, 140, 0.1)',
                  color: '#007A65',
                  marginBottom: 6
                }}>
                  {isMonthly ? 'MONTHLY BILLING STATEMENT & INVOICE' : 'COMMISSION SETTLEMENT MEMO'}
                </span>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '0.3px', fontFamily: 'monospace' }}>
                  {memoNumber}
                </h2>
                <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>
                  <strong>Issue Date:</strong> {todayDate}
                </div>
                <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
                  <strong>Billing Cycle:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{period}</span>
                </div>
              </div>
            </div>

            {/* Recipient & Billing Info (Clean 2-Column Box) */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '16px',
              margin: '18px 0',
              borderRadius: 8,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}>
              {/* Left: Recipient Details */}
              <div style={{ maxWidth: '60%' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Billed To / Partner Provider (গ্রহীতা)
                </span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 3 }}>
                  {targetName}
                </div>
                <div style={{ fontSize: 12, color: '#334155', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, color: '#00A88C' }}>Partner ID:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#ffffff', padding: '1px 6px', borderRadius: 4, border: '1px solid #CBD5E1' }}>
                    {targetId}
                  </span>
                </div>
                {targetContact && (
                  <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} color="#64748B" />
                    <span>{targetContact}</span>
                  </div>
                )}
                {targetAddress && (
                  <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color="#64748B" />
                    <span>{targetAddress}</span>
                  </div>
                )}
              </div>

              {/* Right: Payment Status */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Settlement Status (বিল অবস্থা)
                </span>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 800,
                    background: statusBg,
                    color: statusColor,
                    border: `1.5px solid ${statusColor}`,
                    letterSpacing: '0.03em'
                  }}>
                    {isPaid ? <CheckCircle2 size={13} strokeWidth={2.6} /> : isVerifying ? <Clock size={13} strokeWidth={2.6} /> : <AlertTriangle size={13} strokeWidth={2.6} />}
                    {statusText}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>
                  {isPaid ? 'All commissions settled' : 'Payment due to Doctor Booklet'}
                </div>
              </div>
            </div>

            {/* Cash Reconciliation & Financial Matrix Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
              marginBottom: 20
            }}>
              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Patients</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{totalCount}</div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Completed Visits</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Gross Visit Fees</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>৳{totalFees.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#059669', marginTop: 2 }}>Counter Collection</div>
              </div>

              <div style={{ background: '#ECFDF5', padding: '10px 12px', borderRadius: 8, border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>Partner Retained</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#059669', marginTop: 2 }}>৳{netEarnings.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#047857', marginTop: 2 }}>Net Take-Home</div>
              </div>

              <div style={{ background: isPaid ? '#F0FDF4' : '#FEF2F2', padding: '10px 12px', borderRadius: 8, border: isPaid ? '1px solid #BBF7D0' : '1px solid #FECACA' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: isPaid ? '#166534' : '#991B1B', textTransform: 'uppercase' }}>Platform Due</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: isPaid ? '#15803D' : '#DC2626', marginTop: 2 }}>
                  ৳{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 10, color: isPaid ? '#15803D' : '#B91C1C', marginTop: 2 }}>
                  {isPaid ? 'Settled' : 'Payable Commission'}
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ marginBottom: 20 }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 11,
                tableLayout: 'fixed'
              }}>
                <thead>
                  <tr style={{
                    background: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                    borderBottom: '2px solid #CBD5E1',
                    textAlign: 'left'
                  }}>
                    <th style={{ padding: '8px 8px', width: '5%', color: '#475569', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '8px 8px', width: '12%', color: '#475569' }}>Date</th>
                    <th style={{ padding: '8px 8px', width: '22%', color: '#475569' }}>Patient & ID</th>
                    <th style={{ padding: '8px 8px', width: '18%', color: '#475569' }}>Doctor / Chamber</th>
                    <th style={{ padding: '8px 8px', width: '16%', color: '#475569', textAlign: 'center' }}>Payment Collector</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', width: '12%', color: '#475569' }}>Fee (৳)</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', width: '7%', color: '#475569' }}>Comm %</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', width: '14%', color: '#475569' }}>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                        No appointment records found for this billing period.
                      </td>
                    </tr>
                  ) : (
                    data.map((row, index) => {
                      const isRowPaid = (row.commission_status || '').toLowerCase() === 'paid'
                      const collectorRole = row.payment_collected_by_role || (row.created_by_role === 'manager' ? 'hospital' : 'chamber')
                      const isHospitalCounter = collectorRole === 'hospital'
                      const isDoctorChamber = collectorRole === 'doctor' || (!row.payment_collected_by_role && row.payment_method === 'Cash')

                      return (
                        <tr
                          key={row.id || index}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: index % 2 === 1 ? '#FAFAFA' : '#FFFFFF'
                          }}
                        >
                          <td style={{ padding: '8px 8px', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>{index + 1}</td>
                          <td style={{ padding: '8px 8px', color: '#334155', whiteSpace: 'nowrap' }}>
                            {formatMemoDate(row.date || row.appointment_date)}
                          </td>
                          <td style={{ padding: '8px 8px', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <div style={{ fontWeight: 700, fontSize: 11.5 }}>{row.patient_name || 'Patient'}</div>
                            <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace' }}>
                              {row.public_id || row.registration_id}
                              {row.patient_phone ? ` • ${row.patient_phone}` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '8px 8px', color: '#334155' }}>
                            <div style={{ fontWeight: 600, fontSize: 11 }}>{row.doctor_name || row.chamber_name || 'Consultant'}</div>
                            {row.hospital_name && (
                              <div style={{ fontSize: 10, color: '#64748B' }}>{row.hospital_name}</div>
                            )}
                          </td>
                          <td style={{ padding: '8px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              background: isHospitalCounter ? 'rgba(37, 99, 235, 0.08)' : isDoctorChamber ? 'rgba(5, 150, 105, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                              color: isHospitalCounter ? '#1D4ED8' : isDoctorChamber ? '#047857' : '#475569',
                              border: isHospitalCounter ? '1px solid rgba(37, 99, 235, 0.2)' : isDoctorChamber ? '1px solid rgba(5, 150, 105, 0.2)' : '1px solid #CBD5E1'
                            }}>
                              {isHospitalCounter ? '🏥 কাউন্টার ক্যাশ' : isDoctorChamber ? '🩺 চেম্বার ক্যাশ' : (row.payment_method || 'ক্যাশ')}
                            </span>
                          </td>
                          <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                            ৳{Number(row.amount || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '8px 8px', textAlign: 'center', color: '#64748B', whiteSpace: 'nowrap' }}>
                            {row.commission_rate ? `${row.commission_rate}%` : '0%'}
                          </td>
                          <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 800, color: isRowPaid ? '#059669' : '#00A88C', whiteSpace: 'nowrap' }}>
                            ৳{Number(row.commission_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Reconciliation Note & Final Calculation Box */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 24,
              gap: 20
            }}>
              {/* Payment Instructions for Platform Settlement */}
              <div style={{
                flex: 1,
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#0F172A', marginBottom: 6, textTransform: 'uppercase' }}>
                  <Landmark size={14} color="#00A88C" />
                  <span>Platform Commission Payment Channels (কমিশন পরিশোধের মাধ্যম)</span>
                </div>
                <div style={{ fontSize: 10.5, color: '#475569', lineHeight: 1.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Smartphone size={12} color="#E11D48" />
                    <strong>bKash / Nagad:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>01747-465666</span> (Merchant / Send Money)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <Landmark size={12} color="#2563EB" />
                    <strong>Bank A/C:</strong> <span style={{ color: '#0F172A', fontWeight: 600 }}>Doctor Booklet Ltd., Islami Bank Bangladesh Ltd.</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 10, color: '#64748B', borderTop: '1px dashed #CBD5E1', paddingTop: 4 }}>
                    💡 <em>অনুগ্রহ করে কমিশন পরিশোধের সময় রেফারেন্সে ইনভয়েস নম্বর (<strong>{memoNumber}</strong>) উল্লেখ করুন।</em>
                  </div>
                </div>
              </div>

              {/* Bottom Summary Table */}
              <div style={{
                width: 290,
                background: '#FFFFFF',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1.5px solid #00A88C'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11.5 }}>
                  <span style={{ color: '#64748B' }}>Total Appointments:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{totalCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11.5 }}>
                  <span style={{ color: '#64748B' }}>Gross Visit Fees:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>৳{totalFees.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11.5 }}>
                  <span style={{ color: '#059669', fontWeight: 700 }}>Partner Take-Home:</span>
                  <span style={{ fontWeight: 800, color: '#059669' }}>৳{netEarnings.toLocaleString()}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '2px solid #00A88C',
                  fontSize: 13.5,
                  fontWeight: 900
                }}>
                  <span style={{ color: '#0F172A' }}>Platform Commission:</span>
                  <span style={{ color: isPaid ? '#059669' : '#00A88C' }}>
                    ৳{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingTop: 24,
              borderTop: '1px solid #E2E8F0'
            }}>
              <div style={{ textAlign: 'center', width: 180 }}>
                <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4, fontStyle: 'italic' }}>
                  Auto Generated System Statement
                </div>
                <div style={{ borderBottom: '1px solid #CBD5E1', marginBottom: 4 }}></div>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155' }}>
                  System Billing Automation
                </div>
              </div>

              {/* Digital Stamp Seal */}
              <div style={{
                textAlign: 'center',
                padding: '6px 14px',
                border: '1.5px dashed #00A88C',
                borderRadius: 8,
                background: 'rgba(0, 168, 140, 0.04)'
              }}>
                <ShieldCheck size={20} color="#00A88C" style={{ margin: '0 auto 2px' }} />
                <div style={{ fontSize: 9.5, fontWeight: 900, color: '#00A88C', letterSpacing: '0.04em' }}>
                  VERIFIED DIGITAL INVOICE
                </div>
                <div style={{ fontSize: 8.5, color: '#64748B' }}>Doctor Booklet Platform</div>
              </div>

              <div style={{ textAlign: 'center', width: 180 }}>
                <div style={{ height: 16 }}></div>
                <div style={{ borderBottom: '1px solid #CBD5E1', marginBottom: 4 }}></div>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155' }}>
                  Receiver / Partner Signature
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div style={{
              textAlign: 'center',
              fontSize: 10,
              color: '#94A3B8',
              marginTop: 20
            }}>
              This is a computer-generated billing statement and invoice. For any inquiries, please contact support@doctorbooklet.com.
            </div>

          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-statement, .printable-statement * {
            visibility: visible;
          }
          .printable-statement {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 10mm 12mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}} />
    </div>
  )
}

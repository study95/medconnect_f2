import React, { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import html2pdf from 'html2pdf.js'

export default function CommissionMemo({ show, onClose, data, summary, filters, doctor, hospital }) {
  const componentRef = useRef()

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  })

  const handleDownloadPdf = () => {
    const element = componentRef.current;
    const opt = {
      margin:       10,
      filename:     `Memo_${doctor ? 'Doctor' : 'Hospital'}_${doctor?.id || hospital?.id}_${filters.month}_${filters.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  }

  if (!show) return null

  const targetName = doctor?.name || hospital?.name || 'All Entities'
  const targetId = doctor?.id || hospital?.id || '-'
  const period = filters.month && filters.year 
    ? `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2026, filters.month - 1))} ${filters.year}`
    : 'All Time'

  const managerCommission = data.filter(d => d.created_by_role === 'manager').reduce((sum, d) => sum + Number(d.commission_amount || 0), 0)
  const patientCommission = data.filter(d => d.created_by_role === 'patient').reduce((sum, d) => sum + Number(d.commission_amount || 0), 0)

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal" style={{ maxWidth: 900, width: '95%', background: 'var(--admin-card-bg)' }}>
        <div className="admin-modal-header" style={{ borderBottom: '1px solid var(--admin-border)' }}>
          <h3 className="admin-modal-title" style={{ color: 'var(--admin-text)' }}>📄 Commission Memo Preview</h3>
          <button className="admin-modal-close" onClick={onClose} style={{ color: 'var(--admin-text)' }}>&times;</button>
        </div>

        <div className="admin-modal-body" style={{ maxHeight: '80vh', overflowY: 'auto', background: 'var(--admin-bg)', padding: '40px 20px' }}>
          {/* Printable Area */}
          <div ref={componentRef} style={{
            background: 'white',
            padding: '50px',
            borderRadius: 2,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            minHeight: '297mm',
            width: '100%',
            maxWidth: '210mm',
            margin: '0 auto',
            fontFamily: "'Inter', sans-serif",
            color: '#1F2937'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #F3F4F6', paddingBottom: 30, marginBottom: 40 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#4F46E5', margin: 0 }}>Doctor Booklet</h1>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Digital Healthcare Ecosystem</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Commission Memo</h2>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Date: {new Date().toLocaleDateString()}</p>
                <p style={{ fontSize: 12, color: '#6B7280' }}>Ref: MEMO-{Date.now().toString().slice(-6)}</p>
              </div>
            </div>

            {/* Info Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
              <div>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12 }}>Sender Information</h4>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Doctor Booklet Authority</div>
                <div style={{ fontSize: 13, color: '#4B5563', marginTop: 4 }}>System Admin</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12 }}>Receiver Information</h4>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{targetName}</div>
                <div style={{ fontSize: 13, color: '#4B5563', marginTop: 4 }}>ID: #{targetId}</div>
                <div style={{ fontSize: 13, color: '#4B5563' }}>Type: {doctor ? 'Doctor' : hospital ? 'Hospital' : 'Mixed'}</div>
              </div>
            </div>

            {/* Billing Period & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '16px 20px', borderRadius: 8, marginBottom: 40, borderLeft: '4px solid #4F46E5' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Billing Month</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{period}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Memo Status</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#059669', marginTop: 4 }}>PAID</div>
              </div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #1F2937' }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Patient / ID</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Booking By</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Fee</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Comm %</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Commission</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 0', fontSize: 13 }}>{row.date}</td>
                    <td style={{ padding: '12px 0', fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{row.patient_name}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>#{row.registration_id}</div>
                    </td>
                    <td style={{ padding: '12px 0', fontSize: 13, textTransform: 'capitalize' }}>
                      <span style={{ background: row.created_by_role === 'manager' ? '#FEF3C7' : '#E0E7FF', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: row.created_by_role === 'manager' ? '#92400E' : '#3730A3' }}>
                        {row.created_by_role === 'manager' ? 'hospital' : row.created_by_role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 0', fontSize: 13, textAlign: 'right' }}>৳{row.amount}</td>
                    <td style={{ padding: '12px 0', fontSize: 13, textAlign: 'right' }}>{row.commission_rate}%</td>
                    <td style={{ padding: '12px 0', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>৳{row.commission_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: hospital ? 'space-between' : 'flex-end', alignItems: 'flex-start' }}>
              {hospital && (
                <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 8, width: 300 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 16 }}>Commission Breakdown</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>Hospital Commission:</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>৳{managerCommission.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>Direct Patient Commission:</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>৳{patientCommission.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              <div style={{ width: 250 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Subtotal</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>৳{summary.total_commission}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', marginTop: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800 }}>Total Paid</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#4F46E5' }}>৳{summary.total_commission}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 80, borderTop: '1px solid #F3F4F6', paddingTop: 30 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 150, borderBottom: '1px solid #D1D5DB', marginBottom: 8 }}></div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Doctor Booklet Authority</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 150, borderBottom: '1px solid #D1D5DB', marginBottom: 8 }}></div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Recipient Signature</div>
                </div>
              </div>
              <p style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 40 }}>
                This is a computer generated document. No physical signature is required unless specified.
              </p>
            </div>
          </div>
        </div>

        <div className="admin-modal-footer" style={{ borderTop: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)' }}>
          <button className="admin-btn admin-btn-outline" onClick={onClose}>Close</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="admin-btn admin-btn-outline" onClick={handlePrint} style={{ background: 'var(--admin-card-bg)' }}>🖨️ Print</button>
            <button className="admin-btn admin-btn-primary" onClick={handleDownloadPdf}>📥 Download PDF</button>
          </div>
        </div>
      </div>
    </div>
  )
}

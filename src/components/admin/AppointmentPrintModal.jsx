import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer, Download, X, Calendar, User, CheckCircle2, Loader2, FileSpreadsheet, FileText } from 'lucide-react'
import { getAppointments } from '../../api/adminApi'
import toast from 'react-hot-toast'

export default function AppointmentPrintModal({
  show,
  onClose,
  appointments = [],
  total = 0,
  filters = {},
  doctors = [],
  hospitals = [],
  user = null
}) {
  const printRef = useRef(null)
  const [printScope, setPrintScope] = useState('all') // 'all' | 'page'
  const [allData, setAllData] = useState([])
  const [fetchingAll, setFetchingAll] = useState(false)

  // Fetch all filtered records if total > current page items
  useEffect(() => {
    let isMounted = true
    if (show && printScope === 'all' && total > appointments.length) {
      setFetchingAll(true)
      getAppointments({
        ...filters,
        page: 1,
        per_page: Math.min(total, 500)
      })
        .then(res => {
          if (!isMounted) return
          const raw = res.data?.data?.data || res.data?.data || res.data || []
          setAllData(Array.isArray(raw) ? raw : [])
        })
        .catch(err => {
          console.error('Failed to fetch full print list', err)
          toast.error('সম্পূর্ণ তালিকা আনতে সমস্যা হয়েছে, বর্তমান পেজের ডেটা ব্যবহার করা হচ্ছে')
          if (isMounted) setAllData(appointments)
        })
        .finally(() => {
          if (isMounted) setFetchingAll(false)
        })
    } else if (show) {
      setAllData(appointments)
    }
    return () => {
      isMounted = false
    }
  }, [show, printScope, total, appointments, filters])

  // Active dataset for print and preview
  const dataToPrint = printScope === 'all' && allData.length > 0 ? allData : appointments

  // Filter labels for print header
  const doctorName = useMemo(() => {
    if (!filters.doctor_id) return null
    const doc = doctors.find(d => String(d.id) === String(filters.doctor_id))
    return doc?.name || `Doctor #${filters.doctor_id}`
  }, [filters.doctor_id, doctors])

  const hospitalName = useMemo(() => {
    if (!filters.hospital_id) return null
    const hosp = hospitals.find(h => String(h.id) === String(filters.hospital_id))
    return hosp?.name || `Hospital #${filters.hospital_id}`
  }, [filters.hospital_id, hospitals])

  const dateDescription = useMemo(() => {
    if (filters.date_from && filters.date_to) {
      if (filters.date_from === filters.date_to) {
        return `তারিখ: ${filters.date_from}`
      }
      return `তারিখ সীমা: ${filters.date_from} হতে ${filters.date_to}`
    }
    if (filters.date_from) return `তারিখ: ${filters.date_from} থেকে পরবর্তী`
    if (filters.date_to) return `তারিখ: ${filters.date_to} পর্যন্ত`
    if (filters.month && filters.year) return `মাস/বছর: ${filters.month}/${filters.year}`
    return 'সকল তারিখের অ্যাপয়েন্টমেন্ট'
  }, [filters])

  // React to print handler using contentRef for react-to-print v3+
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Appointment_Schedule_${filters.date_from || 'list'}_${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    onPrintError: (errorLocation, error) => {
      console.error('Print error:', errorLocation, error)
      toast.error('প্রিন্ট করতে সমস্যা হয়েছে')
    }
  })

  // Direct PDF Download via html2pdf
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const handleDownloadPdf = async () => {
    if (!printRef.current) return
    setDownloadingPdf(true)
    const toastId = toast.loading('PDF ফাইল প্রস্তুত হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...')
    try {
      const { default: html2pdf } = await import('html2pdf.js')
      const opt = {
        margin: [6, 6, 6, 6],
        filename: `Appointments_${filters.date_from || 'list'}_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }
      await html2pdf().from(printRef.current).set(opt).save()
      toast.success('PDF ফাইল সফলভাবে ডাউনলোড হয়েছে!', { id: toastId })
    } catch (err) {
      console.error('Failed to download PDF', err)
      toast.error('PDF ডাউনলোড করতে সমস্যা হয়েছে', { id: toastId })
    } finally {
      setDownloadingPdf(false)
    }
  }

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCsv = () => {
    if (!dataToPrint || dataToPrint.length === 0) {
      toast.error('এক্সপোর্ট করার জন্য কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি')
      return
    }

    const headers = [
      'SL',
      'Serial No',
      'Appointment ID',
      'Patient Name',
      'Relation',
      'Phone Number',
      'Age',
      'Doctor Name',
      'Specialty',
      'Chamber / Hospital',
      'Schedule Date',
      'Schedule Time',
      'Booked By',
      'Status',
      'Payment Status'
    ]

    const rows = dataToPrint.map((appt, idx) => [
      idx + 1,
      `"Serial-${appt.serial_number || (idx + 1)}"`,
      `"${(appt.public_id || appt.id || '').toString().replace(/"/g, '""')}"`,
      `"${(appt.patient_name || appt.patient?.name || appt.user_name || 'N/A').replace(/"/g, '""')}"`,
      `"${(appt.booking_for && appt.booking_for !== 'myself' ? (appt.patient_relation || 'Relative') : 'Self').replace(/"/g, '""')}"`,
      `"${(appt.patient_phone || appt.patient?.phone || appt.user?.phone || appt.created_by_phone || '').replace(/"/g, '""')}"`,
      `"${appt.patient_age || appt.patient?.age || '—'}"`,
      `"${(appt.doctor?.name || appt.doctor_name || '—').replace(/"/g, '""')}"`,
      `"${(appt.doctor?.specialty?.name || '—').replace(/"/g, '""')}"`,
      `"${(appt.hospital?.name || appt.chamber?.name || appt.hospital_name || appt.chamber_name || '—').replace(/"/g, '""')}"`,
      `"${appt.date || appt.appointment_date || '—'}"`,
      `"${appt.time || appt.appointment_time || '—'}"`,
      `"${(appt.created_by_name || appt.user_name || appt.booker?.name || 'Unknown').replace(/"/g, '""')}"`,
      `"${appt.status || 'pending'}"`,
      `"${appt.payment_status || 'unpaid'}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Appointments_${filters.date_from || 'list'}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('CSV/Excel ফাইল সফলভাবে ডাউনলোড হয়েছে')
  }

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10500,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 18,
          width: '100%',
          maxWidth: 1020,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeInSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL TOOLBAR HEADER */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Printer size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                অ্যাপয়েন্টমেন্ট প্রিন্ট ও রিপোর্ট প্রিভিউ
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
                মোট {dataToPrint.length} টি অ্যাপয়েন্টমেন্ট প্রস্তুত
                {fetchingAll && ' (সম্পূর্ণ ডেটা লোড হচ্ছে...)'}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {total > appointments.length && (
              <div
                style={{
                  display: 'flex',
                  background: '#E2E8F0',
                  padding: 3,
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                <button
                  type="button"
                  onClick={() => setPrintScope('all')}
                  style={{
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: printScope === 'all' ? '#FFFFFF' : 'transparent',
                    color: printScope === 'all' ? '#0F172A' : '#64748B',
                    cursor: 'pointer',
                    boxShadow: printScope === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  সবগুলো ({total})
                </button>
                <button
                  type="button"
                  onClick={() => setPrintScope('page')}
                  style={{
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: printScope === 'page' ? '#FFFFFF' : 'transparent',
                    color: printScope === 'page' ? '#0F172A' : '#64748B',
                    cursor: 'pointer',
                    boxShadow: printScope === 'page' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  বর্তমান পেজ ({appointments.length})
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 13px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="Export as Excel compatible CSV"
            >
              <FileSpreadsheet size={15} color="#16A34A" />
              <span>Excel / CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || fetchingAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                border: downloadingPdf ? '1.5px solid #0284C7' : '1.5px solid #E2E8F0',
                background: downloadingPdf ? '#F0F9FF' : '#F8FAFC',
                color: downloadingPdf ? '#0284C7' : '#0F172A',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: downloadingPdf || fetchingAll ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s'
              }}
              title="Download direct PDF file"
            >
              {downloadingPdf ? <Loader2 size={15} className="animate-spin" color="#0284C7" /> : <FileText size={15} color="#0284C7" />}
              <span>{downloadingPdf ? 'ডাউনলোড হচ্ছে...' : 'PDF ডাউনলোড'}</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrint()}
              disabled={fetchingAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                cursor: fetchingAll ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.15s'
              }}
              title="Print document or save using browser dialog"
            >
              {fetchingAll ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              <span>প্রিন্ট করুন</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none',
                background: '#F1F5F9',
                color: '#64748B',
                width: 36,
                height: 36,
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINT PREVIEW BODY */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            background: '#F1F5F9',
            padding: '24px 20px',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {/* A4 PRINT CONTAINER */}
          <div
            ref={printRef}
            className="appointment-print-sheet"
            style={{
              background: '#FFFFFF',
              width: '100%',
              maxWidth: 820,
              minHeight: 1000,
              padding: '28px 24px',
              borderRadius: 10,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
              color: '#0F172A',
              fontFamily: "'Hind Siliguri', 'Segoe UI', Tahoma, sans-serif",
              boxSizing: 'border-box'
            }}
          >
            {/* PRINT WATERMARK / HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2px solid #059669',
                paddingBottom: 14,
                marginBottom: 16
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>
                    Doctor<span style={{ color: '#0F172A' }}>Booklet</span>
                  </span>
                  <span style={{ fontSize: 10.5, background: '#ECFDF5', color: '#047857', padding: '2px 7px', borderRadius: 5, fontWeight: 700, border: '1px solid #A7F3D0' }}>
                    ক্লিনিক্যাল শিডিউল
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  স্মার্ট স্বাস্থ্যসেবা ও ডিজিটাল অ্যাপয়েন্টমেন্ট ম্যানেজমেন্ট সিস্টেম
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  রোগী অ্যাপয়েন্টমেন্ট তালিকা
                </h2>
                <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 2 }}>
                  {dateDescription}
                </div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>
                  প্রিন্ট সময়: {new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })} • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* CONTEXT METADATA BAR */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '9px 14px',
                marginBottom: 18,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: 8,
                fontSize: 11
              }}
            >
              <div>
                <span style={{ color: '#64748B' }}>ডাক্তার: </span>
                <strong style={{ color: '#0F172A' }}>{doctorName || 'সকল ডাক্তার'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>ভেন্যু: </span>
                <strong style={{ color: '#0F172A' }}>{hospitalName || 'সকল চেম্বার / ভেন্যু'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>মোট রোগী: </span>
                <strong style={{ color: '#059669', fontSize: 12 }}>{dataToPrint.length} জন</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>প্রিন্টকারী: </span>
                <strong style={{ color: '#0F172A' }}>{user?.name || 'অ্যাডমিন/স্টাফ'}</strong>
              </div>
            </div>

            {/* APPOINTMENT TABLE (PERFECTLY BALANCED COLUMNS) */}
            <table
              style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                fontSize: 11,
                textAlign: 'left',
                border: '1px solid #CBD5E1',
                marginBottom: 24
              }}
            >
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                  <th style={{ padding: '9px 6px', fontWeight: 800, width: '6%', textAlign: 'center', color: '#1E293B', borderRight: '1px solid #E2E8F0' }}>ক্রমিক</th>
                  <th style={{ padding: '9px 8px', fontWeight: 800, width: '12%', color: '#1E293B', borderRight: '1px solid #E2E8F0' }}>সিরিয়াল নং</th>
                  <th style={{ padding: '9px 10px', fontWeight: 800, width: '16%', color: '#1E293B', borderRight: '1px solid #E2E8F0' }}>রোগীর তথ্য</th>
                  <th style={{ padding: '9px 10px', fontWeight: 800, width: '14%', color: '#1E293B', borderRight: '1px solid #E2E8F0' }}>মোবাইল নম্বর</th>
                  <th style={{ padding: '9px 10px', fontWeight: 800, width: '21%', color: '#1E293B', borderRight: '1px solid #E2E8F0' }}>ডাক্তার ও ভেন্যু</th>
                  <th style={{ padding: '9px 8px', fontWeight: 800, width: '10%', color: '#1E293B', borderRight: '1px solid #E2E8F0' }}>সময় / স্লট</th>
                  <th style={{ padding: '9px 6px', fontWeight: 800, width: '13%', textAlign: 'center', color: '#1E293B', borderRight: '1px solid #E2E8F0' }}>স্ট্যাটাস</th>
                  <th style={{ padding: '9px 6px', fontWeight: 800, width: '8%', textAlign: 'center', color: '#1E293B' }}>উপস্থিতি</th>
                </tr>
              </thead>
              <tbody>
                {dataToPrint.map((appt, idx) => {
                  const patientName = appt.patient_name || appt.patient?.name || appt.user_name || 'N/A'
                  const patientPhone = appt.patient_phone || appt.patient?.phone || appt.user?.phone || appt.created_by_phone || '—'
                  const doctorText = appt.doctor?.name || appt.doctor_name || '—'
                  const chamberText = appt.hospital?.name || appt.chamber?.name || appt.hospital_name || appt.chamber_name || ''
                  const serialNum = appt.serial_number || idx + 1
                  const age = appt.patient_age || appt.patient?.age
                  const isRelative = appt.booking_for && appt.booking_for !== 'myself'

                  return (
                    <tr
                      key={appt.id || idx}
                      style={{
                        borderBottom: '1px solid #E2E8F0',
                        background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
                      }}
                    >
                      <td style={{ padding: '9px 6px', textAlign: 'center', fontWeight: 700, color: '#334155', fontSize: 11.5, borderRight: '1px solid #E2E8F0' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '9px 8px', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 800, color: '#059669', fontSize: 11.5 }}>
                          Serial-{serialNum}
                        </span>
                      </td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={patientName}>
                          {patientName}
                        </div>
                        {(age || isRelative) && (
                          <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {age ? `${age} বছর` : ''} {isRelative ? `• আত্মীয় (${appt.patient_relation || 'Relative'})` : ''}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '9px 10px', fontFamily: 'monospace', color: '#1E293B', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderRight: '1px solid #E2E8F0' }}>
                        {patientPhone}
                      </td>
                      <td style={{ padding: '9px 10px', borderRight: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doctorText}>
                          {doctorText}
                        </div>
                        {chamberText && (
                          <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={chamberText}>
                            {chamberText}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '9px 8px', color: '#334155', fontWeight: 700, fontSize: 10.5, whiteSpace: 'nowrap', borderRight: '1px solid #E2E8F0' }}>
                        {appt.time || '10:00 AM'}
                      </td>
                      <td style={{ padding: '9px 6px', textAlign: 'center', whiteSpace: 'nowrap', borderRight: '1px solid #E2E8F0' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 10.5,
                            textTransform: 'uppercase',
                            color: appt.status === 'confirmed'
                              ? '#059669'
                              : appt.status === 'completed'
                              ? '#2563EB'
                              : appt.status === 'cancelled'
                              ? '#DC2626'
                              : '#D97706'
                          }}
                        >
                          {appt.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 6px', textAlign: 'center' }}>
                        <div
                          style={{
                            width: 15,
                            height: 15,
                            border: '1.5px solid #64748B',
                            borderRadius: 3.5,
                            background: '#FFFFFF',
                            margin: '0 auto',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
                          }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* PRINT SIGNATURE FOOTER */}
            <div
              style={{
                marginTop: 40,
                paddingTop: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontSize: 11,
                color: '#64748B'
              }}
            >
              <div style={{ textAlign: 'center', width: 170 }}>
                <div style={{ borderTop: '1px dashed #94A3B8', paddingTop: 6, fontWeight: 700, color: '#334155' }}>
                  রিসেপশনিস্ট / অ্যাসিস্ট্যান্ট স্বাক্ষর
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: 10.5 }}>
                Doctor Booklet ক্লিনিক্যাল ম্যানেজমেন্ট সিস্টেম দ্বারা প্রস্তুতকৃত।
              </div>

              <div style={{ textAlign: 'center', width: 170 }}>
                <div style={{ borderTop: '1px dashed #94A3B8', paddingTop: 6, fontWeight: 700, color: '#334155' }}>
                  ডাক্তার / কর্তৃপক্ষের স্বাক্ষর
                </div>
              </div>
            </div>

            {/* PRINT CSS OVERRIDES */}
            <style>{`
              @media print {
                body {
                  background: white !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .appointment-print-sheet {
                  max-width: 100% !important;
                  box-shadow: none !important;
                  padding: 8mm 6mm !important;
                  min-height: auto !important;
                }
                @page {
                  size: A4 portrait;
                  margin: 6mm;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  )
}

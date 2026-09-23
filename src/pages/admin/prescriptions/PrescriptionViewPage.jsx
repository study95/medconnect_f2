import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Printer, Download, ArrowLeft, Edit2 } from 'lucide-react'
import { getPrescription } from '../../../api/adminApi'
import PrescriptionPaper from '../../../components/common/PrescriptionPaper'
import '../../../styles/prescription.css'

const DIGITAL_PRESCRIPTION_TEMPLATES = [
  {
    id: 'digital-qr-barcode',
    name: '১. ডিজিটাল প্রিন্ট (QR কোড ও বারকোড সহ)',
    badge: 'ডিজিটাল প্রিন্ট'
  },
  {
    id: 'pad-print-only-data',
    name: '২. ডাক্তারের হার্ড প্যাড (শুধু তথ্যগুলো প্রিন্ট হবে)',
    badge: 'প্যাড প্রিন্ট'
  },
  {
    id: 'smart-hospital',
    name: '৩. স্মার্ট হসপিটাল / ক্লিনিক লে-আউট',
    badge: 'হসপিটাল'
  },
  {
    id: 'classic-pad',
    name: '৪. ক্লাসিক বাংলা প্রেসক্রিপশন ডিজাইন',
    badge: 'স্ট্যান্ডার্ড'
  }
]

export default function PrescriptionViewPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const returnTo = searchParams.get('return_to') || '/admin/prescriptions'
  const [prescription, setPrescription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hideAll, setHideAll] = useState(false)
  const paperRef = useRef(null)

  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    const urlTpl = searchParams.get('template')
    if (urlTpl) return urlTpl
    try {
      return localStorage.getItem('dr_rx_template') || 'classic-pad'
    } catch (e) {
      return 'classic-pad'
    }
  })

  useEffect(() => { 
    loadPrescription() 
  }, [id])

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplate(templateId)
    try {
      localStorage.setItem('dr_rx_template', templateId)
    } catch (e) {}
  }

  // Direct A4 Print via isolated iframe
  const handlePrintNow = () => {
    if (!paperRef.current) {
      window.print()
      return
    }

    try {
      const paperElement = paperRef.current
      const htmlContent = paperElement.outerHTML

      let stylesHtml = ''
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        stylesHtml += node.outerHTML
      })

      const existingIframe = document.getElementById('dr-print-frame')
      if (existingIframe) {
        try { document.body.removeChild(existingIframe) } catch (e) {}
      }

      const printIframe = document.createElement('iframe')
      printIframe.id = 'dr-print-frame'
      printIframe.style.position = 'fixed'
      printIframe.style.top = '-9999px'
      printIframe.style.left = '-9999px'
      printIframe.style.width = '1024px'
      printIframe.style.height = '1448px'
      printIframe.style.border = '0px'
      printIframe.style.opacity = '0'
      printIframe.style.pointerEvents = 'none'
      printIframe.style.zIndex = '-9999'
      document.body.appendChild(printIframe)

      const doc = printIframe.contentWindow.document
      doc.open()
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Prescription Print</title>
            <meta charset="utf-8" />
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            ${stylesHtml}
            <style>
              * {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                width: 210mm !important;
                min-height: 297mm !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .rx-paper {
                margin: 0 auto !important;
                box-shadow: none !important;
                border: none !important;
                width: 210mm !important;
                min-height: 297mm !important;
                display: flex !important;
                flex-direction: column !important;
              }
              .rx-header,
              .rx-header-classic-bilingual {
                display: flex !important;
                flex-direction: row !important;
                justify-content: space-between !important;
                align-items: flex-start !important;
                width: 100% !important;
                min-height: 55mm !important;
                padding: 6mm 12mm 4mm 18mm !important;
                box-sizing: border-box !important;
                border-bottom: 3px solid #00A88C !important;
              }
              .rx-header-left {
                flex: 1.2 !important;
                text-align: left !important;
                min-width: 0 !important;
              }
              .rx-header-right {
                flex: 1.2 !important;
                text-align: right !important;
                min-width: 0 !important;
              }
              .rx-header-right .rx-degrees {
                align-items: flex-end !important;
              }
              .rx-body {
                display: flex !important;
                flex-direction: row !important;
                width: 100% !important;
                flex: 1 !important;
              }
              .rx-body-left {
                width: 32% !important;
                min-width: 65mm !important;
                max-width: 65mm !important;
                flex-shrink: 0 !important;
                background-color: #F0F7FF !important;
                border-right: 1.5px solid #D1D9E6 !important;
                border-bottom: none !important;
                padding: 6mm 4mm 6mm 18mm !important;
              }
              .rx-body-right {
                width: 68% !important;
                flex: 1 !important;
                padding: 6mm 12mm 6mm 8mm !important;
              }
              .rx-footer {
                display: flex !important;
                flex-direction: row !important;
                justify-content: space-between !important;
                align-items: center !important;
              }
              .rx-footer-right {
                text-align: right !important;
              }
              .rx-degrees, .rx-clinical-content, .rx-field-label {
                color: #1e293b !important;
              }
              .no-print {
                display: none !important;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `)
      doc.close()

      const runPrint = () => {
        try {
          printIframe.contentWindow.focus()
          printIframe.contentWindow.print()
        } catch (e) {
          window.print()
        }
      }

      // Ensure web fonts are completely loaded in the iframe before printing
      // This prevents browser fallback fonts and synthetic smudgy bolding
      if (doc.fonts && doc.fonts.ready) {
        doc.fonts.ready.then(() => {
          setTimeout(runPrint, 250)
        }).catch(() => {
          setTimeout(runPrint, 400)
        })
      } else {
        setTimeout(runPrint, 500)
      }
    } catch (e) {
      window.print()
    }
  }

  // Auto-Print or Auto-Download trigger on load
  const hasTriggeredActionRef = useRef(false)
  useEffect(() => {
    if (!loading && prescription && !hasTriggeredActionRef.current) {
      const action = searchParams.get('action')
      if (action === 'print') {
        hasTriggeredActionRef.current = true
        setTimeout(() => {
          handlePrintNow()
        }, 400)
      } else if (action === 'download') {
        hasTriggeredActionRef.current = true
        handleOpenPDF()
      }
    }
  }, [loading, prescription, searchParams])

  // EFFECT: Handle auto-PDF generation for patient 'Download PDF' button
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'download' && !loading && prescription) {
       handleOpenPDF();
    }
  }, [loading, prescription]);

  const handleOpenPDF = async () => {
    if (!paperRef.current) return;
    
    // Standard A4 Dimensions at 96 DPI for perfect mapping
    const A4_WIDTH_PX = 794;
    const A4_HEIGHT_PX = 1123;
    
    // Create new tab immediately to avoid popup blockers
    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write('<div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; color:#64748b; background:#f8fafc;">');
      newTab.document.write('<div style="width:40px; height:40px; border:4px solid #f1f5f9; border-top:4px solid #00A88C; border-radius:50%; animation:spin 1s linear infinite;"></div>');
      newTab.document.write('<h2 style="margin-top:20px; color:#1e293b;">Generating Ultra-Clear PDF...</h2>');
      newTab.document.write('<p>Please wait while we prepare your high-resolution prescription.</p>');
      newTab.document.write('<style>@keyframes spin { to { transform: rotate(360deg); } }</style>');
      newTab.document.write('</div>');
    }

    try {
      // Ensure web fonts are 100% loaded before taking canvas snapshot
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // Pre-fetch signature image to Base64 to prevent CORS issues with html2canvas
      if (prescription.doctor_signature && !prescription.doctor_signature.startsWith('data:image')) {
        try {
          const imgRes = await fetch(prescription.doctor_signature);
          const blob = await imgRes.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          setPrescription({ ...prescription, doctor_signature: base64 });
          // Wait for React to re-render the DOM with the base64 image
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (e) {
          console.warn('Failed to pre-fetch signature for PDF', e);
        }
      }

      const element = paperRef.current;
      // Dynamic imports: only load when user opens PDF (heavy libs, ~600KB)
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      // Capture at scale 3 (300 DPI Ultra HD) for razor-sharp typography
      const canvas = await html2canvas(element, {
        scale: 3, 
        useCORS: true,
        backgroundColor: '#ffffff',
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const clonedPaper = clonedDoc.querySelector('.rx-paper');
          if (clonedPaper) {
             clonedPaper.style.width = '210mm';
             clonedPaper.style.height = '297mm';
             clonedPaper.style.margin = '0';
             clonedPaper.style.boxShadow = 'none';
             clonedPaper.style.border = 'none';
          }
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              -webkit-font-smoothing: antialiased !important;
              -moz-osx-font-smoothing: grayscale !important;
              text-rendering: optimizeLegibility !important;
            }
            .rx-degrees, .rx-clinical-content, .rx-field-label {
              color: #1e293b !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Since we forced the canvas to A4 aspect ratio, we can fill the page exactly
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'download') {
        pdf.save(`Prescription_${id}.pdf`);
        // Small delay before closing to ensure the download is triggered
        setTimeout(() => window.close(), 1000);
      } else if (newTab) {
        newTab.location.href = pdfUrl;
      }
    } catch (err) {
      console.error('PDF Error:', err);
      if (newTab) newTab.close();
    }
  };

  const loadPrescription = async () => {
    setLoading(true)
    try {
      const res = await getPrescription(id)
      setPrescription(res.data?.data || res.data)
    } catch (err) {
      console.warn("Failed to load prescription:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
  if (!prescription) return <div className="admin-empty">Prescription not found</div>

  const rx = prescription

  return (
    <div className="dr-preview-page-container" style={{ minHeight: '100vh', background: '#f1f5f9', padding: '16px 12px 80px' }}>
      <div 
        className="dr-preview-standalone-card" 
        style={{ 
          maxWidth: 960, 
          margin: '0 auto', 
          background: '#ffffff', 
          borderRadius: 12, 
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)', 
          border: '1px solid #e2e8f0', 
          height: 'auto',
          maxHeight: 'none',
          overflow: 'visible' 
        }}
      >
        {/* Top Preview Action Bar matching Preview Modal */}
        <div 
          className="dr-modal-header no-print" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '12px 20px', 
            borderBottom: '1px solid #e2e8f0', 
            background: '#ffffff', 
            flexWrap: 'wrap', 
            gap: 10 
          }}
        >
          <div className="dr-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            <Eye size={18} color="#2563eb" /> Live Digital Prescription Preview
            {rx?.status === 'finalized' || rx?.status === 'locked' ? (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontWeight: 700 }}>
                🔒 Finalized
              </span>
            ) : (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                📝 Draft
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Template:</span>
              <select 
                className="dr-select-box"
                style={{ height: 30, fontSize: 12, padding: '0 24px 0 8px', backgroundPosition: 'right 6px center' }}
                value={selectedTemplate}
                onChange={(e) => handleSelectTemplate(e.target.value)}
              >
                {DIGITAL_PRESCRIPTION_TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', cursor: 'pointer', userSelect: 'none', background: '#f8fafc', padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <input type="checkbox" checked={hideAll} onChange={e => setHideAll(e.target.checked)} />
              <span>Hide Pad Header/Footer</span>
            </label>

            <button 
              type="button" 
              onClick={handlePrintNow}
              style={{ 
                background: '#2563eb', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: 6, 
                padding: '7px 16px', 
                fontSize: 13, 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
              }}
            >
              <Printer size={15} /> Print Now
            </button>

            <button 
              type="button" 
              onClick={handleOpenPDF}
              style={{ 
                background: '#00A88C', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: 6, 
                padding: '7px 14px', 
                fontSize: 13, 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,168,140,0.25)'
              }}
            >
              <Download size={14} /> PDF
            </button>

            {rx?.status === 'draft' && (
              <Link 
                to={`/admin/prescriptions/edit/${rx?.public_id || rx?.id || id}?return_to=${encodeURIComponent(returnTo)}`} 
                style={{ 
                  background: '#ffffff', 
                  color: '#475569', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: 6, 
                  padding: '6px 12px', 
                  fontSize: 13, 
                  fontWeight: 600, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  textDecoration: 'none'
                }}
              >
                <Edit2 size={13} /> Edit
              </Link>
            )}

            <button 
              type="button" 
              onClick={() => navigate(returnTo)} 
              style={{ 
                background: '#ffffff', 
                color: '#64748b', 
                border: '1px solid #cbd5e1', 
                borderRadius: 6, 
                padding: '6px 12px', 
                fontSize: 13, 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                cursor: 'pointer' 
              }}
            >
              <ArrowLeft size={14} /> {returnTo.includes('serial-display') ? 'সিরিয়াল ডিসপ্লে' : 'Back'}
            </button>
          </div>
        </div>

        {/* Prescription Paper Display */}
        <div 
          className="dr-preview-body" 
          style={{ 
            background: '#f8fafc', 
            padding: '24px 16px 60px', 
            display: 'flex', 
            justifyContent: 'center',
            overflow: 'visible',
            height: 'auto',
            maxHeight: 'none'
          }}
        >
          <PrescriptionPaper ref={paperRef} prescription={prescription} template={selectedTemplate} hideAll={hideAll} />
        </div>
      </div>
    </div>
  )
}

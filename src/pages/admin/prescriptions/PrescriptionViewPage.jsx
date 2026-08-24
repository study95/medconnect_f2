import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getPrescription } from '../../../api/adminApi'
import { getErrorMessage } from '../../../utils/errorHelper'
// html2canvas and jsPDF are dynamically imported inside handleOpenPDF()
// to keep this admin page's chunk small
import PrescriptionPaper from '../../../components/common/PrescriptionPaper'
import '../../../styles/prescription.css'

export default function PrescriptionViewPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const returnTo = searchParams.get('return_to') || '/admin/prescriptions'
  const [prescription, setPrescription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hideAll, setHideAll] = useState(false)
  const paperRef = useRef(null)

  useEffect(() => { 
    loadPrescription() 
  }, [id])

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
      newTab.document.write('<h2 style="margin-top:20px; color:#1e293b;">Generating PDF...</h2>');
      newTab.document.write('<p>Please wait while we prepare your professional prescription.</p>');
      newTab.document.write('<style>@keyframes spin { to { transform: rotate(360deg); } }</style>');
      newTab.document.write('</div>');
    }

    try {
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
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        onclone: (clonedDoc) => {
          const clonedPaper = clonedDoc.querySelector('.rx-paper');
          if (clonedPaper) {
             // Force exact A4 physical dimensions in the clone
             clonedPaper.style.width = '210mm';
             clonedPaper.style.height = '297mm';
             clonedPaper.style.margin = '0';
             clonedPaper.style.boxShadow = 'none';
             clonedPaper.style.border = 'none';
          }
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
    <div className="rx-container">
      {/* Admin Action Bar — hidden in print */}
      <div className="rx-action-bar no-print">
        <div>
          <h2>Prescription Details</h2>
          <p>Viewing record for {rx.patient_name}</p>
        </div>
        <div className="rx-actions">
          <label className="rx-toggle-label" style={{ fontWeight: 400 }}>
            <input type="checkbox" checked={hideAll} onChange={e => setHideAll(e.target.checked)} />
            Hide Header / Footer
          </label>
          <Link to={`/admin/prescriptions/edit/${id}?return_to=${encodeURIComponent(returnTo)}`} className="admin-btn admin-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            ✏️ Edit
          </Link>
          <button 
            onClick={handleOpenPDF} 
            className="admin-btn admin-btn-primary" 
            style={{ boxShadow: '0 4px 12px rgba(0,168,140,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🖨️ Open PDF
          </button>
          <button 
            type="button" 
            onClick={() => navigate(returnTo)} 
            className="admin-btn admin-btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← {returnTo.includes('serial-display') ? 'সিরিয়াল ডিসপ্লে-তে ফিরে যান (Back)' : 'Back'}
          </button>
        </div>
      </div>

      {/* === A4 PAPER === */}
      <PrescriptionPaper ref={paperRef} prescription={prescription} hideAll={hideAll} />
    </div>
  )
}

import React from 'react';
import { getMediaUrl } from '../../utils/mediaUtils';
import PrescriptionQRCode from './PrescriptionQRCode';
import PrescriptionBarcode from './PrescriptionBarcode';

/**
 * Shared A4 Digital Prescription Paper component
 * Supports multiple professional digital design templates:
 * - 'modern-digital' (Default): Full QR Code & Barcode digital Rx
 * - 'smart-hospital': Corporate hospital header with verification QR
 * - 'classic-pad': Traditional Bangladeshi hardcopy layout with QR
 * - 'minimal-digital': Minimalist clean layout with e-verification
 */
const PrescriptionPaper = React.forwardRef(({ prescription, hideAll, template = 'digital-qr-barcode' }, ref) => {
  if (!prescription) return null;
  const rx = prescription;
  const activeTemplate = rx.template || template || 'digital-qr-barcode';
  const isPadPrint = activeTemplate === 'pad-print-only-data' || hideAll;

  const regNo = rx.registration_no || rx.patient_registration_no || rx.appointment?.registration_id || `PT-2405-${String(rx.id || '0145').padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/rx/view/${rx.id || regNo}` 
    : `https://medconnect.com/rx/view/${regNo}`;

  // Build patient fields dynamically — only show non-empty
  const patientFields = [
    { label: 'Name', value: rx.patient_name },
    { label: 'Age', value: rx.patient_age || rx.age ? `${rx.patient_age || rx.age} Y` : null },
    { label: 'Sex', value: rx.patient_sex || rx.sex },
    { label: 'Date', value: rx.created_at ? new Date(rx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
    { label: 'Reg. No', value: regNo },
    { label: 'Weight', value: rx.patient_weight || rx.weight ? `${rx.patient_weight || rx.weight} kg` : null },
  ].filter(f => f.value);

  // Helper to calculate duration for follow-up
  const followUpDuration = (() => {
    if (!rx.follow_up_date) return null;
    const end = new Date(rx.follow_up_date);
    const start = rx.created_at ? new Date(rx.created_at) : new Date();
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} দিন` : null;
  })();

  const clinicalSections = [
    { key: 'cc', label: 'C/C' },
    { key: 'oe', label: 'O/E' },
    { key: 'oh', label: 'O/H' },
    { key: 'mh', label: 'M/H' },
    { key: 'investigation', label: 'Investigation' },
  ].filter(s => rx[s.key]);

  return (
    <div 
      className={`rx-paper rx-template-${activeTemplate} ${isPadPrint ? 'rx-pad-print-mode' : ''}`} 
      ref={ref} 
      style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        background: 'white', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* ===== HEADER — DOCTOR & DIGITAL VERIFICATION INFO (OR PAD SPACER) ===== */}
      {isPadPrint ? (
        <div className="rx-pad-header-spacer" style={{ height: '55mm', minHeight: '55mm' }} />
      ) : (
        <div 
          className="rx-header" 
          style={{ 
            minHeight: '55mm', 
            padding: '6mm 12mm 4mm 18mm', 
            boxSizing: 'border-box', 
            borderBottom: '3px solid #00A88C', 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            gap: 16 
          }}
        >
          {/* Left: Doctor Info (Bangla / English) */}
          <div className="rx-header-left rx-font-bn" style={{ flex: 1, textAlign: 'left' }}>
            {rx.doctor_slug_bn && <div className="rx-slug">{rx.doctor_slug_bn}</div>}
            <p className="rx-specialty-bn" style={{ color: '#D32F2F', fontSize: 12, fontWeight: 900, marginBottom: 4, textTransform: 'uppercase' }}>
              {rx.doctor_specialty_bn || rx.doctor_specialty || 'Digital Clinical Medicine'}
            </p>
            <h1 className="rx-doctor-name" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{rx.doctor_name_bn || rx.doctor_name || 'Dr. Arifur Rahman'}</h1>
            {(rx.doctor_degree_bn || rx.doctor_degree) && <p className="rx-primary-degree" style={{ margin: '2px 0', fontSize: 13, color: '#475569' }}>{rx.doctor_degree_bn || rx.doctor_degree || 'MBBS, BCS (Health), FCPS'}</p>}
            <div className="rx-degrees" style={{ fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {rx.doctor_degree1_bn && <span>{rx.doctor_degree1_bn}</span>}
              {rx.doctor_degree2_bn && <span>{rx.doctor_degree2_bn}</span>}
              {!rx.doctor_degree1_bn && <span>BMDC Reg. No: {rx.doctor_bmdc || 'A-84920'}</span>}
            </div>
            {(rx.doctor_workplace_bn || rx.doctor_workplace) && <p className="rx-workplace" style={{ margin: '3px 0 0', fontSize: 12, color: '#00A88C', fontWeight: 600 }}>{rx.doctor_workplace_bn || rx.doctor_workplace}</p>}
          </div>

          {/* Center / Right: Digital Prescription QR & Barcode Header Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid #e2e8f0', paddingLeft: 16, flexShrink: 0, marginLeft: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '2px 8px', borderRadius: 4, background: '#f0fdf4',
                border: '1px solid #bbf7d0', fontSize: 10, fontWeight: 700, color: '#166534'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }}></span>
                Verified Digital Rx
              </div>
              <PrescriptionBarcode value={regNo} width={150} height={32} showText={true} />
            </div>

            <PrescriptionQRCode 
              value={verificationUrl} 
              size={68} 
              label="Scan for Digital Rx" 
              showLabel={true}
            />
          </div>
        </div>
      )}

      {/* ===== PATIENT INFO BAR ===== */}
      <div 
        className="rx-patient-bar" 
        style={{ 
          padding: '3mm 12mm 3mm 18mm', 
          boxSizing: 'border-box',
          backgroundColor: isPadPrint ? 'transparent' : '#F8FAFB',
          borderBottom: isPadPrint ? 'none' : '1.5px solid #D1D9E6',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, flex: 1 }}>
          {patientFields.map((field) => (
            <div className="rx-patient-field" key={field.label}>
              <span className="rx-field-label">{field.label}:</span>
              <span className="rx-field-value">{field.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== BODY — TWO COLUMN ===== */}
      <div className="rx-body" style={{ flex: 1, display: 'flex', flexDirection: 'row', width: '100%', minHeight: 0 }}>
        {/* Left Column: Clinical info, Investigations & Diagnosis */}
        <div 
          className="rx-body-left" 
          style={{ 
            width: '32%', 
            minWidth: '65mm', 
            maxWidth: '65mm', 
            flexShrink: 0, 
            backgroundColor: isPadPrint ? 'transparent' : '#F0F7FF', 
            borderRight: isPadPrint ? 'none' : '1.5px solid #D1D9E6',
            padding: '6mm 4mm 6mm 18mm',
            boxSizing: 'border-box'
          }}
        >
          {clinicalSections.map(section => (
            <div className="rx-clinical-section" key={section.key} style={{ marginBottom: 14 }}>
              <div className="rx-clinical-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {!isPadPrint && <div className="rx-indicator" style={{ width: 3, height: 14, background: '#00A88C', borderRadius: 2, flexShrink: 0 }} />}
                <h6 style={{ fontWeight: 800, margin: 0, fontSize: 12, color: '#1e293b', textTransform: 'uppercase' }}>{section.label}</h6>
              </div>
              <div className="rx-clinical-content" style={{ fontSize: 12, color: '#334155', lineHeight: 1.4, paddingLeft: isPadPrint ? 0 : 9 }}>
                {rx[section.key]}
              </div>
            </div>
          ))}
          {rx.diagnosis && (
            <div className="rx-clinical-section" style={{ marginTop: 'auto', paddingTop: 14, borderTop: isPadPrint ? 'none' : '1px solid #D1D9E6' }}>
              <div className="rx-clinical-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {!isPadPrint && <div className="rx-indicator" style={{ width: 3, height: 14, background: '#EF4444', borderRadius: 2, flexShrink: 0 }} />}
                <h4 style={{ fontWeight: 800, margin: 0, fontSize: 12, color: '#1e293b', textTransform: 'uppercase' }}>Diagnosis</h4>
              </div>
              <div className="rx-clinical-content" style={{ fontWeight: 600, color: '#1E293B', fontSize: 12, paddingLeft: isPadPrint ? 0 : 9 }}>
                {rx.diagnosis}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Rx Symbol, Medicines List, Advice & Signature */}
        <div 
          className="rx-body-right" 
          style={{ 
            width: '68%', 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '6mm 12mm 6mm 8mm', 
            boxSizing: 'border-box' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="rx-symbol" style={{ fontWeight: 800, fontSize: 24, color: isPadPrint ? '#0f172a' : '#00A88C', fontStyle: 'italic' }}>Rx.</div>
            {!isPadPrint && (
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                Total Medicines: {rx.medicines?.length || 0}
              </div>
            )}
          </div>

          {/* Medicine List */}
          <div className="rx-medicine-list" style={{ flex: 1 }}>
            {rx.medicines?.map((med, idx) => (
              <div className="rx-medicine-item" key={idx} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: isPadPrint ? 'none' : '1px dashed #f1f5f9' }}>
                <div className="rx-medicine-name" style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="rx-serial" style={{ fontWeight: 800, color: isPadPrint ? '#0f172a' : '#00A88C' }}>{idx + 1}.</span>
                  <span className="rx-med-title" style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                    {med.medicine_name}
                  </span>
                  {med.type && (
                    <span style={{ fontSize: 10, background: isPadPrint ? 'transparent' : '#f1f5f9', padding: '1px 6px', borderRadius: 4, color: '#64748b' }}>
                      {med.type}
                    </span>
                  )}
                  {med.strength && (
                    <span style={{ fontSize: 11, color: '#64748b' }}>{med.strength}</span>
                  )}
                </div>
                
                {(med.dosage || med.duration || med.instructions || med.meal) && (
                  <div className="rx-medicine-details rx-font-bn" style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4, paddingLeft: 18 }}>
                    <div className="rx-dosage-line" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#1e293b', fontSize: 13 }}>
                      {med.dosage && <span className="rx-dosage">{med.dosage}</span>}
                      {med.dosage && med.duration && (
                        <span style={{ color: '#64748b', margin: '0 8px', fontWeight: 500 }}>-</span>
                      )}
                      {med.duration && <span className="rx-duration">{med.duration}</span>}
                    </div>
                    {(med.instructions || med.meal) && (
                      <div className="rx-instructions" style={{ 
                        fontSize: 12, 
                        color: isPadPrint ? '#334155' : '#2563eb', 
                        background: isPadPrint ? 'transparent' : '#eff6ff', 
                        padding: isPadPrint ? '0' : '2px 10px', 
                        borderRadius: 4, 
                        marginLeft: 10 
                      }}>
                        ( {med.meal ? `${med.meal}` : ''}{med.instructions ? ` - ${med.instructions}` : ''} )
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Advice Section */}
          {rx.advice && (
            <div className="rx-advice-section" style={{ 
              marginTop: 'auto', 
              padding: isPadPrint ? '8px 0' : '8px 12px', 
              background: isPadPrint ? 'transparent' : '#f8fafc', 
              borderRadius: isPadPrint ? 0 : 6, 
              border: 'none',
              borderTop: isPadPrint ? 'none' : '1px solid #e2e8f0'
            }}>
              <div className="rx-advice-title" style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                💡 Advice / পরামর্শ:
              </div>
              <div className="rx-advice-content rx-font-bn" style={{ fontSize: 12, color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                {rx.advice}
              </div>
            </div>
          )}

          {/* Follow-up / Next Visit & Signature Row */}
          <div style={{ marginTop: rx.advice ? 10 : 'auto', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              {rx.follow_up_date && (
                <div style={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>
                  📅 পরবর্তী সাক্ষাত: {new Date(rx.follow_up_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  {followUpDuration && ` (${followUpDuration} পর)`}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              {rx.doctor_signature && (
                <div style={{ marginBottom: -6 }}>
                  <img 
                    src={getMediaUrl(rx.doctor_signature)} 
                    alt="Signature" 
                    style={{ maxWidth: 120, maxHeight: 45, objectFit: 'contain' }} 
                  />
                </div>
              )}
              <div style={{ width: 140, borderTop: '1px solid #cbd5e1', marginTop: 6 }} />
              <div className="rx-signature-label" style={{ fontWeight: 600, fontSize: 11, color: '#475569', marginTop: 2 }}>
                Doctor's Signature
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FOOTER — HOSPITAL/CHAMBER INFO OR PAD SPACER ===== */}
      {isPadPrint ? (
        <div className="rx-pad-footer-spacer" style={{ height: '15mm', minHeight: '15mm' }} />
      ) : (
        <div 
          className="rx-footer" 
          style={{ 
            backgroundColor: isPadPrint ? 'transparent' : '#F8FAFC', 
            display: 'flex', 
            flexDirection: 'row',
            justifyContent: 'space-between', 
            alignItems: 'center', 
            width: '100%',
            padding: '4mm 12mm 15mm 18mm', 
            borderTop: isPadPrint ? 'none' : '2.5px solid #00A88C',
            boxSizing: 'border-box',
            marginTop: 'auto'
          }}
        >
          <div className="rx-footer-left" style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left', flex: 1 }}>
            <h4 className="rx-hospital-name" style={{ color: '#0f172a', margin: 0, fontSize: 14, fontWeight: 800 }}>
              {rx.chamber_name || rx.hospital_name || 'Central Chamber & Hospital'}
            </h4>
            <p className="rx-hospital-address" style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
              {rx.chamber_address || rx.hospital_address || 'Dhanmondi, Dhaka, Bangladesh'}
            </p>
            <div className="rx-footer-contact" style={{ display: 'flex', gap: 12, fontSize: 11, color: '#475569', marginTop: 2 }}>
              {(rx.chamber_phone || rx.hospital_phone) && (
                <span>📞 {rx.chamber_phone || rx.hospital_phone || '+880 1712-345678'}</span>
              )}
              {(rx.chamber_email || rx.hospital_email) && (
                <span>✉️ {rx.chamber_email || rx.hospital_email}</span>
              )}
            </div>
          </div>

          <div className="rx-footer-right" style={{ textAlign: 'right', display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
            <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.3 }}>
              Scan QR code on top to verify <br />
              or view medicine schedule online
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PrescriptionPaper;


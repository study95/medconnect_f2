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

  // Clean patient values
  const patientNameVal = rx.patient_name && !rx.patient_name.startsWith('Reg:')
    ? rx.patient_name
    : (rx.patient?.name || rx.walk_in_name || 'Walk-in Patient');

  const patientAgeVal = rx.patient_age || rx.age
    ? `${String(rx.patient_age || rx.age).replace(/\s*Y(ears)?/i, '')} Y`
    : '—';

  // Accurate Patient ID directly matching Patient Registry table (patient.public_id, e.g. PT-CEXYNG)
  const patientIdVal = rx.patient_public_id 
    || rx.patient?.public_id 
    || rx.appointment?.patient_public_id 
    || rx.appointment?.patient?.public_id 
    || (rx.patient_id && !String(rx.patient_id).startsWith('PT-2405-') ? rx.patient_id : '') 
    || (rx.patient?.patient_id && !String(rx.patient?.patient_id).startsWith('PT-2405-') ? rx.patient?.patient_id : '') 
    || (rx.appointment?.patient?.patient_id && !String(rx.appointment?.patient?.patient_id).startsWith('PT-2405-') ? rx.appointment?.patient?.patient_id : '') 
    || (rx.appointment?.patient_id && !String(rx.appointment?.patient_id).startsWith('PT-2405-') ? rx.appointment?.patient_id : '') 
    || rx.patient?.id 
    || (rx.registration_no && !String(rx.registration_no).startsWith('PT-2405-') ? rx.registration_no : '') 
    || '—';

  const regNo = (patientIdVal && patientIdVal !== '—') 
    ? patientIdVal 
    : (rx.id && rx.id !== 'preview' ? `RX-${rx.id}` : 'RX-LIVE');

  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/rx/view/${rx.id || regNo}` 
    : `https://medconnect.com/rx/view/${regNo}`;

  // Formatted Name: name(patient_id)
  const cleanPatientName = (patientNameVal || '').replace(/\s*\([A-Z0-9-]+\)$/i, '').trim();
  const formattedPatientName = (patientIdVal && patientIdVal !== '—')
    ? `${cleanPatientName} (${patientIdVal})`
    : cleanPatientName;

  // Patient Sex / Gender
  const rawSex = rx.patient_sex || rx.sex || rx.patient?.sex || rx.patient?.gender || rx.appointment?.patient?.gender || rx.appointment?.patient?.sex || '';
  const patientSexVal = rawSex && rawSex !== '—'
    ? (rawSex.toLowerCase() === 'male' || rawSex.toLowerCase() === 'm' 
        ? 'Male' 
        : (rawSex.toLowerCase() === 'female' || rawSex.toLowerCase() === 'f' 
            ? 'Female' 
            : rawSex.charAt(0).toUpperCase() + rawSex.slice(1)))
    : '—';

  // Safe date parser to guarantee format: "Sep 17, 2026"
  const parseSafeDate = (input) => {
    if (!input) return new Date();
    if (input instanceof Date && !isNaN(input.getTime())) return input;
    if (typeof input === 'string') {
      const dmyMatch = input.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1;
        const year = parseInt(dmyMatch[3], 10);
        return new Date(year, month, day);
      }
    }
    const d = new Date(input);
    return !isNaN(d.getTime()) ? d : new Date();
  };

  const dateSource = rx.visited_at || rx.prescription_date || rx.appointment_date || rx.date || rx.created_at || new Date();
  const dateVal = parseSafeDate(dateSource).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Fields in row: Name: name(patient_id), Age, Sex, Date (e.g. Sep 17, 2026)
  const patientFields = [
    { label: 'Name', value: formattedPatientName },
    { label: 'Age', value: patientAgeVal },
    { label: 'Sex', value: patientSexVal },
    { label: 'Date', value: dateVal },
  ];

  // Helper to calculate duration for follow-up
  const followUpDuration = (() => {
    if (!rx.follow_up_date) return null;
    const end = new Date(rx.follow_up_date);
    const start = rx.created_at ? new Date(rx.created_at) : new Date();
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} দিন` : null;
  })();

  const validMedicines = (rx.medicines || []).filter(m => (m.medicine_name || '').trim().length > 0);

  const clinicalSections = [
    { key: 'cc', label: 'C/C' },
    { key: 'oe', label: 'O/E' },
    { key: 'oh', label: 'O/H' },
    { key: 'mh', label: 'M/H' },
    { key: 'investigation', label: 'Investigation' },
  ].filter(s => rx[s.key]);

  const toBengaliNumber = (str) => {
    if (!str) return '';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(str).replace(/[0-9]/g, d => bnDigits[parseInt(d, 10)]);
  };

  const docObj = rx.doctor || rx.appointment?.doctor || {};

  // 1. Slug (সবচেয়ে উপরে)
  const docSlugBn = rx.doctor_slug_bn || docObj.slug_bn || rx.doctor_specialty_bn || docObj.specialty_bn || docObj.specialty?.name_bn || docObj.specialty?.bangla_name || '';
  const docSlugEn = rx.doctor_slug || docObj.slug || rx.doctor_specialty || docObj.specialty?.name || docObj.specialty || '';

  // 2. Doctor Name
  const rawNameBn = rx.doctor_name_bn || docObj.name_bn;
  const rawNameEn = rx.doctor_name || docObj.name;
  const docNameBn = rawNameBn 
    ? (rawNameBn.startsWith('ডাঃ') ? rawNameBn : `ডাঃ ${rawNameBn}`) 
    : (rawNameEn ? (rawNameEn.startsWith('Dr.') ? rawNameEn.replace(/^Dr\.?\s*/i, 'ডাঃ ') : `ডাঃ ${rawNameEn}`) : '');
  const docNameEn = rawNameEn 
    ? (rawNameEn.startsWith('Dr.') ? rawNameEn : `Dr. ${rawNameEn}`) 
    : (rawNameBn ? rawNameBn.replace(/^ডাঃ\s*/, 'Dr. ') : '');

  // 3. Degree (মূল ডিগ্রি ও অতিরিক্ত ডিগ্রিসমূহ)
  const docDegreeBn = rx.doctor_degree_bn || docObj.degree_bn || rx.doctor_degree || docObj.degree || '';
  const docDegreeEn = rx.doctor_degree || docObj.degree || rx.doctor_degree_bn || docObj.degree_bn || '';

  const docDegree1Bn = rx.doctor_degree1_bn || docObj.degree1_bn;
  const docDegree1En = rx.doctor_degree1 || docObj.degree1;
  const docDegree2Bn = rx.doctor_degree2_bn || docObj.degree2_bn;
  const docDegree2En = rx.doctor_degree2 || docObj.degree2;
  const docDegree3Bn = rx.doctor_degree3_bn || docObj.degree3_bn;
  const docDegree3En = rx.doctor_degree3 || docObj.degree3;
  const docDegree4Bn = rx.doctor_degree4_bn || docObj.degree4_bn;
  const docDegree4En = rx.doctor_degree4 || docObj.degree4;

  // 4. Workplace (কর্মস্থল / হাসপাতাল)
  const docWorkplaceBn = rx.doctor_workplace_bn || docObj.workplace_bn || rx.doctor_workplace || docObj.workplace || '';
  const docWorkplaceEn = rx.doctor_workplace || docObj.workplace || rx.doctor_workplace_bn || docObj.workplace_bn || '';

  // 5. BMDC Number (বিএমডিসি নম্বর)
  const docBmdc = rx.doctor_bmdc || docObj.bmdc || '';

  // 5.1 Doctor Signature (ডাক্তারের স্বাক্ষর)
  const docSignature = rx.doctor_signature 
    || rx.signature_photo 
    || rx.signature 
    || docObj.signature_photo 
    || docObj.signature 
    || docObj.signature_photo_url 
    || null;

  // 6. Chamber / Hospital Footer Information (Patient's appointed chamber takes absolute priority)
  const apptChamberHosp = rx.appointment?.chamber?.hospital || rx.appointment?.hospital || {};
  const hospObj = Object.keys(apptChamberHosp).length > 0 ? apptChamberHosp : (rx.hospital || rx.doctor?.hospital || {});

  const hospLogo = rx.chamber_logo 
    || rx.hospital_logo 
    || apptChamberHosp.hospital_logo 
    || apptChamberHosp.photo_url 
    || apptChamberHosp.photo 
    || hospObj.hospital_logo 
    || hospObj.photo_url 
    || hospObj.photo 
    || null;

  const hospName = apptChamberHosp.name_bn 
    || apptChamberHosp.name 
    || rx.chamber_name_bn 
    || rx.chamber_name 
    || rx.hospital_name_bn 
    || rx.hospital_name 
    || hospObj.name_bn 
    || hospObj.name 
    || 'সেন্ট্রাল হাসপাতাল ও চেম্বার';

  const hospAddress = apptChamberHosp.address_bn 
    || apptChamberHosp.address 
    || rx.chamber_address_bn 
    || rx.chamber_address 
    || rx.hospital_address_bn 
    || rx.hospital_address 
    || hospObj.address_bn 
    || hospObj.address 
    || '';

  const hospHotline = apptChamberHosp.hotline 
    || apptChamberHosp.phone 
    || rx.chamber_hotline 
    || rx.chamber_phone 
    || rx.hospital_hotline 
    || rx.hospital_phone 
    || hospObj.hotline 
    || hospObj.phone 
    || '';

  const hospWebsite = apptChamberHosp.url 
    || apptChamberHosp.website 
    || rx.chamber_website 
    || rx.hospital_website 
    || hospObj.url 
    || hospObj.website 
    || (hospObj.slug ? `www.${hospObj.slug}.com` : '');

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
      ) : activeTemplate === 'classic-pad' ? (
        /* Bilingual Classic Pad Header: Left (বাংলা), Center (QR), Right (English) */
        <div 
          className="rx-header rx-header-classic-bilingual" 
          style={{ 
            minHeight: '55mm', 
            padding: '6mm 12mm 4mm 18mm', 
            boxSizing: 'border-box', 
            borderBottom: '3px solid #00A88C', 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            gap: 14 
          }}
        >
          {/* Left Side: Doctor Information in Bengali (সম্পূর্ণ বাংলায়) */}
          <div className="rx-header-left rx-font-bn" style={{ flex: 1.2, textAlign: 'left', minWidth: 0 }}>
            {/* 1. সবচেয়ে উপরে Slug */}
            {docSlugBn && (
              <p className="rx-slug-bn" style={{ color: '#D32F2F', fontSize: 12, fontWeight: 800, margin: '0 0 3px', textTransform: 'uppercase' }}>
                {docSlugBn}
              </p>
            )}

            {/* 2. Doctor Name */}
            {docNameBn && (
              <h1 className="rx-doctor-name" style={{ margin: '0 0 3px', fontSize: 21, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {docNameBn}
              </h1>
            )}

            {/* 3. Degree (মূল ডিগ্রি ও অতিরিক্ত ডিগ্রিসমূহ) */}
            {docDegreeBn && (
              <p className="rx-primary-degree" style={{ margin: '2px 0', fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                {docDegreeBn}
              </p>
            )}
            {(docDegree1Bn || docDegree2Bn || docDegree3Bn || docDegree4Bn) && (
              <div className="rx-degrees" style={{ fontSize: 11.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 1, margin: '1px 0 2px' }}>
                {docDegree1Bn && <span>{docDegree1Bn}</span>}
                {docDegree2Bn && <span>{docDegree2Bn}</span>}
                {docDegree3Bn && <span>{docDegree3Bn}</span>}
                {docDegree4Bn && <span>{docDegree4Bn}</span>}
              </div>
            )}

            {/* 4. Workplace (কর্মস্থল / হাসপাতাল) */}
            {docWorkplaceBn && (
              <p className="rx-workplace" style={{ margin: '3px 0 2px', fontSize: 11.5, color: '#00A88C', fontWeight: 600 }}>
                {docWorkplaceBn}
              </p>
            )}

            {/* 5. BMDC Number (বিএমডিসি নম্বর) */}
            {docBmdc && (
              <p className="rx-bmdc" style={{ margin: '2px 0 0', fontSize: 11.5, color: '#1d4ed8', fontWeight: 700 }}>
                বিএমডিসি রেজিঃ নং: {toBengaliNumber(docBmdc)}
              </p>
            )}
          </div>

          {/* Center (Compact): QR Code & Verification Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 10px', borderLeft: '1px dashed #cbd5e1', borderRight: '1px dashed #cbd5e1', flexShrink: 0 }}>
            <PrescriptionQRCode 
              value={verificationUrl} 
              size={54} 
              label="ডিজিটাল ভেরিফিকেশন" 
              showLabel={true}
            />
            <span style={{ fontSize: 9, color: '#64748b', marginTop: 2, fontWeight: 600 }}>{regNo}</span>
          </div>

          {/* Right Side: Doctor Information in English */}
          <div className="rx-header-right" style={{ flex: 1.2, textAlign: 'right', minWidth: 0 }}>
            {/* 1. Topmost Slug */}
            {docSlugEn && (
              <p style={{ color: '#D32F2F', fontSize: 11.5, fontWeight: 800, margin: '0 0 3px', textTransform: 'uppercase' }}>
                {docSlugEn}
              </p>
            )}

            {/* 2. Doctor Name */}
            {docNameEn && (
              <h1 style={{ margin: '0 0 3px', fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {docNameEn}
              </h1>
            )}

            {/* 3. Degree (Primary & Additional Qualifications) */}
            {docDegreeEn && (
              <p style={{ margin: '2px 0', fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                {docDegreeEn}
              </p>
            )}
            {(docDegree1En || docDegree2En || docDegree3En || docDegree4En) && (
              <div style={{ fontSize: 11.5, color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, margin: '1px 0 2px' }}>
                {docDegree1En && <span>{docDegree1En}</span>}
                {docDegree2En && <span>{docDegree2En}</span>}
                {docDegree3En && <span>{docDegree3En}</span>}
                {docDegree4En && <span>{docDegree4En}</span>}
              </div>
            )}

            {/* 4. Workplace */}
            {docWorkplaceEn && (
              <p style={{ margin: '3px 0 2px', fontSize: 11.5, color: '#00A88C', fontWeight: 600 }}>
                {docWorkplaceEn}
              </p>
            )}

            {/* 5. BMDC Number */}
            {docBmdc && (
              <p className="rx-bmdc" style={{ margin: '2px 0 0', fontSize: 11.5, color: '#1d4ed8', fontWeight: 700 }}>
                BMDC Reg. No: {docBmdc}
              </p>
            )}
          </div>
        </div>
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
          {/* Left: Doctor Info (Bangla / English) in sequence: Slug -> Name -> Degree -> Workplace -> BMDC */}
          <div className="rx-header-left rx-font-bn" style={{ flex: 1, textAlign: 'left' }}>
            {(docSlugBn || docSlugEn) && (
              <p className="rx-specialty-bn" style={{ color: '#D32F2F', fontSize: 12, fontWeight: 900, marginBottom: 4, textTransform: 'uppercase' }}>
                {docSlugBn || docSlugEn}
              </p>
            )}
            <h1 className="rx-doctor-name" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
              {docNameBn || docNameEn}
            </h1>
            {(docDegreeBn || docDegreeEn) && (
              <p className="rx-primary-degree" style={{ margin: '2px 0', fontSize: 13, color: '#475569', fontWeight: 600 }}>
                {docDegreeBn || docDegreeEn}
              </p>
            )}
            <div className="rx-degrees" style={{ fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(docDegree1Bn || docDegree1En) && <span>{docDegree1Bn || docDegree1En}</span>}
              {(docDegree2Bn || docDegree2En) && <span>{docDegree2Bn || docDegree2En}</span>}
              {(docDegree3Bn || docDegree3En) && <span>{docDegree3Bn || docDegree3En}</span>}
              {(docDegree4Bn || docDegree4En) && <span>{docDegree4Bn || docDegree4En}</span>}
            </div>
            {(docWorkplaceBn || docWorkplaceEn) && (
              <p className="rx-workplace" style={{ margin: '3px 0 0', fontSize: 12, color: '#00A88C', fontWeight: 600 }}>
                {docWorkplaceBn || docWorkplaceEn}
              </p>
            )}
            {docBmdc && (
              <div className="rx-bmdc" style={{ fontSize: 11.5, color: '#1d4ed8', fontWeight: 700, marginTop: 2 }}>
                BMDC Reg. No: {docBmdc}
              </div>
            )}
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

      {/* ===== PATIENT INFO BAR (Single Row: Name, Age, Patient ID, Visit No, Date) ===== */}
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
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexWrap: 'nowrap', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%', 
          gap: 16 
        }}>
          {patientFields.map((field) => (
            <div 
              className="rx-patient-field" 
              key={field.label}
              style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}
            >
              <span className="rx-field-label" style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>{field.label}:</span>
              <span className="rx-field-value" style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{field.value}</span>
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
                Total Medicines: {validMedicines.length}
              </div>
            )}
          </div>

          {/* Medicine List */}
          <div className="rx-medicine-list" style={{ flex: 1 }}>
            {validMedicines.length === 0 ? (
              <div style={{ padding: '16px 0', color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                No medicines prescribed.
              </div>
            ) : (
              validMedicines.map((med, idx) => (
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
              ))
            )}
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

            <div style={{ textAlign: 'center', minWidth: 140, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ height: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 2 }}>
                {docSignature ? (
                  <img 
                    src={getMediaUrl(docSignature)} 
                    alt="Doctor's Signature" 
                    style={{ maxWidth: 140, maxHeight: 46, objectFit: 'contain' }} 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : null}
              </div>
              <div style={{ width: 140, borderTop: '1.5px solid #94a3b8' }} />
              <div className="rx-signature-label" style={{ fontWeight: 600, fontSize: 11, color: '#475569', marginTop: 3, letterSpacing: 0.3 }}>
                DOCTOR'S SIGNATURE
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
            padding: '3mm 12mm 4mm 18mm', 
            borderTop: isPadPrint ? 'none' : '2px solid #00A88C', 
            boxSizing: 'border-box', 
            marginTop: 'auto',
            gap: 16
          }}
        >
          {/* Left Side: Chamber title, Logo, Hospital Name, Address, Hotline, Website (As per Demo) */}
          <div className="rx-footer-left rx-font-bn" style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 14.5, fontWeight: 900, color: '#0f172a', letterSpacing: 0.4, marginBottom: 3 }}>
              চেম্বার :
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Logo (Circle with border) */}
              <div style={{ flexShrink: 0 }}>
                {hospLogo ? (
                  <img 
                    src={getMediaUrl(hospLogo)} 
                    alt="Logo" 
                    style={{ 
                      width: 54, 
                      height: 54, 
                      borderRadius: '50%', 
                      objectFit: 'contain', 
                      border: '1.5px solid #cbd5e1', 
                      background: '#ffffff',
                      padding: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)' 
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="rx-logo-fallback" 
                  style={{ 
                    display: hospLogo ? 'none' : 'flex', 
                    width: 54, 
                    height: 54, 
                    borderRadius: '50%', 
                    background: '#ffffff', 
                    border: '1.5px solid #b91c1c', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    padding: 2,
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: 11.5, fontWeight: 900, color: '#b91c1c', lineHeight: 1, letterSpacing: 0.5 }}>
                    {(hospName || 'CHAMBER').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 4).join('').toUpperCase()}
                  </span>
                  <span style={{ fontSize: 7.5, color: '#00A88C', fontWeight: 800, lineHeight: 1 }}>CHAMBER</span>
                </div>
              </div>

              {/* Chamber Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <h4 
                  className="rx-hospital-name" 
                  style={{ 
                    color: '#b91c1c', 
                    margin: 0, 
                    fontSize: 18.5, 
                    fontWeight: 900, 
                    letterSpacing: 0.2,
                    lineHeight: 1.25 
                  }}
                >
                  {hospName}
                </h4>
                {hospAddress && (
                  <p 
                    className="rx-hospital-address" 
                    style={{ margin: 0, fontSize: 12.5, color: '#334155', lineHeight: 1.35, fontWeight: 500 }}
                  >
                    {hospAddress}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, fontSize: 12, color: '#0f172a', marginTop: 1 }}>
                  {hospHotline && (
                    <span style={{ fontWeight: 600 }}>
                      সিরিয়ালের জন্য: <strong style={{ color: '#0f172a', fontWeight: 700 }}>{toBengaliNumber(hospHotline)}</strong>
                    </span>
                  )}
                  {hospWebsite && (
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>
                      ওয়েবসাইট: <strong style={{ color: '#2563eb', fontWeight: 700 }}>{hospWebsite.replace(/^https?:\/\//, '')}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Doctor Booklet Advertisement (ছোট ও সুন্দর বিজ্ঞাপন) */}
          <div 
            className="rx-footer-right" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 9, 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: 8, 
              padding: '7px 14px', 
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              flexShrink: 0
            }}
          >
            <img 
              src="/favicon.png" 
              alt="Doctor Booklet" 
              style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.25 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#00A88C', letterSpacing: 0.2 }}>
                Doctor Booklet
              </span>
              <span style={{ fontSize: 10.5, color: '#2563eb', fontWeight: 600 }}>
                www.doctorbooklet.com
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PrescriptionPaper;


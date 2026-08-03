import React from 'react';
import { getMediaUrl } from '../../utils/mediaUtils';

/**
 * Shared A4 Prescription Paper component
 * Matches real Bangladeshi doctor hardcopy layout
 */
const PrescriptionPaper = React.forwardRef(({ prescription, hideAll }, ref) => {
  if (!prescription) return null;
  const rx = prescription;

  // Build patient fields dynamically — only show non-empty
  const patientFields = [
    { label: 'Name', value: rx.patient_name },
    { label: 'Age', value: rx.age },
    { label: 'Sex', value: rx.sex },
    { label: 'Date', value: rx.created_at ? new Date(rx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null },
    { label: 'Reg. No', value: rx.registration_no || rx.patient_registration_no || rx.appointment?.registration_id },
    { label: 'Visit No', value: rx.visit_no },
    { label: 'Weight', value: rx.weight },
  ].filter(f => f.value);

  // Helper to calculate duration for follow-up
  const followUpDuration = (() => {
    if (!rx.follow_up_date || !rx.created_at) return null;
    const end = new Date(rx.follow_up_date);
    const start = new Date(rx.created_at);
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
    <div className="rx-paper" ref={ref} style={{ width: '210mm', minHeight: '297mm', background: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* ===== HEADER — DOCTOR INFO ===== */}
      <div className={`rx-header ${hideAll ? 'rx-header-hidden' : ''}`}>
        <div className="rx-header-left rx-font-bn">
          {rx.doctor_slug_bn && <div className="rx-slug">{rx.doctor_slug_bn}</div>}
          <p className="rx-specialty-bn" style={{ color: '#D32F2F', fontSize: 12, fontWeight: 900, marginBottom: 4, textTransform: 'uppercase' }}>
            {rx.doctor_specialty_bn || 'ঊধৃতি চিকিৎসা'}
          </p>
          <h1 className="rx-doctor-name">{rx.doctor_name_bn || rx.doctor_name || 'ডাঃ নাম'}</h1>
          {(rx.doctor_degree_bn || rx.doctor_degree) && <p className="rx-primary-degree">{rx.doctor_degree_bn || rx.doctor_degree}</p>}
          <div className="rx-degrees">
            {rx.doctor_degree1_bn && <span>{rx.doctor_degree1_bn}</span>}
            {rx.doctor_degree2_bn && <span>{rx.doctor_degree2_bn}</span>}
            {rx.doctor_degree3_bn && <span>{rx.doctor_degree3_bn}</span>}
            {rx.doctor_degree4_bn && <span>{rx.doctor_degree4_bn}</span>}
            {rx.doctor_workplace_bn && <span>{rx.doctor_workplace_bn}</span>}
            {!rx.doctor_degree1_bn && rx.doctor_degree1 && <span>{rx.doctor_degree1}</span>}
            {!rx.doctor_degree2_bn && rx.doctor_degree2 && <span>{rx.doctor_degree2}</span>}
            {!rx.doctor_degree3_bn && rx.doctor_degree3 && <span>{rx.doctor_degree3}</span>}
            {!rx.doctor_degree4_bn && rx.doctor_degree4 && <span>{rx.doctor_degree4}</span>}
          </div>
          {(rx.doctor_workplace_bn || rx.doctor_workplace) && <p className="rx-workplace">{rx.doctor_workplace_bn || rx.doctor_workplace}</p>}
          {rx.doctor_bmdc && <div className="rx-bmdc" style={{ color: '#1A1D2E', fontWeight: 800 }}>বিএমডিসি রেজিঃ নং: {rx.doctor_bmdc}</div>}
        </div>
        <div className="rx-header-divider" />
        <div className="rx-header-right">
          {rx.doctor_slug && <div className="rx-slug">{rx.doctor_slug}</div>}
          <h1 className="rx-doctor-name">{rx.doctor_name || 'Dr. Name'}</h1>
          {rx.doctor_degree && <p className="rx-primary-degree">{rx.doctor_degree}</p>}
          <div className="rx-degrees">
            {rx.doctor_degree1 && <span>{rx.doctor_degree1}</span>}
            {rx.doctor_degree2 && <span>{rx.doctor_degree2}</span>}
            {rx.doctor_degree3 && <span>{rx.doctor_degree3}</span>}
            {rx.doctor_degree4 && <span>{rx.doctor_degree4}</span>}
          </div>
          {rx.doctor_workplace && <p className="rx-workplace">{rx.doctor_workplace}</p>}
          {rx.doctor_bmdc && <div className="rx-bmdc">BMDC Reg: {rx.doctor_bmdc}</div>}
        </div>
      </div>

      {/* ===== PATIENT INFO BAR ===== */}
      <div className="rx-patient-bar" style={{ justifyContent: 'space-between' }}>
        {patientFields.map((field, idx) => (
          <div className="rx-patient-field" key={field.label}>
            <span className="rx-field-label">{field.label}:</span>
            <span className="rx-field-value">{field.value}</span>
          </div>
        ))}
      </div>

      {/* ===== BODY — TWO COLUMN ===== */}
      <div className="rx-body" style={{ flex: 1, display: 'flex' }}>
        <div className="rx-body-left">
          {clinicalSections.map(section => (
            <div className="rx-clinical-section" key={section.key}>
              <div className="rx-clinical-title">
                <div className="rx-indicator" />
                <h6>{section.label}</h6>
              </div>
              <div className="rx-clinical-content">{rx[section.key]}</div>
            </div>
          ))}
          {rx.diagnosis && (
            <div className="rx-clinical-section" style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--rx-border-light)' }}>
              <div className="rx-clinical-title">
                <div className="rx-indicator" style={{ background: '#EF4444' }} />
                <h4>Diagnosis</h4>
              </div>
              <div className="rx-clinical-content" style={{ fontWeight: 400, color: '#1E293B' }}>{rx.diagnosis}</div>
            </div>
          )}
        </div>

        <div className="rx-body-right">
          <div className="rx-symbol" style={{ fontWeight: 500, marginBottom: 10 }}>Rx.</div>
          <div className="rx-medicine-list">
            {rx.medicines?.map((med, idx) => (
              <div className="rx-medicine-item" key={idx}>
                <div className="rx-medicine-name">
                  <span className="rx-serial">{idx + 1}.</span>
                  <span className="rx-med-title">{med.medicine_name}</span>
                </div>
                {(med.dosage || med.duration || med.instructions) && (
                  <div className="rx-medicine-details rx-font-bn" style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 2 }}>
                    <div className="rx-dosage-line">
                      {med.dosage && <span className="rx-dosage">{med.dosage}</span>}
                      {med.duration && <span className="rx-duration">{med.duration}</span>}
                    </div>
                    {med.instructions && <div className="rx-instructions">{med.instructions}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
          {rx.advice && (
            <div className="rx-advice-section">
              <h4 className="rx-advice-title">Advice / পরামর্শ</h4>
              <div className="rx-advice-content">{rx.advice}</div>
            </div>
          )}
          {rx.follow_up_date && (
            <div className="rx-follow-up rx-font-bn">
              📅 Follow up: <strong>{new Date(rx.follow_up_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              {followUpDuration && <span style={{ marginLeft: 8 }}>( {followUpDuration} পর দেখা করবেন )</span>}
            </div>
          )}
          <div style={{ marginTop: 'auto', paddingTop: 5, width: '100%', textAlign: 'right', paddingLeft: 350 }}>
            <div className="rx-signature" style={{ marginBottom: 4, display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
              {rx.doctor_signature && (
                <div style={{ marginBottom: -10 }}>
                  <img 
                    src={getMediaUrl(rx.doctor_signature)} 
                    alt="Signature" 
                    style={{ maxWidth: 120, maxHeight: 50, objectFit: 'contain' }} 
                  />
                </div>
              )}
              <div className="rx-signature-label" style={{ fontWeight: 400, fontSize: 13, textTransform: 'none', textAlign: 'center' }}>Signature</div>
            </div>
            {rx.next_visit && (
              <div className="rx-next_visit" style={{ borderTop: 'none', textAlign: 'right', marginTop: 10 }}>
                ............সপ্তাহ/মাস পর দেখা করবেন। <strong>{rx.next_visit}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== FOOTER — HOSPITAL/CHAMBER INFO ===== */}
      <div className={`rx-footer ${hideAll ? 'rx-footer-hidden' : ''}`} style={{ backgroundColor: '#FFF5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 36px', borderTop: '2px solid var(--rx-primary)' }}>
        <div className="rx-footer-left" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(rx.chamber_name || rx.hospital_name) && (
            <>
              {/* Row 1: Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, textAlign: 'center', color: 'var(--rx-primary)', fontSize: 16, flexShrink: 0 }}>📍</div>
                <h4 className="rx-hospital-name" style={{ color: '#ce2525ff', margin: 0, fontSize: 24, fontWeight: 900 }}>
                  {rx.chamber_name || rx.hospital_name}
                </h4>
              </div>

              {/* Row 2: Address */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 24, flexShrink: 0 }} /> {/* Empty alignment spacer */}
                <p className="rx-hospital-address" style={{ margin: 0, fontSize: 14, color: '#030303ff', lineHeight: 1.4 }}>
                  {rx.chamber_address}
                </p>
              </div>

              {/* Row 3: Contacts */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <div style={{ width: 24, flexShrink: 0 }} /> {/* Empty alignment spacer */}
                <div className="rx-footer-contact" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: 12, color: '#2e2525ff', fontWeight: 400 }}>
                  {rx.chamber_phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13 }}>মোবাইলঃ</span> {rx.chamber_phone}
                    </span>
                  )}
                  {rx.chamber_email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13 }}>ইমেলঃ</span> {rx.chamber_email}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rx-footer-right" style={{ textAlign: 'right', lineHeight: 1.4 }}>
          <div className="rx-file-info" style={{ fontSize: 10, color: '#000', fontWeight: 300 }}>
            ডাক্তার খুজুঁন আর অ্যাপয়েন্টমেন্ট নিন খুব সহজে <br />
            <span style={{ color: '#00A88C', fontStyle: 'normal', fontWeight: 900, fontSize: 13, display: 'block', marginTop: 2 }}>bdDoctors.com.bd</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrescriptionPaper;

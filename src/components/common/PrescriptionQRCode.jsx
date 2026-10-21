import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

/**
 * ISO/IEC 18004 Compliant SVG QR Code Generator for Digital Prescriptions
 *
 * Uses `qrcode.react` (Reed-Solomon error correction level M) to render a
 * genuinely scannable, high-contrast vector QR code suitable for smartphone
 * cameras, pharmacy barcode/QR scanners, A4 paper print, and PDF export.
 */
export default function PrescriptionQRCode({
  value = 'https://medconnect.com/rx/view',
  size = 76,
  label = 'Scan for Digital Rx',
  showLabel = true,
}) {
  const safeValue = String(value || 'https://medconnect.com/rx/view').trim()

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3, userSelect: 'none' }}>
      <div style={{ background: '#ffffff', padding: 4, borderRadius: 6, border: '1px solid #e2e8f0', display: 'inline-block' }}>
        <QRCodeSVG
          value={safeValue}
          size={size}
          level="M"
          bgColor="#ffffff"
          fgColor="#0f172a"
          marginSize={0}
          style={{ display: 'block' }}
        />
      </div>
      {showLabel && (
        <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: '0.2px', textAlign: 'center' }}>
          {label}
        </span>
      )}
    </div>
  )
}

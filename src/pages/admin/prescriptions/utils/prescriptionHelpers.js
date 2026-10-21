// prescriptionHelpers.js — Pure clinical calculation, phone validation, vitals parsing & isolated A4 print utilities

export const toBanglaDigits = (str) => {
  if (!str) return ''
  const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
  return String(str).replace(/[0-9]/g, d => enToBn[d] || d)
}

export const toEnglishDigits = (str) => {
  if (!str) return ''
  const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' }
  return String(str).replace(/[০-৯]/g, d => bnToEn[d] || d)
}

export const matchOptionValue = (options, val) => {
  if (!val) return ''
  if (options.includes(val)) return val
  const normalized = String(val).trim().toLowerCase()
  const matched = options.find(opt => opt.toLowerCase() === normalized)
  return matched || val
}

export const emptyMedicine = () => ({
  _id: Math.random().toString(36).substring(2, 9),
  medicine_name: '',
  generic_name: '',
  type: '',
  strength: '',
  dose: '',
  dosage: '',
  duration: '',
  meal: '',
  instructions: ''
})

export const calculateAgeFromDob = (dobStr) => {
  if (!dobStr) return null
  try {
    const dob = new Date(dobStr)
    if (isNaN(dob.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age >= 0 ? String(age) : '0'
  } catch (e) {
    return null
  }
}

export const calculateDobFromAge = (ageYears, existingDobStr = null) => {
  const age = parseInt(ageYears, 10)
  if (isNaN(age) || age < 0) return ''
  const today = new Date()
  const targetYear = today.getFullYear() - age
  if (existingDobStr) {
    try {
      const d = new Date(existingDobStr)
      if (!isNaN(d.getTime())) {
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${targetYear}-${month}-${day}`
      }
    } catch (e) {}
  }
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${targetYear}-${month}-${day}`
}

export const isValidBdMobile = (phone) => {
  if (!phone) return false
  const clean = String(phone).replace(/[\s\-\(\)]/g, '')
  return /^(?:\+?8801|8801|01)[3-9]\d{8}$/.test(clean)
}

export const normalizeBdMobile = (phone) => {
  if (!phone) return ''
  let clean = String(phone).replace(/[\s\-\(\)]/g, '')
  if (clean.startsWith('+88')) clean = clean.slice(3)
  else if (clean.startsWith('88')) clean = clean.slice(2)
  return clean
}

export const parseVitalsFromOe = (oe, fallbackWeight = '') => {
  const result = {
    bp_systolic: '',
    bp_diastolic: '',
    pulse: '',
    temp: '',
    weight: fallbackWeight || '',
    height_ft: '',
    recorded_at: ''
  }
  if (!oe || typeof oe !== 'string') return result

  const bpMatch = oe.match(/BP:\s*(\d+)(?:\/(\d+))?/i)
  if (bpMatch) {
    result.bp_systolic = bpMatch[1] || ''
    result.bp_diastolic = bpMatch[2] || ''
  }

  const pulseMatch = oe.match(/Pulse:\s*(\d+)/i)
  if (pulseMatch) {
    result.pulse = pulseMatch[1] || ''
  }

  const tempMatch = oe.match(/Temp:\s*([0-9.]+)/i)
  if (tempMatch) {
    result.temp = tempMatch[1] || ''
  }

  const wtMatch = oe.match(/(?:Wt|Weight):\s*([0-9.]+)/i)
  if (wtMatch && !result.weight) {
    result.weight = wtMatch[1] || ''
  }

  const htMatch = oe.match(/(?:Ht|Height):\s*([0-9.]+)/i)
  if (htMatch) {
    result.height_ft = htMatch[1] || ''
  }

  return result
}

export const printPrescriptionElement = (paperElement) => {
  if (!paperElement) {
    window.print()
    return
  }

  try {
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
              width: 210mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              background: #ffffff !important;
              font-family: 'Inter', 'Segoe UI', sans-serif;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .rx-font-bn {
              font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif !important;
            }
            .rx-paper {
              margin: 0 auto !important;
              width: 210mm !important;
              max-width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              box-shadow: none !important;
              border: none !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              background: #ffffff !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              break-inside: avoid !important;
              overflow: hidden !important;
            }
            .rx-header,
            .rx-header-classic-bilingual {
              min-height: 55mm !important;
              padding: 6mm 12mm 4mm 18mm !important;
              box-sizing: border-box !important;
              border-bottom: 3px solid #00A88C !important;
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: flex-start !important;
              width: 100% !important;
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
            .rx-patient-bar {
              padding: 3mm 12mm 3mm 18mm !important;
              box-sizing: border-box !important;
              background: #F8FAFB !important;
              border-bottom: 1.5px solid #D1D9E6 !important;
              display: flex !important;
              flex-wrap: wrap !important;
            }
            .rx-body {
              flex: 1 !important;
              display: flex !important;
              flex-direction: row !important;
              width: 100% !important;
              min-height: 0 !important;
              box-sizing: border-box !important;
            }
            .rx-body-left {
              width: 32% !important;
              min-width: 65mm !important;
              max-width: 65mm !important;
              flex-shrink: 0 !important;
              background-color: #F0F7FF !important;
              border-right: 1.5px solid #D1D9E6 !important;
              padding: 6mm 4mm 6mm 18mm !important;
              box-sizing: border-box !important;
            }
            .rx-body-right {
              width: 68% !important;
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
              padding: 6mm 12mm 6mm 8mm !important;
              box-sizing: border-box !important;
            }
            .rx-indicator {
              width: 3px !important;
              height: 14px !important;
              background: #00A88C !important;
              border-radius: 2px !important;
              display: inline-block !important;
            }
            .rx-instructions {
              background: #eff6ff !important;
              color: #2563eb !important;
              padding: 2px 8px !important;
              border-radius: 4px !important;
            }
            .rx-advice-section {
              background: #f8fafc !important;
              border: 1px solid #e2e8f0 !important;
              border-radius: 6px !important;
              padding: 8px 12px !important;
            }
            .rx-footer {
              padding: 4mm 12mm 15mm 18mm !important;
              border-top: 2.5px solid #00A88C !important;
              background: #F8FAFC !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              box-sizing: border-box !important;
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
        setTimeout(() => {
          try {
            document.body.removeChild(printIframe)
          } catch (e) {}
        }, 1500)
      } catch (e) {
        window.print()
      }
    }

    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(() => {
        setTimeout(runPrint, 250)
      }).catch(() => {
        setTimeout(runPrint, 400)
      })
    } else {
      setTimeout(runPrint, 500)
    }
  } catch (err) {
    console.error('Isolated print error, falling back to window.print():', err)
    window.print()
  }
}

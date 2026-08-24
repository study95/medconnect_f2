const fs = require('fs');
const content = fs.readFileSync('src/pages/HospitalDetailPage.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('আমাদের ডিপার্টমেন্ট সমূহ') || l.includes('ডিপার্টমেন্ট সমূহ') || l.includes('departments') || l.includes('department')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});

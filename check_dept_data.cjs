const fs = require('fs');
const content = fs.readFileSync('src/pages/HospitalDetailPage.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('specialt') || l.includes('department') || l.includes('departments')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});

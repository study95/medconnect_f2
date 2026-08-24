const fs = require('fs');
const content = fs.readFileSync('src/pages/HospitalDetailPage.jsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(0, 50).map((l, i) => (1 + i) + ': ' + l).join('\n'));

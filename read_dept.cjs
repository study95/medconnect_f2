const fs = require('fs');
const content = fs.readFileSync('src/pages/HospitalDetailPage.jsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(645, 730).map((l, i) => (646 + i) + ': ' + l).join('\n'));

const fs = require('fs');
const content = fs.readFileSync('src/pages/HospitalDetailPage.jsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(960, 1050).map((l, i) => (961 + i) + ': ' + l).join('\n'));

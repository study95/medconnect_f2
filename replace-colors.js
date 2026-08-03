import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changed = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  
  // Replace rgb shadow values
  content = content.replace(/rgba\(10, 110, 189/g, 'rgba(0, 168, 140');
  content = content.replace(/rgba\(10,110,189/g, 'rgba(0,168,140');
  
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    changed++;
  }
});
console.log(`Updated ${changed} files to green shadow.`);

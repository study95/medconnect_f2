const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const importStatement = `import { getMediaUrl } from '../../utils/mediaUtils'`;
const importStatementDepth1 = `import { getMediaUrl } from '../utils/mediaUtils'`;
const importStatementDepth3 = `import { getMediaUrl } from '../../../utils/mediaUtils'`;

const filesToUpdate = [];

walkDir(srcDir, function(filePath) {
    if (filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Matches src={variable} or src={variable || fallback}
        // Need to be careful. Let's just find specific variables:
        const variablesToReplace = [
            'doctor.photo',
            'doctor.signature_photo',
            'hospital.photo_url',
            'hospital.photo',
            'hospital.logo',
            'p.profile_pic',
            'item.photo_url',
            'item.photo',
            'user.photo',
            'myProfile.photo',
            'h.photo_url'
        ];

        variablesToReplace.forEach(v => {
            // Regex to find src={v} or src={v || ...}
            // Be careful not to replace already wrapped ones like getMediaUrl(v)
            const regex = new RegExp(`src=\\{(${v.replace(/\./g, '\\.')})(.*?)\\}`, 'g');
            if (regex.test(content)) {
                content = content.replace(regex, (match, p1, p2) => {
                    // if it's already wrapped, skip
                    if (match.includes('getMediaUrl')) return match;
                    return `src={getMediaUrl(${p1})${p2}}`;
                });
                modified = true;
            }
        });
        
        // Handle DEMO_AVATAR as fallback inside getMediaUrl
        // e.g., src={getMediaUrl(doctor.photo) || DEMO_AVATAR} 
        // This is fine because getMediaUrl returns empty string if path is null, so || DEMO_AVATAR still works.
        // Wait, getMediaUrl(doctor.photo, DEMO_AVATAR) is better, but the regex above produces `src={getMediaUrl(doctor.photo) || DEMO_AVATAR}` which is equivalent if getMediaUrl returns '' for null.
        // Wait, my getMediaUrl returns '' for null. 
        // Let's modify the regex replacement:
        // if `src={doctor.photo || DEMO_AVATAR}`, it becomes `src={getMediaUrl(doctor.photo) || DEMO_AVATAR}`

        if (modified && !content.includes('getMediaUrl')) {
            // Add import statement
            // Calculate depth
            const relPath = path.relative(srcDir, filePath);
            const depth = relPath.split(path.sep).length - 1;
            let imp = importStatement;
            if (depth === 0) imp = `import { getMediaUrl } from './utils/mediaUtils'`;
            if (depth === 1) imp = importStatementDepth1;
            if (depth === 2) imp = importStatement;
            if (depth === 3) imp = importStatementDepth3;

            // Insert after first import
            content = content.replace(/import .*?\n/, match => match + imp + '\n');
            fs.writeFileSync(filePath, content, 'utf8');
            filesToUpdate.push(filePath);
        } else if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            filesToUpdate.push(filePath);
        }
    }
});

console.log('Updated files:', filesToUpdate.length);
filesToUpdate.forEach(f => console.log(f));

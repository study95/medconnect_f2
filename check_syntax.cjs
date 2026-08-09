const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.join(__dirname, 'src');

function checkFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    try {
        esbuild.transformSync(code, { loader: filePath.endsWith('.tsx') || filePath.endsWith('.ts') ? 'tsx' : 'jsx' });
    } catch (err) {
        console.log('SYNTAX ERROR:', filePath);
        console.log(err.message);
        
        // Clean up stray closing parenthesis or empty statements in try/catch
        let fixed = code.replace(/catch\s*\(([^\)]*)\)\s*\{\s*\)\s*/g, 'catch ($1) {\n');
        fixed = fixed.replace(/catch\s*\(([^\)]*)\)\s*\{\s*\);?\s*/g, 'catch ($1) {\n');
        
        try {
            esbuild.transformSync(fixed, { loader: filePath.endsWith('.tsx') || filePath.endsWith('.ts') ? 'tsx' : 'jsx' });
            fs.writeFileSync(filePath, fixed, 'utf-8');
            console.log('AUTO-FIXED:', filePath);
        } catch (e2) {
            console.log('STILL FAILED:', e2.message);
        }
    }
}

function search(dir) {
    for (let f of fs.readdirSync(dir, { withFileTypes: true })) {
        let p = path.join(dir, f.name);
        if (f.isDirectory()) search(p);
        else if (/\.(js|jsx|ts|tsx)$/.test(f.name)) checkFile(p);
    }
}

search(root);

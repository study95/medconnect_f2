const fs = require('fs');
const path = require('path');

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.jsx')) {
            let c = fs.readFileSync(p, 'utf8');
            if (c.includes('getMediaUrl') && !c.includes('import { getMediaUrl }')) {
                let rel = path.relative('src', p);
                let d = rel.split(path.sep).length - 1;
                let imp = `import { getMediaUrl } from '../../utils/mediaUtils'`;
                if (d === 0) imp = `import { getMediaUrl } from './utils/mediaUtils'`;
                if (d === 1) imp = `import { getMediaUrl } from '../utils/mediaUtils'`;
                if (d === 2) imp = `import { getMediaUrl } from '../../utils/mediaUtils'`;
                if (d === 3) imp = `import { getMediaUrl } from '../../../utils/mediaUtils'`;
                
                c = c.replace(/import .*?\n/, match => match + imp + '\n');
                fs.writeFileSync(p, c, 'utf8');
                console.log('Fixed', p);
            }
        }
    });
}
walk('src');

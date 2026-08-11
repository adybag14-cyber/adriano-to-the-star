const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = __dirname;
const OUTPUT_FILE = 'assets.json';

// Ignore system files and web scripts
const IGNORE_LIST = [
    'gen_assets.js', 'server.js', 'game.html', 'assets.json', 
    'package.json', 'node_modules', '.git', 'server.py',
    'loader.js', 'cj3.js', 'cheerpOS.js'
];

// Extensions to include in the game package
const INCLUDE_EXTS = ['.jar', '.json', '.png', '.jpg', '.ogg', '.wav', '.class', '.so', '.properties', '.xml', '.csv'];

let fileList = [];

function scan(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!IGNORE_LIST.includes(file)) scan(fullPath);
        } else {
            if (IGNORE_LIST.includes(file)) continue;
            
            const ext = path.extname(file).toLowerCase();
            if (INCLUDE_EXTS.includes(ext)) {
                // Convert to Web Paths (Forward Slashes) relative to Root
                const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');
                fileList.push(relPath);
            }
        }
    }
}

console.log(`Scanning ${ROOT_DIR} for game assets...`);
scan(ROOT_DIR);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fileList, null, 2));
console.log(`Manifest generated: ${fileList.length} files -> ${OUTPUT_FILE}`);

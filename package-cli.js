#!/usr/bin/env node
/**
 * Package Stellar AI CLI into a zip file for easy download
 * Run: node package-cli.js
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const CLI_DIR = path.join(__dirname, 'stellar-ai-cli');
const OUTPUT_ZIP = path.join(__dirname, 'stellar-ai-cli.zip');

async function packageCLI() {
    console.log('📦 Packaging Stellar AI CLI...\n');
    
    if (!fs.existsSync(CLI_DIR)) {
        console.error('❌ stellar-ai-cli directory not found!');
        process.exit(1);
    }
    
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(OUTPUT_ZIP);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });
        
        output.on('close', () => {
            const sizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
            console.log(`✅ CLI packaged successfully!`);
            console.log(`   File: ${OUTPUT_ZIP}`);
            console.log(`   Size: ${sizeMB} MB`);
            console.log(`\n📝 Next steps:`);
            console.log(`   1. Commit the zip file: git add stellar-ai-cli.zip`);
            console.log(`   2. Commit: git commit -m "Add pre-packaged CLI zip"`);
            console.log(`   3. Push: git push origin main`);
            resolve();
        });
        
        archive.on('error', (err) => {
            console.error('❌ Archive error:', err);
            reject(err);
        });
        
        archive.pipe(output);
        
        // Add all files from stellar-ai-cli directory
        function addToArchive(dirPath, archivePath) {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            
            entries.forEach(entry => {
                const fullPath = path.join(dirPath, entry.name);
                const archiveEntryPath = archivePath ? `${archivePath}/${entry.name}` : entry.name;
                
                // Skip node_modules and other unnecessary files
                if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
                    return;
                }
                
                if (entry.isDirectory()) {
                    addToArchive(fullPath, archiveEntryPath);
                } else {
                    archive.file(fullPath, { name: `stellar-ai-cli/${archiveEntryPath}` });
                }
            });
        }
        
        addToArchive(CLI_DIR, '');
        archive.finalize();
    });
}

if (require.main === module) {
    packageCLI().catch(console.error);
}

module.exports = { packageCLI };


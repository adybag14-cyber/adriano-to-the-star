/**
 * Package Stellar AI CLI with LiveKit Agent Integration
 */

const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const CLI_DIR = path.join(__dirname, '..', 'stellar-ai-cli');
const OUTPUT_FILE = path.join(__dirname, '..', 'stellar-ai-cli.zip');

const filesToInclude = [
    'index.js',
    'package.json',
    'README.md',
    'SETUP.md',
    'INSTALL.md',
    'QUICKSTART.txt',
    'setup.bat',
    'setup.sh',
    'start.bat',
    'start.sh',
    'package-cli.js',
    // LiveKit Agent files
    'livekit_agent.py',
    'requirements.txt',
    'setup_env.ps1',
    'setup_env.sh',
    'test_full_setup.py'
];

console.log('📦 Creating Stellar AI CLI package with LiveKit integration...');
console.log(`   Source: ${CLI_DIR}`);
console.log(`   Output: ${OUTPUT_FILE}`);

// Remove existing zip
if (fs.existsSync(OUTPUT_FILE)) {
    fs.unlinkSync(OUTPUT_FILE);
}

const output = fs.createWriteStream(OUTPUT_FILE);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`✅ Package created successfully!`);
    console.log(`   Size: ${sizeMB} MB`);
    console.log(`   Location: ${OUTPUT_FILE}`);
});

archive.on('error', (err) => {
    console.error('❌ Archive error:', err);
    process.exit(1);
});

archive.pipe(output);

// Add files
filesToInclude.forEach((file) => {
    const filePath = path.join(CLI_DIR, file);
    if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `stellar-ai-cli/${file}` });
        console.log(`   ✓ Added: ${file}`);
    } else {
        console.warn(`   ⚠ File not found: ${file}`);
    }
});

archive.finalize();


#!/usr/bin/env node

/**
 * Package Stellar AI CLI for distribution
 * Creates a zip file of the CLI application
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

async function packageCLI() {
    const cliDir = __dirname;
    const outputPath = path.join(cliDir, '..', 'stellar-ai-cli.zip');
    
    console.log('📦 Packaging Stellar AI CLI...');
    console.log(`   Source: ${cliDir}`);
    console.log(`   Output: ${outputPath}`);

    // Create zip file
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', () => {
        const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        console.log(`✅ Package created: ${outputPath}`);
        console.log(`   Size: ${sizeMB} MB`);
        console.log(`   Total bytes: ${archive.pointer()}`);
    });

    archive.on('error', (err) => {
        console.error('❌ Archive error:', err);
        process.exit(1);
    });

    archive.pipe(output);

    // Add files (exclude node_modules and config)
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
        // LiveKit Agent files
        'livekit_agent.py',
        'requirements.txt',
        'setup_env.ps1',
        'setup_env.sh',
        'test_full_setup.py'
    ];

    for (const file of filesToInclude) {
        const filePath = path.join(cliDir, file);
        if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: file });
            console.log(`   ✓ Added: ${file}`);
        }
    }

    // Finalize the archive
    await archive.finalize();
}

packageCLI().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});


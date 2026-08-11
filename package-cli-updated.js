/**
 * Package Stellar AI CLI with LiveKit Agent Integration
 * Creates a zip file with all necessary files
 */

import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_DIR = path.join(__dirname, 'stellar-ai-cli');
const OUTPUT_FILE = path.join(__dirname, 'stellar-ai-cli.zip');

// Files to include in the package
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

// Directories to include
const dirsToInclude = [
    // Add any subdirectories if needed
];

function addToArchive(dirPath, archivePath, archive) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    entries.forEach((entry) => {
        const fullPath = path.join(dirPath, entry.name);
        const archiveEntryPath = archivePath ? `${archivePath}/${entry.name}` : entry.name;

        // Skip node_modules, .git, and other unnecessary directories
        if (entry.isDirectory()) {
            if (['node_modules', '.git', '__pycache__', '.pytest_cache'].includes(entry.name)) {
                return;
            }
            addToArchive(fullPath, archiveEntryPath, archive);
        } else {
            // Skip certain files
            if (['.DS_Store', '.gitignore', '.env', '.stellar-ai-config.json'].includes(entry.name)) {
                return;
            }
            archive.file(fullPath, { name: `stellar-ai-cli/${archiveEntryPath}` });
        }
    });
}

function createPackage() {
    return new Promise((resolve, reject) => {
        console.log('📦 Creating Stellar AI CLI package with LiveKit integration...');
        console.log(`   Source: ${CLI_DIR}`);
        console.log(`   Output: ${OUTPUT_FILE}`);

        // Remove existing zip file
        if (fs.existsSync(OUTPUT_FILE)) {
            fs.unlinkSync(OUTPUT_FILE);
            console.log('   Removed existing zip file');
        }

        const output = fs.createWriteStream(OUTPUT_FILE);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        output.on('close', () => {
            const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
            console.log(`✅ Package created successfully!`);
            console.log(`   Size: ${sizeMB} MB`);
            console.log(`   Location: ${OUTPUT_FILE}`);
            resolve();
        });

        archive.on('error', (err) => {
            console.error('❌ Archive error:', err);
            reject(err);
        });

        archive.pipe(output);

        // Add individual files
        filesToInclude.forEach((file) => {
            const filePath = path.join(CLI_DIR, file);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: `stellar-ai-cli/${file}` });
                console.log(`   ✓ Added: ${file}`);
            } else {
                console.warn(`   ⚠ File not found: ${file}`);
            }
        });

        // Add directories recursively
        dirsToInclude.forEach((dir) => {
            const dirPath = path.join(CLI_DIR, dir);
            if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                addToArchive(dirPath, dir, archive);
                console.log(`   ✓ Added directory: ${dir}`);
            }
        });

        // Finalize the archive
        archive.finalize();
    });
}

// Run the packaging
createPackage()
    .then(() => {
        console.log('\n🎉 Packaging complete!');
        console.log('\nThe package includes:');
        console.log('  • Node.js CLI with Puter.js integration');
        console.log('  • LiveKit Voice Agent (Python)');
        console.log('  • Setup scripts for Windows and Linux/Mac');
        console.log('  • Environment configuration scripts');
        console.log('  • Complete documentation');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Packaging failed:', err);
        process.exit(1);
    });


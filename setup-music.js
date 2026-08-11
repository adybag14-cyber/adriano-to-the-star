#!/usr/bin/env node
/**
 * Automated Music Setup Script
 * Downloads MP3 files from Google Drive and commits to GitLab
 * Run: node setup-music.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
// const { execSync } = require('child_process'); // Unused

// Create audio directory
const AUDIO_DIR = path.join(__dirname, 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
    console.log('📁 Created audio/ directory');
}

// Track configurations
const tracks = [
    {
        name: 'Track 1: Cosmic Journey',
        filename: 'cosmic-journey.mp3',
        driveId: '1UACr_XojAlKpHMuF3FKG8xHHTq18vScO'
    },
    {
        name: 'Track 2: Stellar Voyage',
        filename: 'stellar-voyage.mp3',
        driveId: '1kdxaOGEH1sLHWR_jN_JZnyg8mcbGmKrL'
    },
    {
        name: 'Track 3: Galactic Odyssey',
        filename: 'galactic-odyssey.mp3',
        driveId: '11VhqPDaANKWgWHIWAl-w5noiyvR9g9Kh'
    }
];

/**
 * Download file from Google Drive
 */
async function downloadFile(driveId, filename, trackName) {
    const outputPath = path.join(AUDIO_DIR, filename);
    
    // Skip if already exists
    if (fs.existsSync(outputPath)) {
        console.log(`✅ ${trackName} already exists`);
        return true;
    }
    
    console.log(`📥 Downloading ${trackName}...`);
    
    try {
        const url = `https://drive.google.com/uc?export=download&id=${driveId}`;
        
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            timeout: 120000,
            maxRedirects: 5
        });
        
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                const stats = fs.statSync(outputPath);
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                console.log(`✅ ${trackName} downloaded (${sizeMB} MB)`);
                resolve(true);
            });
            writer.on('error', reject);
        });
        
    } catch (error) {
        console.error(`❌ Error downloading ${trackName}:`, error.message);
        return false;
    }
}

/**
 * Main setup function
 */
async function setupMusic() {
    console.log('🎵 ═══════════════════════════════════════════');
    console.log('   Automated Music Setup for GitLab');
    console.log('🎵 ═══════════════════════════════════════════\n');
    
    let successCount = 0;
    
    // Download all tracks
    for (const track of tracks) {
        const success = await downloadFile(track.driveId, track.filename, track.name);
        if (success) successCount++;
    }
    
    console.log('\n═══════════════════════════════════════════');
    console.log(`✅ Downloaded: ${successCount}/${tracks.length} tracks`);
    console.log('═══════════════════════════════════════════\n');
    
    if (successCount === tracks.length) {
        console.log('🎉 All music files ready!');
        console.log('\n📝 Next steps:');
        console.log('   1. Review files in audio/ folder');
        console.log('   2. Commit to GitLab:');
        console.log('      git add audio/');
        console.log('      git commit -m "Add music files"');
        console.log('      git push origin main');
        console.log('\n   Music player will automatically stream from GitLab!\n');
    } else {
        console.log('⚠️  Some downloads failed.');
        console.log('   Manually download and place in audio/ folder\n');
    }
}

// Run if executed directly
if (require.main === module) {
    setupMusic().catch(err => {
        console.error('❌ Fatal error:', err);
        process.exit(1);
    });
}

module.exports = { setupMusic };


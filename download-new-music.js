/**
 * Download new music tracks from Google Drive
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const AUDIO_DIR = path.join(__dirname, 'audio');

// Ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// New tracks to download
const newTracks = [
    {
        name: 'Track 10',
        filename: 'track-10.mp3',
        driveId: '1-5A7_cLKsNE1vOgCLl3w6AGfYhJzcBEQ'
    },
    {
        name: 'Track 11',
        filename: 'track-11.mp3',
        driveId: '1_SYpsNj3GPSl1zfHpCQXw0HR9yqqlG0S'
    },
    {
        name: 'Track 12',
        filename: 'track-12.mp3',
        driveId: '1E_vDQaVZI6BYGp9DPzjPdGXWUcMFUCIA'
    },
    {
        name: 'Track 13',
        filename: 'track-13.mp3',
        driveId: '14VPeQ2n7iUI0t_zX8rJihCFRpow5PAtZ'
    },
    {
        name: 'Track 14',
        filename: 'track-14.mp3',
        driveId: '1Dl5xX2yOxCbiPynn4Z2quWSkhd5lTnF5'
    },
    {
        name: 'Track 15',
        filename: 'track-15.mp3',
        driveId: '18n7nSODLVx11Od6_H9DG_QylhhDFEBsQ'
    },
    {
        name: 'Track 16',
        filename: 'track-16.mp3',
        driveId: '19m28bRvT6QtVctxyo02oTtQ_zCmBbZX5'
    },
    {
        name: 'Track 17',
        filename: 'track-17.mp3',
        driveId: '1sERkM_Mfgx-rN0YTTabpzMkGT0KykA0d'
    },
    {
        name: 'Track 18',
        filename: 'track-18.mp3',
        driveId: '1NfKe_Kka2jE7bHns2kmswRKEjDbB5l5s'
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
 * Main download function
 */
async function downloadNewTracks() {
    console.log('🎵 Downloading new music tracks...\n');
    
    for (const track of newTracks) {
        await downloadFile(track.driveId, track.filename, track.name);
    }
    
    console.log('\n✅ All tracks downloaded!');
}

// Run if called directly
if (require.main === module) {
    downloadNewTracks().catch(console.error);
}

module.exports = { downloadNewTracks };


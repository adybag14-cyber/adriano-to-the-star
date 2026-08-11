const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MUSIC_DIR = path.join(__dirname, 'music');

// Ensure music directory exists
if (!fs.existsSync(MUSIC_DIR)) {
    fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

// Track configurations
const tracks = [
    {
        name: 'Track 1: Cosmic Journey',
        filename: 'track1.mp3',
        driveId: process.env.TRACK_1_ID || '1UACr_XojAlKpHMuF3FKG8xHHTq18vScO',
    },
    {
        name: 'Track 2: Stellar Voyage',
        filename: 'track2.mp3',
        driveId: process.env.TRACK_2_ID || '1kdxaOGEH1sLHWR_jN_JZnyg8mcbGmKrL',
    },
    {
        name: 'Track 3: Galactic Odyssey',
        filename: 'track3.mp3',
        driveId: process.env.TRACK_3_ID || '11VhqPDaANKWgWHIWAl-w5noiyvR9g9Kh',
    },
];

/**
 * Download a file from Google Drive
 */
async function downloadFromGoogleDrive(fileId, filename, trackName) {
    const outputPath = path.join(MUSIC_DIR, filename);

    // Check if file already exists
    if (fs.existsSync(outputPath)) {
        console.log(`✅ ${trackName} already exists, skipping download`);
        return true;
    }

    console.log(`📥 Downloading ${trackName}...`);

    try {
        // Try direct download URL
        const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            timeout: 60000, // 60 seconds timeout
            maxRedirects: 5,
        });

        const writer = fs.createWriteStream(outputPath);

        let downloadedBytes = 0;
        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);

        response.data.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            if (totalBytes > 0) {
                const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
                process.stdout.write(`\r   Progress: ${percent}%`);
            }
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`\n✅ ${trackName} downloaded successfully!`);

                // Verify file size
                const stats = fs.statSync(outputPath);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                console.log(`   File size: ${fileSizeMB} MB`);

                // Check if it's too small (likely an error page)
                if (stats.size < 100000) {
                    // Less than 100KB
                    console.warn(`⚠️  Warning: File seems too small. Might be a download error.`);
                    console.warn(
                        `   Try manually downloading from: https://drive.google.com/file/d/${fileId}/view`
                    );
                }

                resolve(true);
            });

            writer.on('error', (err) => {
                console.error(`\n❌ Error writing ${trackName}:`, err.message);
                reject(err);
            });
        });
    } catch (error) {
        console.error(`\n❌ Error downloading ${trackName}:`, error.message);

        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
        }

        console.log(`\n💡 Alternative: Manually download the file:`);
        console.log(`   1. Visit: https://drive.google.com/file/d/${fileId}/view`);
        console.log(`   2. Click "Download"`);
        console.log(`   3. Save as: backend/music/${filename}`);

        return false;
    }
}

/**
 * Main download function
 */
async function downloadAllTracks() {
    console.log('🎵 ═══════════════════════════════════════════');
    console.log('   Adriano To The Star - Music Downloader');
    console.log('🎵 ═══════════════════════════════════════════\n');

    let successCount = 0;
    let failCount = 0;

    for (const track of tracks) {
        const success = await downloadFromGoogleDrive(track.driveId, track.filename, track.name);

        if (success) {
            successCount++;
        } else {
            failCount++;
        }

        console.log(''); // Empty line between downloads
    }

    console.log('═══════════════════════════════════════════');
    console.log(`✅ Successfully downloaded: ${successCount}/${tracks.length}`);
    if (failCount > 0) {
        console.log(`❌ Failed downloads: ${failCount}`);
    }
    console.log('═══════════════════════════════════════════\n');

    if (successCount === tracks.length) {
        console.log('🎉 All tracks ready! You can now start the server:');
        console.log('   npm start\n');
    } else {
        console.log('⚠️  Some tracks failed to download.');
        console.log(
            '   Please ensure Google Drive files are set to "Anyone with the link can view"\n'
        );
    }
}

// Run the downloader
downloadAllTracks().catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});

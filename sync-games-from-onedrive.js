

/**
 * Sync Games from OneDrive
 * Copies SWF files from OneDrive directory to local swf/ directory
 * and updates games-manifest.json with all games
 * Run with: node sync-games-from-onedrive.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const onedriveDir = "F:\\OneDrive - SBSJ\\this is for me\\games";
const localSwfDir = path.join(__dirname, 'swf');
const manifestPath = path.join(__dirname, 'games-manifest.json');

// Ensure local swf directory exists
if (!fs.existsSync(localSwfDir)) {
    fs.mkdirSync(localSwfDir, { recursive: true });
    console.log('✅ Created swf/ directory');
}

// Read existing manifest
let existingGames = [];
if (fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    existingGames = JSON.parse(manifestContent);
    console.log(`📋 Found ${existingGames.length} games in existing manifest`);
} else {
    existingGames = [];
    console.log('📋 No existing manifest found, creating new one');
}

// Get all SWF files from OneDrive directory
console.log(`\n🔍 Scanning OneDrive directory: ${onedriveDir}`);
let onedriveFiles = [];
try {
    onedriveFiles = fs.readdirSync(onedriveDir)
        .filter(file => file.toLowerCase().endsWith('.swf'))
        .sort();
    console.log(`✅ Found ${onedriveFiles.length} SWF files in OneDrive directory`);
} catch (error) {
    console.error(`❌ Error reading OneDrive directory: ${error.message}`);
    process.exit(1);
}

// Get existing files in local swf directory
let localFiles = [];
if (fs.existsSync(localSwfDir)) {
    localFiles = fs.readdirSync(localSwfDir)
        .filter(file => file.toLowerCase().endsWith('.swf'))
        .map(file => file.toLowerCase())
        .sort();
    console.log(`📁 Found ${localFiles.length} SWF files in local swf/ directory`);
}

// Find files that need to be copied
const filesToCopy = onedriveFiles.filter(file => {
    const lowerFile = file.toLowerCase();
    return !localFiles.includes(lowerFile);
});

console.log(`\n📦 Found ${filesToCopy.length} files to copy from OneDrive`);

// Copy missing files
let copiedCount = 0;
let skippedCount = 0;
for (const file of filesToCopy) {
    const sourcePath = path.join(onedriveDir, file);
    const destPath = path.join(localSwfDir, file);

    try {
        // Check if file already exists (case-insensitive)
        if (fs.existsSync(destPath)) {
            skippedCount++;
            continue;
        }

        fs.copyFileSync(sourcePath, destPath);
        copiedCount++;
        if (copiedCount % 100 === 0) {
            console.log(`   Copied ${copiedCount} files...`);
        }
    } catch (error) {
        console.error(`   ❌ Error copying ${file}: ${error.message}`);
    }
}

console.log(`\n✅ Copied ${copiedCount} files`);
if (skippedCount > 0) {
    console.log(`   Skipped ${skippedCount} files (already exist)`);
}

// Create a set of existing file names (case-insensitive) for quick lookup
const existingFileNames = new Set(existingGames.map(game => {
    const fileName = path.basename(game.file);
    return fileName.toLowerCase();
}));

// Get all SWF files from local swf directory (after copying)
const allLocalFiles = fs.readdirSync(localSwfDir)
    .filter(file => file.toLowerCase().endsWith('.swf'))
    .sort();

// Find missing files in manifest
const missingFiles = allLocalFiles.filter(filename => {
    const lowerFile = filename.toLowerCase();
    return !existingFileNames.has(lowerFile);
});

console.log(`\n📋 Found ${missingFiles.length} files missing from manifest`);

// Helper functions
function categorizeGame(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('tower') || lower.includes('defense') || lower.includes('defence')) return 'Tower Defense';
    if (lower.includes('soccer') || lower.includes('football') || lower.includes('hockey') || lower.includes('basketball') || lower.includes('sports')) return 'Sports';
    if (lower.includes('racing') || lower.includes('race') || lower.includes('car') || lower.includes('truck') || lower.includes('drift')) return 'Racing';
    if (lower.includes('shoot') || lower.includes('gun') || lower.includes('war') || lower.includes('battle') || lower.includes('attack') || lower.includes('assault')) return 'Action';
    if (lower.includes('puzzle') || lower.includes('tetris') || lower.includes('match') || lower.includes('bloxorz') || lower.includes('sugar')) return 'Puzzle';
    if (lower.includes('adventure') || lower.includes('rpg') || lower.includes('quest') || lower.includes('fancy_pants')) return 'Adventure';
    if (lower.includes('strategy') || lower.includes('empire') || lower.includes('warfare') || lower.includes('civilization')) return 'Strategy';
    if (lower.includes('christmas') || lower.includes('xmas') || lower.includes('snow')) return 'Holiday';
    return 'Other';
}

function cleanGameName(filename) {
    let name = filename.replace(/\.swf$/i, '');
    // Remove file IDs at start (like f123456789...)
    name = name.replace(/^f\d+/, '');
    // Remove leading underscores, dashes, numbers
    name = name.replace(/^[\d\s\-_]+/, '');
    // Replace underscores and hyphens with spaces
    name = name.replace(/[_-]/g, ' ');
    // Capitalize words
    name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    // Clean up multiple spaces
    name = name.replace(/\s+/g, ' ').trim();
    // If empty, use original filename
    return name || filename.replace(/\.swf$/i, '');
}

function getFileSize(filepath) {
    try {
        const stats = fs.statSync(filepath);
        return parseFloat((stats.size / 1024).toFixed(1)); // Size in KB
    } catch {
        return 0;
    }
}

// Add missing games to manifest
const newGames = missingFiles.map(filename => {
    const filePath = path.join(localSwfDir, filename);
    const size = getFileSize(filePath);

    return {
        name: cleanGameName(filename),
        file: `swf/${filename}`,
        size: size
    };
});

// Combine existing and new games
const allGames = [...existingGames, ...newGames];

// Remove duplicates (in case any exist)
const uniqueGames = [];
const seenFiles = new Set();
for (const game of allGames) {
    const lowerFile = game.file.toLowerCase();
    if (!seenFiles.has(lowerFile)) {
        seenFiles.add(lowerFile);
        uniqueGames.push(game);
    }
}

// Sort by name
uniqueGames.sort((a, b) => a.name.localeCompare(b.name));

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(uniqueGames, null, 2), 'utf8');

console.log(`\n✅ Updated games manifest!`);
console.log(`   Added ${newGames.length} new games`);
console.log(`   Total unique games: ${uniqueGames.length}`);
console.log(`   Manifest saved to: ${manifestPath}`);

if (newGames.length > 0) {
    console.log(`\n📋 Sample of new games added (first 20):`);
    newGames.slice(0, 20).forEach(game => {
        console.log(`   - ${game.name} (${game.size} KB)`);
    });
    if (newGames.length > 20) {
        console.log(`   ... and ${newGames.length - 20} more`);
    }
}

console.log(`\n🎮 Summary:`);
console.log(`   OneDrive files: ${onedriveFiles.length}`);
console.log(`   Local files: ${allLocalFiles.length}`);
console.log(`   Files copied: ${copiedCount}`);
console.log(`   New games in manifest: ${newGames.length}`);
console.log(`   Total games in manifest: ${uniqueGames.length}`);


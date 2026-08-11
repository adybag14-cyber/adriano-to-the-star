/**
 * Update Games Manifest
 * Adds missing SWF files from swf/ directory to games-manifest.json
 * Run with: node update-games-manifest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swfDir = path.join(__dirname, 'swf');
const manifestPath = path.join(__dirname, 'games-manifest.json');

// Read existing manifest
let existingGames = [];
if (fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    existingGames = JSON.parse(manifestContent);
} else {
    existingGames = [];
}

// Get all SWF files from swf/ directory
const swfFiles = fs.readdirSync(swfDir)
    .filter(file => file.endsWith('.swf') || file.endsWith('.SWF'))
    .sort();

// Create a set of existing file paths for quick lookup
const existingFiles = new Set(existingGames.map(game => game.file));

// Find missing files
const missingFiles = swfFiles.filter(filename => {
    const filePath = `swf/${filename}`;
    return !existingFiles.has(filePath);
});

console.log(`Found ${swfFiles.length} SWF files in swf/ directory`);
console.log(`Found ${existingGames.length} games in manifest`);
console.log(`Found ${missingFiles.length} missing files`);

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
    name = name.replace(/^f\d+/, ''); // Remove file IDs
    name = name.replace(/_/g, ' ');
    name = name.replace(/^[\d\s\-_]+/, '');
    name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    name = name.replace(/\s+/g, ' ').trim();
    return name || filename.replace(/\.swf$/i, '');
}

function getFileSize(filepath) {
    try {
        const stats = fs.statSync(filepath);
        return (stats.size / 1024).toFixed(1); // Size in KB
    } catch {
        return 0;
    }
}

// Add missing games
const newGames = missingFiles.map(filename => {
    const filePath = path.join(swfDir, filename);
    const size = parseFloat(getFileSize(filePath));
    
    return {
        name: cleanGameName(filename),
        file: `swf/${filename}`,
        size: size
    };
});

// Combine existing and new games
const allGames = [...existingGames, ...newGames];

// Sort by name
allGames.sort((a, b) => a.name.localeCompare(b.name));

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(allGames, null, 2), 'utf8');

console.log(`\n✅ Updated games manifest!`);
console.log(`   Added ${newGames.length} new games`);
console.log(`   Total games: ${allGames.length}`);
console.log(`   Manifest saved to: ${manifestPath}`);

if (newGames.length > 0) {
    console.log(`\n📋 New games added:`);
    newGames.slice(0, 20).forEach(game => {
        console.log(`   - ${game.name} (${game.size} KB)`);
    });
    if (newGames.length > 20) {
        console.log(`   ... and ${newGames.length - 20} more`);
    }
}


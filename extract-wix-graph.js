#!/usr/bin/env node
/**
 * Extract Gibbs Free Energy Graph from Wix
 * Saves the graph image to use in GitLab version
 * Run: node extract-wix-graph.js
 */

// const axios = require('axios'); // Unused
const fs = require('fs');
const path = require('path');

// const WIX_EDUCATION_URL = 'https://www.adrianothestar.com/education'; // Unused

async function extractGraphImage() {
    console.log('📊 ═══════════════════════════════════════════');
    console.log('   Extracting Gibbs Graph from Wix');
    console.log('📊 ═══════════════════════════════════════════\n');
    
    console.log('💡 Manual Instructions:');
    console.log('   Since automated screenshot requires browser automation,');
    console.log('   please manually extract the graph:\n');
    console.log('   1. Visit your Wix education page');
    console.log('   2. Right-click on the Gibbs graph → "Save image as..."');
    console.log('   3. Save to: images/gibbs-graph-wix.png');
    console.log('   4. Or take a screenshot and crop it\n');
    
    console.log('🔧 Alternative: Use the existing canvas version');
    console.log('   The GitLab version has an interactive canvas chart');
    console.log('   that matches the Wix equation and styling.\n');
    
    // Create images directory if it doesn't exist
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
        console.log('✅ Created images/ directory\n');
    }
}

if (require.main === module) {
    extractGraphImage();
}

module.exports = { extractGraphImage };


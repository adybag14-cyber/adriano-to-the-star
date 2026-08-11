/**
 * Count all unique exoplanets in the database file
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'exoplanets.jsonl');

console.log('🔍 Counting exoplanets in database...\n');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const uniqueKepids = new Set();
    const uniqueKepoiNames = new Set();
    const statusCounts = {
        confirmed: 0,
        candidate: 0,
        falsePositive: 0,
        other: 0
    };
    
    let totalLines = 0;
    let validRecords = 0;
    
    lines.forEach((line, index) => {
        if (!line.trim()) return;
        
        totalLines++;
        
        try {
            const planet = JSON.parse(line);
            
            // Count unique by kepid
            if (planet.kepid) {
                uniqueKepids.add(planet.kepid);
            }
            
            // Count unique by kepoi_name
            if (planet.kepoi_name) {
                uniqueKepoiNames.add(planet.kepoi_name);
            }
            
            // Count by status
            const status = (planet.status || '').toUpperCase();
            if (status.includes('CONFIRMED') || status === 'CONFIRMED PLANET') {
                statusCounts.confirmed++;
            } else if (status.includes('CANDIDATE')) {
                statusCounts.candidate++;
            } else if (status.includes('FALSE') || status.includes('FALSE POSITIVE')) {
                statusCounts.falsePositive++;
            } else {
                statusCounts.other++;
            }
            
            validRecords++;
        } catch (e) {
            console.log(`⚠️  Error parsing line ${index + 1}: ${e.message}`);
        }
    });
    
    console.log('📊 Database Statistics:');
    console.log('═══════════════════════════════════════');
    console.log(`Total lines in file:     ${totalLines.toLocaleString()}`);
    console.log(`Valid JSON records:     ${validRecords.toLocaleString()}`);
    console.log(`Unique by kepid:        ${uniqueKepids.size.toLocaleString()}`);
    console.log(`Unique by kepoi_name:    ${uniqueKepoiNames.size.toLocaleString()}`);
    console.log('');
    console.log('📈 Status Breakdown:');
    console.log(`   Confirmed Planets:    ${statusCounts.confirmed.toLocaleString()}`);
    console.log(`   Candidates:           ${statusCounts.candidate.toLocaleString()}`);
    console.log(`   False Positives:      ${statusCounts.falsePositive.toLocaleString()}`);
    console.log(`   Other:              ${statusCounts.other.toLocaleString()}`);
    console.log('');
    console.log(`✅ Total unique exoplanets: ${Math.max(uniqueKepids.size, uniqueKepoiNames.size).toLocaleString()}`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}


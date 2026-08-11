/**
 * Quick check script to verify Vertex AI configuration
 * Does NOT load backend modules to avoid hanging
 */

require('dotenv').config();

console.log('\n🔍 Checking Google Cloud Vertex AI Configuration...\n');

// Check environment variables
const project = process.env.GOOGLE_CLOUD_PROJECT;
const locationVar = process.env.GOOGLE_CLOUD_LOCATION;
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

console.log('Environment Variables:');
console.log('  GOOGLE_CLOUD_PROJECT:', project || '❌ NOT SET');
console.log('  GOOGLE_CLOUD_LOCATION:', locationVar || '❌ NOT SET');
console.log('  GOOGLE_APPLICATION_CREDENTIALS:', credentials || '❌ NOT SET');

// Check if key file exists
const fs = require('fs');
const path = require('path');
const keyPath = credentials || './stellar-ai-key.json';
const resolvedPath = path.resolve(keyPath);

console.log('\nKey File Check:');
console.log('  Path:', resolvedPath);
const keyExists = fs.existsSync(resolvedPath);
console.log('  Exists:', keyExists ? '✅ YES' : '❌ NO');

if (keyExists) {
    try {
        const keyData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        console.log('  Project ID in key:', keyData.project_id || 'NOT FOUND');
        console.log('  Client Email:', keyData.client_email || 'NOT FOUND');
    } catch (error) {
        console.log('  ❌ Error reading key:', error.message);
    }
}

// Summary
console.log('\n📊 Configuration Summary:');
const allGood = project && keyExists && locationVar;
console.log('  Status:', allGood ? '✅ READY' : '❌ INCOMPLETE');

if (allGood) {
    console.log('\n✅ Configuration is complete!');
    console.log('   Project:', project);
    console.log('   Location:', locationVar);
    console.log('   Key file:', resolvedPath);
    console.log('\n   The backend server will use Vertex AI when it starts.');
} else {
    console.log('\n❌ Configuration is incomplete');
    if (!project) console.log('   - Missing GOOGLE_CLOUD_PROJECT');
    if (!keyExists) console.log('   - Missing or invalid key file');
    if (!locationVar) console.log('   - Missing GOOGLE_CLOUD_LOCATION');
}

console.log('\n');
process.exit(0);

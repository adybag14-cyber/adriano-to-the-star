/**
 * Pinata IPFS Configuration
 * 
 * Pinata is used for uploading NFT metadata to IPFS (InterPlanetary File System)
 * 
 * Get your API keys from: https://app.pinata.cloud/keys
 * 
 * IMPORTANT: These keys are injected from GitLab CI/CD variables during build
 * For local development, you can set them here or use environment variables
 */

// Pinata API Key (injected from GitLab CI/CD variable PINATA_API_KEY during build)
// For local development, uncomment and set your key below:
// const PINATA_API_KEY = 'your-pinata-api-key-here';

// Pinata Secret Key (injected from GitLab CI/CD variable PINATA_SECRET_KEY during build)
// For local development, uncomment and set your key below:
// const PINATA_SECRET_KEY = 'your-pinata-secret-key-here';

// Try to get from GitLab CI/CD variables (injected during build) or use local config
// NOTE: In production, these are replaced by inject-api-keys.ps1 during CI/CD build
const PINATA_API_KEY = typeof window !== 'undefined' && window.PINATA_API_KEY 
    ? window.PINATA_API_KEY 
    : 'YOUR_PINATA_API_KEY_HERE';

const PINATA_SECRET_KEY = typeof window !== 'undefined' && window.PINATA_SECRET_KEY 
    ? window.PINATA_SECRET_KEY 
    : 'YOUR_PINATA_SECRET_KEY_HERE';

// Make it available globally
if (typeof window !== 'undefined') {
    // Check if keys were injected (not placeholders)
    const isApiKeyPlaceholder = PINATA_API_KEY === 'YOUR_PINATA_API_KEY_HERE' || !PINATA_API_KEY;
    const isSecretKeyPlaceholder = PINATA_SECRET_KEY === 'YOUR_PINATA_SECRET_KEY_HERE' || !PINATA_SECRET_KEY;
    
    if (!isApiKeyPlaceholder && !isSecretKeyPlaceholder) {
        window.PINATA_API_KEY = PINATA_API_KEY;
        window.PINATA_SECRET_KEY = PINATA_SECRET_KEY;
        console.log('✅ Pinata API keys configured');
    } else {
        // Try to get from window if already set elsewhere
        if (window.PINATA_API_KEY && window.PINATA_SECRET_KEY) {
            console.log('✅ Pinata API keys found in window');
        } else {
            console.warn('⚠️ Pinata API keys not found. NFT/IPFS features will be disabled.');
            window.PINATA_API_KEY = null;
            window.PINATA_SECRET_KEY = null;
        }
    }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PINATA_API_KEY, PINATA_SECRET_KEY };
}


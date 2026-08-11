const express = require('express');
const router = express.Router();
require('dotenv').config();

// Secure backend for Pinata / Web3.Storage
// This prevents exposing API keys in the frontend

const PINATA_API_KEY = process.env.PINATA_API_KEY || 'mock-pinata-key';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || 'mock-pinata-secret';

router.post('/ipfs/pinata/pinJSON', async (req, res) => {
    try {
        const metadata = req.body;

        if (!metadata) {
            return res.status(400).json({ error: 'No metadata provided' });
        }

        // Mock response for now unless real keys are present
        if (PINATA_API_KEY === 'mock-pinata-key') {
            console.log('📦 Mock Pinata Upload:', metadata.name);
            return res.json({
                IpfsHash: 'QmMockHash' + Date.now(),
                PinSize: 123,
                Timestamp: new Date().toISOString()
            });
        }

        // Real Pinata implementation would go here using axios/fetch
        // const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, { headers: ... });
        // res.json(response.data);

    } catch (error) {
        console.error('Pinata Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload to IPFS' });
    }
});

module.exports = router;

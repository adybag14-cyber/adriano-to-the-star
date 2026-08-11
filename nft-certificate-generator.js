/**
 * NFT Certificate Generator for Planet Claims
 * Generates downloadable NFT-style certificates for claimed planets
 * Low priority feature - basic implementation without blockchain
 */

class NFTCertificateGenerator {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.init();
    }

    init() {
        this.trackEvent('n_ft_ce_rt_if_ic_at_eg_en_er_at_or_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("n_ft_ce_rt_if_ic_at_eg_en_er_at_or_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Generate NFT-style certificate for a planet claim
     * @param {Object} planetData - Planet data object
     * @param {Object} claimData - Claim data (user, date, etc.)
     * @returns {Promise<Blob>} Certificate image as blob
     */
    async generateCertificate(planetData, claimData) {
        return new Promise((resolve, reject) => {
            try {
                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = 1200;
                canvas.height = 800;
                const ctx = canvas.getContext('2d');

                // Background gradient
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#0a0a14');
                gradient.addColorStop(0.5, '#1a1a2e');
                gradient.addColorStop(1, '#0a0a14');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Border
                ctx.strokeStyle = '#ba944f';
                ctx.lineWidth = 8;
                ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

                // Decorative corner elements
                this.drawCornerDecoration(ctx, 20, 20, 100, 100);
                this.drawCornerDecoration(ctx, canvas.width - 120, 20, 100, 100);
                this.drawCornerDecoration(ctx, 20, canvas.height - 120, 100, 100);
                this.drawCornerDecoration(ctx, canvas.width - 120, canvas.height - 120, 100, 100);

                // Title
                ctx.fillStyle = '#ba944f';
                ctx.font = 'bold 48px "Raleway", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('PLANET OWNERSHIP CERTIFICATE', canvas.width / 2, 120);

                // Subtitle
                ctx.fillStyle = 'rgba(186, 148, 79, 0.7)';
                ctx.font = '24px "Raleway", sans-serif';
                ctx.fillText('NFT Certificate of Ownership', canvas.width / 2, 160);

                // Planet Name
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 64px "Cormorant Garamond", serif';
                const planetName = planetData.kepid ? `Kepler-${planetData.kepid}` : planetData.name || 'Unknown Planet';
                ctx.fillText(planetName, canvas.width / 2, 280);

                // Planet Details
                ctx.font = '20px "Raleway", sans-serif';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                
                const details = [
                    `Type: ${planetData.type || 'Exoplanet'}`,
                    `Discovery Method: ${planetData.discovery_method || 'Transit'}`,
                    `Status: ${planetData.status || 'Confirmed'}`
                ];

                let yPos = 360;
                details.forEach(detail => {
                    ctx.fillText(detail, canvas.width / 2, yPos);
                    yPos += 35;
                });

                // Owner Information
                ctx.fillStyle = '#ba944f';
                ctx.font = 'bold 28px "Raleway", sans-serif';
                ctx.fillText('Certified Owner', canvas.width / 2, 520);

                ctx.fillStyle = '#ffffff';
                ctx.font = '24px "Raleway", sans-serif';
                const ownerName = claimData.userName || claimData.userEmail || 'Anonymous';
                ctx.fillText(ownerName, canvas.width / 2, 560);

                // Claim Date
                ctx.fillStyle = 'rgba(186, 148, 79, 0.7)';
                ctx.font = '18px "Raleway", sans-serif';
                const claimDate = claimData.claimedAt ? new Date(claimData.claimedAt).toLocaleDateString() : new Date().toLocaleDateString();
                ctx.fillText(`Claimed on: ${claimDate}`, canvas.width / 2, 600);

                // Certificate ID
                ctx.fillStyle = 'rgba(186, 148, 79, 0.5)';
                ctx.font = '16px "Courier New", monospace';
                const certId = `CERT-${planetData.kepid || 'UNKNOWN'}-${Date.now()}`;
                ctx.fillText(`Certificate ID: ${certId}`, canvas.width / 2, 650);

                // Footer
                ctx.fillStyle = 'rgba(186, 148, 79, 0.4)';
                ctx.font = '14px "Raleway", sans-serif';
                ctx.fillText('Adriano To The Star - Interstellar Travel Agency', canvas.width / 2, 750);
                ctx.fillText('This certificate verifies ownership of a claimed exoplanet', canvas.width / 2, 775);

                // Convert to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to generate certificate image'));
                    }
                }, 'image/png');
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Draw decorative corner element
     */
    drawCornerDecoration(ctx, x, y, width, height) {
        ctx.strokeStyle = '#ba944f';
        ctx.lineWidth = 3;
        
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(x, y + 30);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 30, y);
        ctx.stroke();

        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(x + width - 30, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + 30);
        ctx.stroke();

        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(x, y + height - 30);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + 30, y + height);
        ctx.stroke();

        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(x + width - 30, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width, y + height - 30);
        ctx.stroke();
    }

    /**
     * Download certificate
     */
    async downloadCertificate(planetData, claimData) {
        try {
            const blob = await this.generateCertificate(planetData, claimData);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `planet-certificate-${planetData.kepid || 'unknown'}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error generating certificate:', error);
            alert('Failed to generate certificate. Please try again.');
            return false;
        }
    }

    /**
     * Generate certificate with blockchain metadata (preparation for future blockchain integration)
     */
    generateMetadata(planetData, claimData) {
        return {
            name: `Planet Ownership Certificate - ${planetData.kepid || planetData.name}`,
            description: `NFT Certificate of Ownership for ${planetData.kepid || planetData.name}`,
            image: '', // Will be IPFS hash in future
            attributes: [
                {
                    trait_type: 'Planet KEPID',
                    value: planetData.kepid || 'Unknown'
                },
                {
                    trait_type: 'Planet Type',
                    value: planetData.type || 'Exoplanet'
                },
                {
                    trait_type: 'Discovery Method',
                    value: planetData.discovery_method || 'Transit'
                },
                {
                    trait_type: 'Claim Date',
                    value: claimData.claimedAt || new Date().toISOString()
                },
                {
                    trait_type: 'Owner',
                    value: claimData.userEmail || 'Anonymous'
                }
            ],
            external_url: `https://starisdons-d53656.gitlab.io/database.html?kepid=${planetData.kepid}`,
            background_color: '0a0a14'
        };
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.NFTCertificateGenerator = NFTCertificateGenerator;
    window.nftCertificateGenerator = new NFTCertificateGenerator();
}


/**
 * Shop Manager
 * 
 * Handles product purchases, downloads, and purchase history.
 * Supports free and paid products with localStorage persistence.
 * 
 * @class ShopManager
 * @author Adriano To The Star
 * @version 1.0.0
 * @since 2025-01
 * 
 * @example
 * // Initialize shop manager
 * const shop = new ShopManager();
 */
class ShopManager {
    /**
     * Create a new ShopManager instance
     * 
     * Initializes product catalog and loads purchase history.
     * 
     * @constructor
     */
    constructor() {
        this.products = [
            {
                id: 'andromedian-free-pirate',
                name: 'Andromedian Free Pirate',
                price: 0.00,
                currency: '£',
                // Download the product image (Law of Universe PNG)
                // Primary: Local file in repository
                downloadUrl: './images/law-of-universe.png',
                downloadFilename: 'law-of-universe.png',
                // Fallback: Google Drive URL if local file not available
                fallbackUrl: 'https://drive.google.com/uc?export=download&id=1uhU4yviOcpKgXoMhC01p5Ng5Htrx1yY_',
                description: 'Download your Law of Universe image - "Think universe is a black box of ADRIANO\'s computation, but with a BAGGIA\'s single assumption \'hidden equation\' power input=power output."',
            },
        ];
        this.purchasedProducts = this.loadPurchasedProducts();
        this.init();
    }

    /**
     * Initialize the shop manager
     * 
     * Renders products and sets up event listeners.
     * 
     * @public
     * @returns {void}
     */
    init() {
        this.renderProducts();
        this.setupEventListeners();
    }

    /**
     * Load purchased products from localStorage
     * 
     * @private
     * @returns {Array<string>} Array of purchased product IDs
     */
    loadPurchasedProducts() {
        try {
            const stored = localStorage.getItem('purchased_products');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading purchased products:', error);
            return [];
        }
    }

    /**
     * Save purchased products to localStorage
     * 
     * @private
     * @returns {void}
     */
    savePurchasedProducts() {
        try {
            localStorage.setItem('purchased_products', JSON.stringify(this.purchasedProducts));
        } catch (error) {
            console.error('Error saving purchased products:', error);
        }
    }

    /**
     * Render products in the UI
     * 
     * Updates button text and actions based on purchase status.
     * 
     * @private
     * @returns {void}
     */
    renderProducts() {
        const productContainer = document.querySelector('.product-card');
        if (!productContainer) return;

        const product = this.products[0];
        const isPurchased = this.purchasedProducts.includes(product.id);

        // Update button based on purchase status
        const button = productContainer.querySelector('.buy-button') ||
            productContainer.querySelector('button');

        if (button) {
            if (!button.dataset.productId) {
                button.dataset.productId = product.id;
            }
            if (isPurchased) {
                button.innerHTML = '📥 Download';
                button.className = 'download-button';
            } else {
                button.innerHTML = product.price === 0 ? '🛒 Get Free' : `🛒 Buy Now - ${product.currency}${product.price.toFixed(2)}`;
                button.className = 'buy-button';
            }
        }
    }

    /**
     * Setup event listeners for product interactions
     * 
     * Handles clicks on buy and download buttons.
     * 
     * @private
     * @returns {void}
     */
    setupEventListeners() {
        // Handle any dynamically added buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.buy-button, .download-button');
            if (!btn) return;

            if (btn.classList.contains('buy-button')) {
                const productId = btn.dataset.productId || this.products[0].id;
                this.purchaseProduct(productId);
            } else if (btn.classList.contains('download-button')) {
                const productId = btn.dataset.productId || this.products[0].id;
                this.downloadProduct(productId);
            }
        });
    }

    /**
     * Purchase a product
     * 
     * For free products, marks as purchased and triggers download.
     * For paid products, would integrate with payment gateway.
     * 
     * @public
     * @async
     * @param {string} productId - ID of product to purchase
     * @returns {Promise<void>}
     */
    async purchaseProduct(productId) {
        const product = this.products.find((p) => p.id === productId);
        if (!product) {
            alert('Product not found');
            return;
        }

        // For free products, directly mark as purchased and download
        if (product.price === 0) {
            if (!this.purchasedProducts.includes(productId)) {
                this.purchasedProducts.push(productId);
                this.savePurchasedProducts();
            }

            // Update UI immediately
            this.renderProducts();

            // Show success message
            this.showPurchaseSuccess(product);

            // Auto-download after a short delay
            setTimeout(() => {
                this.downloadProduct(productId);
            }, 1000);
        } else {
            // For paid products, show payment modal (future implementation)
            alert(`Payment integration coming soon!\n\nProduct: ${product.name}\nPrice: ${product.currency}${product.price.toFixed(2)}`);
        }
    }

    showPurchaseSuccess(product) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'purchase-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h3>✅ Purchase Successful!</h3>
                <p>You've successfully acquired: <strong>${product.name}</strong></p>
                <p>Your download will start shortly...</p>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid var(--gold-accent, #d4af37);
            border-radius: 8px;
            padding: 1.5rem;
            z-index: 10000;
            max-width: 350px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Download a purchased product
     * 
     * Attempts to download from local URL first, falls back to Google Drive.
     * Handles download errors gracefully.
     * 
     * @public
     * @async
     * @param {string} productId - ID of product to download
     * @returns {Promise<void>}
     */
    async downloadProduct(productId) {
        const product = this.products.find((p) => p.id === productId);
        if (!product) {
            alert('Product not found');
            return;
        }

        // Check if product was purchased
        if (!this.purchasedProducts.includes(productId) && product.price > 0) {
            alert('Please purchase this product first');
            return;
        }

        try {
            // Build the full URL for local files on GitLab Pages
            const getFullUrl = (relativePath) => {
                if (relativePath.startsWith('http')) {
                    return relativePath;
                }
                // Get base URL for GitLab Pages
                const baseUrl = window.location.origin;
                // const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
                // Remove leading ./ from path
                const cleanPath = relativePath.replace(/^\.\//, '');
                // Try root-relative first (works for GitLab Pages)
                return `${baseUrl}/${cleanPath}`;
            };

            // Try local file first (convert to full URL for GitLab Pages)
            if (product.downloadUrl && !product.downloadUrl.startsWith('http')) {
                const fullUrl = getFullUrl(product.downloadUrl);
                console.log(`📥 Attempting download from: ${fullUrl}`);

                // Use fetch method for reliable download on GitLab Pages
                try {
                    const response = await fetch(fullUrl, { mode: 'cors' });
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = product.downloadFilename || 'law-of-universe.png';
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();

                        // Clean up after a delay
                        setTimeout(() => {
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                        }, 100);

                        console.log(`✅ Download started: ${product.name} (${(blob.size / 1024).toFixed(2)} KB)`);
                        return;
                    } else {
                        console.warn(`⚠️ Local file not accessible (${response.status}), trying fallback...`);
                        throw new Error(`File not found: ${response.status}`);
                    }
                } catch (error) {
                    console.warn('Direct download failed, trying fallback:', error);
                    // Continue to fallback method below
                }
            }

            // For external URLs or if local file failed, use fallback
            const urlToFetch = product.fallbackUrl ||
                (product.downloadUrl?.startsWith('http') ? product.downloadUrl : null);

            if (urlToFetch) {
                console.log(`📥 Fetching from fallback URL: ${urlToFetch}`);

                try {
                    // Fetch the image and create a download
                    const response = await fetch(urlToFetch, { mode: 'cors' });
                    if (!response.ok) {
                        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
                    }

                    const blob = await response.blob();
                    console.log(`📦 Blob created: ${(blob.size / 1024).toFixed(2)} KB, type: ${blob.type}`);

                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = product.downloadFilename || 'law-of-universe.png';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();

                    // Clean up after a delay
                    setTimeout(() => {
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    }, 100);

                    console.log(`✅ Download started (fallback): ${product.name}`);
                } catch (error) {
                    console.error('Fallback download failed:', error);
                    throw error;
                }
            } else {
                alert(
                    `Download file not configured.\n\nPlease ensure the file is available.\n\nProduct: ${product.name}`
                );
            }
        } catch (error) {
            console.error('Error downloading product:', error);
            alert(
                `Download failed. Please try again or contact support.\n\nError: ${error.message}\n\nTip: The file may still be processing on GitLab Pages. Please wait a moment and try again.`
            );
        }
    }
}

// Initialize shop manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.shopManager = new ShopManager();
    });
} else {
    window.shopManager = new ShopManager();
}


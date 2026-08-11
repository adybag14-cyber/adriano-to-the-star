class SEOOptimizationSystem {
    generateSitemap(urls = []) {
        const list = urls.map(u => `<url><loc>${u}</loc></url>`).join('');
        return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${list}</urlset>`;
    }
    generateStructuredData(type, data) {
        return JSON.stringify({ '@context': 'https://schema.org', '@type': type, ...data });
    }
}
const seoOptimizationSystem = new SEOOptimizationSystem();
if (typeof window !== 'undefined') {
    window.seoOptimizationSystem = seoOptimizationSystem;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOOptimizationSystem;
}

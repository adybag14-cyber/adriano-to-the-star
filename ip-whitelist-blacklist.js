/**
 * IP Whitelisting/Blacklisting
 * IP address management
 */

class IPWhitelistBlacklist {
    constructor() {
        this.whitelist = [];
        this.blacklist = [];
        this.init();
    }
    
    init() {
        this.loadLists();
        this.checkIP();
    }
    
    loadLists() {
        try {
            const saved = localStorage.getItem('ip-lists');
            if (saved) {
                const data = JSON.parse(saved);
                this.whitelist = data.whitelist || [];
                this.blacklist = data.blacklist || [];
            }
        } catch (e) {
            console.warn('Failed to load IP lists:', e);
        }
    }
    
    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[IPWhitelist] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[IPWhitelist] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[IPWhitelist] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    async getCurrentIP() {
        const url = 'https://api.ipify.org?format=json';
        try {
            const data = await this.fetchJSON(url);
            return data ? data.ip : null;
        } catch (e) {
            console.error('[IPWhitelist] Failed to get IP:', e.message);
            return null;
        }
    }
    
    async checkIP() {
        const ip = await this.getCurrentIP();
        if (ip) {
            if (this.blacklist.includes(ip)) {
                alert('Access denied from this IP address');
                return false;
            }
        }
        return true;
    }
    
    addToWhitelist(ip) {
        if (!this.whitelist.includes(ip)) {
            this.whitelist.push(ip);
            this.saveLists();
        }
    }
    
    addToBlacklist(ip) {
        if (!this.blacklist.includes(ip)) {
            this.blacklist.push(ip);
            this.saveLists();
        }
    }
    
    saveLists() {
        try {
            localStorage.setItem('ip-lists', JSON.stringify({
                whitelist: this.whitelist,
                blacklist: this.blacklist
            }));
        } catch (e) {
            console.warn('Failed to save IP lists:', e);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.ipWhitelistBlacklist = new IPWhitelistBlacklist(); });
} else {
    window.ipWhitelistBlacklist = new IPWhitelistBlacklist();
}



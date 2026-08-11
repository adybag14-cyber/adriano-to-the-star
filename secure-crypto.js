/**
 * Secure Crypto Manager
 * Handles cryptographic operations using the Web Crypto API
 * - RSA-OAEP Key Pair Generation
 * - PBKDF2 Key Derivation (for password-protected private keys)
 * - AES-GCM Encryption (for messages and private keys)
 * - Hybrid Encryption (AES for data, RSA for keys)
 */

class SecureCryptoManager {
    constructor() {
        this.algorithm = {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        };
    }

    /**
     * Generate a new RSA-OAEP key pair
     * @returns {Promise<CryptoKeyPair>}
     */
    async generateKeyPair() {
        return await window.crypto.subtle.generateKey(
            this.algorithm,
            true, // extractable
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Export a key to JWK format
     * @param {CryptoKey} key 
     * @returns {Promise<JsonWebKey>}
     */
    async exportKey(key) {
        return await window.crypto.subtle.exportKey("jwk", key);
    }

    /**
     * Import a key from JWK format
     * @param {JsonWebKey} jwk 
     * @param {string} type - "public" or "private"
     * @returns {Promise<CryptoKey>}
     */
    async importKey(jwk, type) {
        return await window.crypto.subtle.importKey(
            "jwk",
            jwk,
            this.algorithm,
            true,
            [type === "public" ? "encrypt" : "decrypt"]
        );
    }

    /**
     * Derive a symmetric key from a password using PBKDF2
     * @param {string} password 
     * @param {Uint8Array} salt 
     * @returns {Promise<CryptoKey>}
     */
    async deriveKeyFromPassword(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Encrypt the private key with a password
     * @param {CryptoKey} privateKey 
     * @param {string} password 
     * @returns {Promise<Object>} { encryptedKey, salt, iv }
     */
    async encryptPrivateKey(privateKey, password) {
        // 1. Export Private Key to JWK
        const jwk = await this.exportKey(privateKey);
        const jwkString = JSON.stringify(jwk);
        const enc = new TextEncoder();
        const data = enc.encode(jwkString);

        // 2. Generate Salt and IV
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // 3. Derive Key from Password
        const aesKey = await this.deriveKeyFromPassword(password, salt);

        // 4. Encrypt
        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            data
        );

        return {
            encryptedKey: this.arrayBufferToBase64(encryptedContent),
            salt: this.arrayBufferToBase64(salt),
            iv: this.arrayBufferToBase64(iv)
        };
    }

    /**
     * Decrypt the private key with a password
     * @param {Object} encryptedData { encryptedKey, salt, iv }
     * @param {string} password 
     * @returns {Promise<CryptoKey>}
     */
    async decryptPrivateKey(encryptedData, password) {
        try {
            const salt = this.base64ToArrayBuffer(encryptedData.salt);
            const iv = this.base64ToArrayBuffer(encryptedData.iv);
            const encryptedContent = this.base64ToArrayBuffer(encryptedData.encryptedKey);

            // 1. Derive Key
            const aesKey = await this.deriveKeyFromPassword(password, salt);

            // 2. Decrypt
            const decryptedContent = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                aesKey,
                encryptedContent
            );

            // 3. Import Key
            const dec = new TextDecoder();
            const jwkString = dec.decode(decryptedContent);
            const jwk = JSON.parse(jwkString);

            return await this.importKey(jwk, "private");
        } catch (e) {
            console.error("Decryption failed:", e);
            throw new Error("Incorrect password or corrupted key.");
        }
    }

    /**
     * Encrypt a message for a recipient
     * @param {string} text 
     * @param {CryptoKey} recipientPublicKey 
     * @returns {Promise<Object>} { encryptedData, encryptedKey, iv }
     */
    async encryptMessage(text, recipientPublicKey) {
        // 1. Generate a random AES key for this message
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt"]
        );

        // 2. Encrypt the message text with AES
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const data = enc.encode(text);

        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            data
        );

        // 3. Encrypt the AES key with the Recipient's RSA Public Key
        const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            recipientPublicKey,
            rawAesKey
        );

        return {
            encryptedData: this.arrayBufferToBase64(encryptedContent),
            encryptedKey: this.arrayBufferToBase64(encryptedAesKey),
            iv: this.arrayBufferToBase64(iv)
        };
    }

    /**
     * Decrypt a message
     * @param {Object} payload { encryptedData, encryptedKey, iv }
     * @param {CryptoKey} privateKey 
     * @returns {Promise<string>}
     */
    async decryptMessage(payload, privateKey) {
        const encryptedAesKey = this.base64ToArrayBuffer(payload.encryptedKey);
        const encryptedContent = this.base64ToArrayBuffer(payload.encryptedData);
        const iv = this.base64ToArrayBuffer(payload.iv);

        // 1. Decrypt the AES key with RSA Private Key
        const rawAesKey = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedAesKey
        );

        // 2. Import the AES key
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            rawAesKey,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        // 3. Decrypt the content
        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            encryptedContent
        );

        const dec = new TextDecoder();
        return dec.decode(decryptedContent);
    }

    // Helpers
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

// Export global instance
window.secureCrypto = new SecureCryptoManager();

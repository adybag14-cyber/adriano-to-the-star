/**
 * Native Integration Core
 * Wrappers for File System Access API and WebSerial API.
 */

export class NativeBridge {
    constructor() {
        this.fileHandle = null;
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.keepReading = false;

        // Feature Detection
        this.supportsFileSystem = window.isSecureContext && 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
        this.supportsSerial = window.isSecureContext && 'serial' in navigator;
    }

    // --- File System API ---

    async openFile() {
        if (!this.supportsFileSystem) throw new Error("File System API not supported.");

        [this.fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'Text Files',
                accept: { 'text/plain': ['.txt', '.log', '.md'] }
            }],
            multiple: false
        });

        const file = await this.fileHandle.getFile();
        return {
            name: file.name,
            content: await file.text()
        };
    }

    async saveFile(content, saveAsNew = false) {
        if (!this.supportsFileSystem) throw new Error("File System API not supported.");

        if (saveAsNew || !this.fileHandle) {
            this.fileHandle = await window.showSaveFilePicker({
                types: [{
                    description: 'Text Files',
                    accept: { 'text/plain': ['.txt'] }
                }]
            });
        }

        const writable = await this.fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        return this.fileHandle.name;
    }

    // --- WebSerial API ---

    async connectSerial(baudRate = 9600) {
        if (!this.supportsSerial) throw new Error("WebSerial API not supported.");
        if (this.port) return this.port.getInfo();
        const normalizedBaudRate = Number(baudRate);
        if (!Number.isInteger(normalizedBaudRate) || normalizedBaudRate < 300 || normalizedBaudRate > 3000000) {
            throw new RangeError('Baud rate must be an integer between 300 and 3000000.');
        }

        this.port = await navigator.serial.requestPort();
        await this.port.open({ baudRate: normalizedBaudRate });

        this.keepReading = true;
        this.readLoop();

        return this.port.getInfo();
    }

    async disconnectSerial() {
        if (this.port) {
            this.keepReading = false;
            if (this.reader) await this.reader.cancel().catch(() => {});
            await this.port.close();
            this.port = null;
        }
    }

    async readLoop() {
        while (this.port && this.port.readable && this.keepReading) {
            this.reader = this.port.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    if (value && this.onSerialData) {
                        this.onSerialData(value);
                    }
                }
            } catch (error) {
                if (this.onSerialError) this.onSerialError(error);
                else console.info('Serial read stopped:', error?.message || error);
            } finally {
                this.reader.releaseLock();
            }
        }
    }

    async sendSerial(data) {
        if (this.port && this.port.writable) {
            const writer = this.port.writable.getWriter();
            try {
                const encoder = new TextEncoder();
                await writer.write(encoder.encode(String(data)));
            } finally {
                writer.releaseLock();
            }
        }
    }
}

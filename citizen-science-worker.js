/**
 * Project SETI - Citizen Science Background Worker
 * Simulates processing telescope data in the background to find signs of life.
 * Uses idle CPU cycles to perform "Fast Fourier Transforms" (simulated).
 */

let processedChunks = 0;
let totalScienceGenerated = 0;

// Simulation parameters
const CHUNK_SIZE = 1024 * 1024; // 1MB simulated
const PROCESS_TIME_MS = 2000;   // Time to process one chunk

function analyzeSignalChunk(chunkId) {
    // Simulate complex math (Matrix multiplication or prime searching)
    // To actually burn some CPU (but not freeze UI since we are in a worker)
    const startTime = Date.now();
    let primesFound = 0;

    // Find primes in a range as "work"
    for (let i = 2; i < 50000; i++) {
        let isPrime = true;
        for (let j = 2; j <= Math.sqrt(i); j++) {
            if (i % j === 0) {
                isPrime = false;
                break;
            }
        }
        if (isPrime) primesFound++;
    }

    const duration = Date.now() - startTime;

    // Result logic
    const success = Math.random() > 0.7; // 30% chane of finding something interesting
    const scienceValue = success ? Math.floor(Math.random() * 50) + 10 : 1;

    return {
        chunkId,
        duration,
        scienceValue,
        success,
        message: success ? "Correlation detected in Sector 7G." : "Background noise only."
    };
}

// Loop
function startProcessing() {
    setInterval(() => {
        const chunkId = 'sig_' + Date.now();
        const result = analyzeSignalChunk(chunkId);

        processedChunks++;
        totalScienceGenerated += result.scienceValue;

        // Send back to Main Thread
        postMessage({
            type: 'ANALYSIS_COMPLETE',
            data: result,
            stats: {
                totalChunks: processedChunks,
                totalScience: totalScienceGenerated
            }
        });

    }, PROCESS_TIME_MS);
}

// Listen for start command
self.onmessage = function (e) {
    if (e.data.type === 'START_SETI') {
        console.log('📡 Worker: Project SETI started.');
        startProcessing();
    }
};

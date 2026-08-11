/**
 * Test Gemini Live API with gemini-2.5-flash-live model
 * Tests both WebSocket (bidiGenerateContent) and REST API fallback
 */

const API_KEY =
    ((typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search).get('key') : null) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('GOOGLE_API_KEY') : null) ||
    (typeof process !== 'undefined' ? (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) : null) ||
    '';
const TEST_PROMPT = 'Hello! Can you respond with a short test message?';

console.log('🧪 Testing Gemini Live API...\n');
console.log(`API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
console.log(`Test Prompt: "${TEST_PROMPT}"\n`);

// Test 1: WebSocket (bidiGenerateContent) with gemini-2.5-flash-live
async function testWebSocket() {
    console.log('📡 Test 1: WebSocket (bidiGenerateContent) with gemini-2.5-flash-live');
    console.log('─'.repeat(60));
    
    try {
        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?key=${API_KEY}`;
        
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(wsUrl);
            let responseText = '';
            let setupComplete = false;
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error('WebSocket timeout after 30 seconds'));
            }, 30000);

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                
                // Send setup message
                const setupMessage = {
                    setup: {
                        model: 'models/gemini-2.5-flash-live',
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1024
                        }
                    }
                };
                ws.send(JSON.stringify(setupMessage));
                console.log('📤 Setup message sent');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.setupComplete) {
                        console.log('✅ Setup complete');
                        setupComplete = true;
                        
                        // Send client content
                        const clientMessage = {
                            clientContent: {
                                turn: {
                                    role: 'user',
                                    parts: [{ text: TEST_PROMPT }]
                                }
                            }
                        };
                        ws.send(JSON.stringify(clientMessage));
                        console.log('📤 Client message sent');
                    } else if (data.serverContent) {
                        if (data.serverContent.modelTurn) {
                            const parts = data.serverContent.modelTurn.parts || [];
                            parts.forEach(part => {
                                if (part.text) {
                                    responseText += part.text;
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error('❌ Error parsing message:', error);
                }
            };

            ws.onerror = (error) => {
                clearTimeout(timeout);
                console.error('❌ WebSocket error:', error);
                reject(error);
            };

            ws.onclose = () => {
                clearTimeout(timeout);
                if (responseText) {
                    console.log(`✅ Response received: "${responseText}"`);
                    resolve(responseText);
                } else if (!setupComplete) {
                    reject(new Error('WebSocket closed before setup complete'));
                } else {
                    resolve(responseText || 'No response text received');
                }
            };
        });
    } catch (error) {
        console.error('❌ WebSocket test failed:', error.message);
        throw error;
    }
}

// Test 2: REST API (generateContent) with gemini-2.5-flash-live-preview
async function testREST() {
    console.log('\n🌐 Test 2: REST API (generateContent) with gemini-2.5-flash-live-preview');
    console.log('─'.repeat(60));
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-live-preview:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: TEST_PROMPT }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text';
        
        console.log(`✅ Response received: "${responseText}"`);
        return responseText;
    } catch (error) {
        console.error('❌ REST API test failed:', error.message);
        throw error;
    }
}

// Test 3: REST API (streamGenerateContent) with gemini-2.5-flash-live
async function testRESTStreaming() {
    console.log('\n🌊 Test 3: REST API Streaming (streamGenerateContent) with gemini-2.5-flash-live');
    console.log('─'.repeat(60));
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-live:streamGenerateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: TEST_PROMPT }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let responseText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (text) {
                            responseText += text;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }

        console.log(`✅ Response received: "${responseText}"`);
        return responseText;
    } catch (error) {
        console.error('❌ REST Streaming test failed:', error.message);
        throw error;
    }
}

// Run tests
(async () => {
    const results = {
        websocket: null,
        rest: null,
        restStreaming: null
    };

    // Test WebSocket (Node.js doesn't have WebSocket by default, skip in Node)
    if (typeof WebSocket !== 'undefined') {
        try {
            results.websocket = await testWebSocket();
        } catch (error) {
            console.error('WebSocket test error:', error.message);
        }
    } else {
        console.log('⚠️  WebSocket test skipped (WebSocket not available in this environment)');
    }

    // Test REST API
    try {
        results.rest = await testREST();
    } catch (error) {
        console.error('REST test error:', error.message);
    }

    // Test REST Streaming
    try {
        results.restStreaming = await testRESTStreaming();
    } catch (error) {
        console.error('REST Streaming test error:', error.message);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`WebSocket (bidiGenerateContent): ${results.websocket ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`REST (generateContent): ${results.rest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`REST Streaming (streamGenerateContent): ${results.restStreaming ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(60));
})();


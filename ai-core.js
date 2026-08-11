class AICoreSystem {
    constructor() {
        this.engine = null;
        this.webllm = null;
        this.modelId = "Llama-3.1-8B-Instruct-q4f32_1";
        this.isLoaded = false;
        this.isLoading = false;
        this.progressCallback = null;
        this.chatHistory = [];
    }

    async init(onProgress) {
        if (this.isLoaded || this.isLoading) return;

        this.isLoading = true;
        this.progressCallback = onProgress;

        console.log("🤖 AI Core: Initializing Llama-3 Engine...");
        if (onProgress) onProgress({ text: "Initializing WebLLM...", progress: 0.05 });

        try {
            // Check WebGPU support before downloading the optional multi-megabyte WebLLM runtime.
            if (!navigator.gpu) {
                throw new Error("WebGPU not supported on this browser.");
            }
            if (!this.webllm) {
                if (onProgress) onProgress({ text: "Loading optional WebLLM runtime...", progress: 0.08 });
                this.webllm = await import("https://esm.run/@mlc-ai/web-llm");
            }

            this.engine = await this.webllm.CreateMLCEngine(
                this.modelId,
                {
                    initProgressCallback: (report) => {
                        console.log("AI Load:", report.text);
                        if (this.progressCallback) {
                            this.progressCallback(report);
                        }
                    }
                }
            );

            this.isLoaded = true;
            this.isLoading = false;
            console.log("🤖 AI Core: Engine Ready.");
            if (onProgress) onProgress({ text: "AI Ready", progress: 1.0 });

        } catch (err) {
            console.error("🤖 AI Core Error:", err);
            this.isLoading = false;
            if (onProgress) onProgress({ text: "Error: " + err.message, progress: 0 });
            throw err;
        }
    }

    /**
     * Generate a response for an NPC based on their personality and context.
     * @param {string} npcName 
     * @param {string} personality - Description of the NPC
     * @param {string} context - Current situation/memory
     * @param {string} userMessage - What the player said
     */
    async chat(npcName, personality, context, userMessage) {
        if (!this.isLoaded) {
            return "I'm still waking up... (AI Loading)";
        }

        const systemPrompt = `
You are ${npcName}, a colonist in the Exoplanet Pioneer simulation.
Personality: ${personality}
Current Context: ${context}
Constraint: Keep responses concise (under 3 sentences) and immersive. Stay in character.
        `.trim();

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
        ];

        try {
            const reply = await this.engine.chat.completions.create({
                messages,
                temperature: 0.8,
                max_tokens: 150,
            });
            return reply.choices[0].message.content;
        } catch (err) {
            console.error("AI Chat Error:", err);
            return "...";
        }
    }

    /**
     * "Light" decision making (can be expanded)
     */
    async decide(context, options) {
        if (!this.isLoaded) return options[0]; // Fallback

        const prompt = `
Context: ${context}
Options: ${options.join(', ')}
Task: Pick the best option for your survival/success. Reply ONLY with the option text.
         `;

        const reply = await this.engine.chat.completions.create({
            messages: [{ role: "user", content: prompt.trim() }],
            temperature: 0.3, // Deterministic
            max_tokens: 20
        });
        return reply.choices[0].message.content.trim();
    }
}

// Attach to window for the main game loop to access
window.AICoreSystem = AICoreSystem;
window.aiCore = new AICoreSystem();

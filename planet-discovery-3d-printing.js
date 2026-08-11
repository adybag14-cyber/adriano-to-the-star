/**
 * Planet Discovery 3D Printing Models
 * Generate 3D printable models of exoplanets
 */

class PlanetDiscovery3DPrinting {
    constructor() {
        this.models = [];
        this.formats = ['STL', 'OBJ', 'PLY'];
        this.init();
    }

    init() {
        this.loadModels();
        console.log('🖨️ 3D printing models initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry3d_pr_in_ti_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadModels() {
        this.models = [
            {
                id: 'model-1',
                planetName: 'Kepler-186f',
                description: '3D printable model of the first Earth-sized planet in the habitable zone',
                scale: '1:1000000',
                complexity: 'Medium',
                printTime: '4-6 hours',
                material: 'PLA',
                fileSize: '2.5 MB'
            },
            {
                id: 'model-2',
                planetName: 'HD 209458 b',
                description: 'Hot Jupiter exoplanet model',
                scale: '1:500000',
                complexity: 'High',
                printTime: '8-10 hours',
                material: 'PLA/PETG',
                fileSize: '5.2 MB'
            }
        ];
    }

    render3DPrinting(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="3d-printing-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🖨️ 3D Printing Models</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <p style="opacity: 0.9; line-height: 1.8; margin-bottom: 1rem;">
                        Download 3D printable models of exoplanets. Models are optimized for 3D printing and available in multiple formats.
                    </p>
                    <button id="generate-model-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                        🎨 Generate Custom Model
                    </button>
                </div>
                
                <div class="models-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
        `;

        this.models.forEach(model => {
            html += this.createModelCard(model);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.models.forEach(model => {
            const card = document.querySelector(`[data-model-id="${model.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showModelDetails(model.id);
                });
            }
        });

        document.getElementById('generate-model-btn')?.addEventListener('click', () => {
            this.showGenerateModelForm();
        });
    }

    createModelCard(model) {
        return `
            <div class="model-card" data-model-id="${model.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🖨️</div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${model.planetName}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${model.description}</p>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.85rem; opacity: 0.7; margin-bottom: 1rem;">
                        <div>Scale: ${model.scale}</div>
                        <div>Complexity: ${model.complexity}</div>
                        <div>Print Time: ${model.printTime}</div>
                        <div>Material: ${model.material}</div>
                    </div>
                    <button style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        Download Model
                    </button>
                </div>
            </div>
        `;
    }

    showModelDetails(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) return;

        const modal = document.createElement('div');
        modal.id = 'model-details-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        modal.innerHTML = `
            <div style="max-width: 700px; width: 100%; background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🖨️</div>
                    <h2 style="color: #ba944f; margin-bottom: 0.5rem;">${model.planetName}</h2>
                    <p style="opacity: 0.8;">${model.description}</p>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin-bottom: 1rem;">Model Specifications</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <span style="opacity: 0.7;">Scale:</span>
                            <div style="color: #ba944f; font-weight: 600;">${model.scale}</div>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">Complexity:</span>
                            <div style="color: #ba944f; font-weight: 600;">${model.complexity}</div>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">Print Time:</span>
                            <div style="color: #ba944f; font-weight: 600;">${model.printTime}</div>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">Material:</span>
                            <div style="color: #ba944f; font-weight: 600;">${model.material}</div>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">File Size:</span>
                            <div style="color: #ba944f; font-weight: 600;">${model.fileSize}</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin-bottom: 1rem;">Download Format</h4>
                    <div style="display: flex; gap: 1rem;">
                        ${this.formats.map(format => `
                            <button class="format-btn" data-format="${format}" style="flex: 1; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                                ${format}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button id="close-model-modal" style="flex: 1; padding: 0.75rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-model-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.downloadModel(model.id, e.target.dataset.format);
            });
        });
    }

    downloadModel(modelId, format) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) return;

        alert(`Downloading ${model.planetName} model in ${format} format...`);
        // Would generate and download actual 3D model file
    }

    showGenerateModelForm() {
        alert('Custom 3D model generator coming soon!');
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscovery3DPrinting = new PlanetDiscovery3DPrinting();
}


/**
 * Planet Discovery Citation Manager
 * Manage and organize citations for research papers
 */

class PlanetDiscoveryCitationManager {
    constructor() {
        this.citations = [];
        this.collections = [];
        this.init();
    }

    init() {
        this.loadCitations();
        this.loadCollections();
        console.log('📋 Citation manager initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ci_ta_ti_on_ma_na_ge_r_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadCitations() {
        // Load from localStorage or Supabase
        try {
            const saved = localStorage.getItem('citations');
            if (saved) {
                this.citations = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading citations:', error);
        }
    }

    loadCollections() {
        this.collections = [
            { id: 'all', name: 'All Citations', count: 0 },
            { id: 'favorites', name: 'Favorites', count: 0 },
            { id: 'habitable-zones', name: 'Habitable Zones', count: 0 }
        ];
    }

    saveCitations() {
        try {
            localStorage.setItem('citations', JSON.stringify(this.citations));
        } catch (error) {
            console.error('Error saving citations:', error);
        }
    }

    renderCitationManager(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="citation-manager-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">📋 Citation Manager</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
                        <input type="text" id="citation-search" placeholder="Search citations..." style="flex: 1; min-width: 200px; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                        <button id="add-citation-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            ➕ Add Citation
                        </button>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        ${this.collections.map(collection => `
                            <button class="collection-btn" data-collection="${collection.id}" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                                ${collection.name} (${collection.count})
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div id="citations-list" class="citations-list" style="display: flex; flex-direction: column; gap: 1rem;">
        `;

        if (this.citations.length === 0) {
            html += `
                <div style="text-align: center; padding: 4rem; background: rgba(0, 0, 0, 0.5); border-radius: 15px; color: rgba(255, 255, 255, 0.7);">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📋</div>
                    <p>No citations yet. Add your first citation!</p>
                </div>
            `;
        } else {
            this.citations.forEach(citation => {
                html += this.createCitationCard(citation);
            });
        }

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        document.getElementById('add-citation-btn')?.addEventListener('click', () => {
            this.showAddCitationForm();
        });

        document.getElementById('citation-search')?.addEventListener('input', (e) => {
            this.searchCitations(e.target.value);
        });

        document.querySelectorAll('.collection-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByCollection(e.target.dataset.collection);
            });
        });
    }

    createCitationCard(citation) {
        return `
            <div class="citation-card" data-citation-id="${citation.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${citation.title}</h4>
                        <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 0.5rem;">${citation.authors}</p>
                        <p style="opacity: 0.7; font-size: 0.85rem;">${citation.year} • ${citation.journal}</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="copy-citation-btn" data-citation-id="${citation.id}" style="padding: 0.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 8px; color: #4ade80; cursor: pointer;">
                            📋
                        </button>
                        <button class="delete-citation-btn" data-citation-id="${citation.id}" style="padding: 0.5rem; background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 8px; color: #f87171; cursor: pointer;">
                            🗑️
                        </button>
                    </div>
                </div>
                <div style="padding: 0.75rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px; font-size: 0.85rem; opacity: 0.8; font-family: monospace;">
                    ${citation.citation}
                </div>
            </div>
        `;
    }

    showAddCitationForm() {
        const formModal = document.createElement('div');
        formModal.id = 'add-citation-modal';
        formModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            overflow-y: auto;
            padding: 2rem;
        `;

        formModal.innerHTML = `
            <div style="max-width: 700px; margin: 0 auto;">
                <h3 style="color: #ba944f; margin-bottom: 2rem;">Add Citation</h3>
                
                <form id="citation-form" style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Title</label>
                        <input type="text" id="citation-title" required style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Authors</label>
                        <input type="text" id="citation-authors" required placeholder="Author 1, Author 2, ..." style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Year</label>
                        <input type="number" id="citation-year" required min="1900" max="2100" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Journal</label>
                        <input type="text" id="citation-journal" required style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">DOI (optional)</label>
                        <input type="text" id="citation-doi" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" style="flex: 1; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            Add Citation
                        </button>
                        <button type="button" id="cancel-citation-btn" style="flex: 1; padding: 0.75rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(formModal);

        document.getElementById('citation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCitation();
            formModal.remove();
        });

        document.getElementById('cancel-citation-btn').addEventListener('click', () => {
            formModal.remove();
        });
    }

    addCitation() {
        const title = document.getElementById('citation-title').value;
        const authors = document.getElementById('citation-authors').value;
        const year = parseInt(document.getElementById('citation-year').value);
        const journal = document.getElementById('citation-journal').value;
        const doi = document.getElementById('citation-doi').value;

        const citation = `${authors} (${year}). ${title}. ${journal}.${doi ? ` DOI: ${doi}` : ''}`;

        const newCitation = {
            id: Date.now().toString(),
            title,
            authors,
            year,
            journal,
            doi,
            citation,
            createdAt: new Date().toISOString()
        };

        this.citations.push(newCitation);
        this.saveCitations();
        this.renderCitationManager('citation-manager-container');
    }

    searchCitations(query) {
        const filtered = this.citations.filter(citation => 
            citation.title.toLowerCase().includes(query.toLowerCase()) ||
            citation.authors.toLowerCase().includes(query.toLowerCase()) ||
            citation.citation.toLowerCase().includes(query.toLowerCase())
        );
        this.renderFilteredCitations(filtered);
    }

    filterByCollection(collectionId) {
        // Filter logic would go here
        this.renderCitationManager('citation-manager-container');
    }

    renderFilteredCitations(citations) {
        const container = document.getElementById('citations-list');
        if (!container) return;

        if (citations.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.7);">
                    No citations found
                </div>
            `;
            return;
        }

        container.innerHTML = citations.map(citation => this.createCitationCard(citation)).join('');

        // Re-attach event listeners
        citations.forEach(citation => {
            document.querySelector(`[data-citation-id="${citation.id}"] .copy-citation-btn`)?.addEventListener('click', () => {
                this.copyCitation(citation);
            });
            document.querySelector(`[data-citation-id="${citation.id}"] .delete-citation-btn`)?.addEventListener('click', () => {
                this.deleteCitation(citation.id);
            });
        });
    }

    copyCitation(citation) {
        const textarea = document.createElement('textarea');
        textarea.value = citation.citation;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Citation copied to clipboard!');
    }

    deleteCitation(citationId) {
        if (confirm('Are you sure you want to delete this citation?')) {
            this.citations = this.citations.filter(c => c.id !== citationId);
            this.saveCitations();
            this.renderCitationManager('citation-manager-container');
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryCitationManager = new PlanetDiscoveryCitationManager();
}


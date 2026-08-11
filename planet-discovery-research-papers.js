/**
 * Planet Discovery Research Paper Database
 * Database of research papers on exoplanet discovery
 */

class PlanetDiscoveryResearchPapers {
    constructor() {
        this.papers = [];
        this.filters = {
            year: null,
            topic: null,
            author: null
        };
        this.init();
    }

    init() {
        this.loadPapers();
        console.log('📚 Research paper database initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_re_se_ar_ch_pa_pe_rs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadPapers() {
        this.papers = [
            {
                id: 'paper-1',
                title: 'Kepler Mission: Discovery of Earth-Sized Planets in the Habitable Zone',
                authors: ['Dr. Sarah Johnson', 'Prof. Michael Chen'],
                year: 2023,
                journal: 'Astrophysical Journal',
                abstract: 'We present the discovery of five Earth-sized planets in the habitable zone of their host stars...',
                topics: ['Habitable Zones', 'Kepler Mission', 'Earth-Sized Planets'],
                citations: 245,
                pdfUrl: null,
                doi: '10.1234/astro.2023.001'
            },
            {
                id: 'paper-2',
                title: 'Transit Photometry: Advanced Detection Methods',
                authors: ['Dr. Emily Rodriguez'],
                year: 2024,
                journal: 'Nature Astronomy',
                abstract: 'This paper presents novel methods for detecting exoplanets using transit photometry...',
                topics: ['Transit Method', 'Photometry', 'Detection'],
                citations: 189,
                pdfUrl: null,
                doi: '10.1234/nat.2024.002'
            },
            {
                id: 'paper-3',
                title: 'Atmospheric Composition of Hot Jupiters',
                authors: ['Dr. James Wilson', 'Dr. Lisa Anderson'],
                year: 2023,
                journal: 'Science',
                abstract: 'Analysis of atmospheric spectra from hot Jupiter exoplanets reveals...',
                topics: ['Hot Jupiters', 'Atmospheres', 'Spectroscopy'],
                citations: 312,
                pdfUrl: null,
                doi: '10.1234/sci.2023.003'
            }
        ];
    }

    renderPapers(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="research-papers-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">📚 Research Paper Database</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <input type="text" id="paper-search" placeholder="Search papers..." style="flex: 1; min-width: 200px; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                        <select id="year-filter" style="padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                            <option value="all">All Years</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                            <option value="2022">2022</option>
                        </select>
                        <select id="topic-filter" style="padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                            <option value="all">All Topics</option>
                            <option value="Habitable Zones">Habitable Zones</option>
                            <option value="Transit Method">Transit Method</option>
                            <option value="Hot Jupiters">Hot Jupiters</option>
                        </select>
                    </div>
                </div>
                
                <div class="papers-list" style="display: flex; flex-direction: column; gap: 1.5rem;">
        `;

        this.papers.forEach(paper => {
            html += this.createPaperCard(paper);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.papers.forEach(paper => {
            const card = document.querySelector(`[data-paper-id="${paper.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showPaperDetails(paper.id);
                });
            }
        });

        document.getElementById('paper-search')?.addEventListener('input', (e) => {
            this.filterPapers(e.target.value);
        });

        document.getElementById('year-filter')?.addEventListener('change', (e) => {
            this.filterByYear(e.target.value);
        });

        document.getElementById('topic-filter')?.addEventListener('change', (e) => {
            this.filterByTopic(e.target.value);
        });
    }

    createPaperCard(paper) {
        return `
            <div class="paper-card" data-paper-id="${paper.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${paper.title}</h4>
                <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 0.5rem;">${paper.authors.join(', ')}</p>
                <p style="opacity: 0.7; font-size: 0.85rem; margin-bottom: 1rem;">
                    <span>📖 ${paper.journal}</span> • 
                    <span>📅 ${paper.year}</span> • 
                    <span>📊 ${paper.citations} citations</span>
                </p>
                <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.6;">${paper.abstract.substring(0, 200)}...</p>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${paper.topics.map(topic => `
                        <span style="background: rgba(186, 148, 79, 0.2); padding: 0.25rem 0.5rem; border-radius: 5px; font-size: 0.75rem; color: #ba944f;">${topic}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    showPaperDetails(paperId) {
        const paper = this.papers.find(p => p.id === paperId);
        if (!paper) return;

        const modal = document.createElement('div');
        modal.id = 'paper-details-modal';
        modal.style.cssText = `
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

        modal.innerHTML = `
            <div style="max-width: 900px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
                    <div style="flex: 1;">
                        <h2 style="color: #ba944f; margin-bottom: 1rem;">${paper.title}</h2>
                        <p style="opacity: 0.8; font-size: 1.1rem; margin-bottom: 0.5rem;">${paper.authors.join(', ')}</p>
                        <p style="opacity: 0.7; font-size: 0.9rem;">
                            ${paper.journal} • ${paper.year} • DOI: ${paper.doi}
                        </p>
                    </div>
                    <button id="close-paper-modal" style="background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Abstract</h4>
                        <p style="opacity: 0.9; line-height: 1.8;">${paper.abstract}</p>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Topics</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${paper.topics.map(topic => `
                                <span style="background: rgba(186, 148, 79, 0.2); padding: 0.5rem 1rem; border-radius: 8px; color: #ba944f;">${topic}</span>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="opacity: 0.7;">Citations:</span>
                            <span style="color: #ba944f; font-weight: 600;">${paper.citations}</span>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button id="download-paper-btn" style="flex: 1; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            📥 Download PDF
                        </button>
                        <button id="cite-paper-btn" style="flex: 1; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            📋 Cite Paper
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-paper-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('download-paper-btn')?.addEventListener('click', () => {
            if (paper.pdfUrl) {
                window.open(paper.pdfUrl, '_blank');
            } else {
                alert('PDF not available yet');
            }
        });

        document.getElementById('cite-paper-btn')?.addEventListener('click', () => {
            this.showCitation(paper);
        });
    }

    showCitation(paper) {
        const citation = `${paper.authors.join(', ')} (${paper.year}). ${paper.title}. ${paper.journal}. DOI: ${paper.doi}`;
        
        const citationModal = document.createElement('div');
        citationModal.id = 'citation-modal';
        citationModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        citationModal.innerHTML = `
            <div style="max-width: 600px; width: 100%; background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">Citation</h3>
                <textarea id="citation-text" readonly style="width: 100%; padding: 1rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white; font-size: 0.9rem; min-height: 100px; resize: vertical;">${citation}</textarea>
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button id="copy-citation-btn" style="flex: 1; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                        📋 Copy Citation
                    </button>
                    <button id="close-citation-modal" style="flex: 1; padding: 0.75rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(citationModal);

        document.getElementById('copy-citation-btn')?.addEventListener('click', () => {
            const textarea = document.getElementById('citation-text');
            textarea.select();
            document.execCommand('copy');
            alert('Citation copied to clipboard!');
        });

        document.getElementById('close-citation-modal')?.addEventListener('click', () => {
            citationModal.remove();
        });
    }

    filterPapers(query) {
        const filtered = this.papers.filter(paper => 
            paper.title.toLowerCase().includes(query.toLowerCase()) ||
            paper.authors.some(author => author.toLowerCase().includes(query.toLowerCase())) ||
            paper.abstract.toLowerCase().includes(query.toLowerCase())
        );
        this.renderFilteredPapers(filtered);
    }

    filterByYear(year) {
        if (year === 'all') {
            this.renderFilteredPapers(this.papers);
        } else {
            const filtered = this.papers.filter(paper => paper.year === parseInt(year));
            this.renderFilteredPapers(filtered);
        }
    }

    filterByTopic(topic) {
        if (topic === 'all') {
            this.renderFilteredPapers(this.papers);
        } else {
            const filtered = this.papers.filter(paper => paper.topics.includes(topic));
            this.renderFilteredPapers(filtered);
        }
    }

    renderFilteredPapers(papers) {
        const container = document.querySelector('.papers-list');
        if (!container) return;

        container.innerHTML = papers.map(paper => this.createPaperCard(paper)).join('');

        papers.forEach(paper => {
            const card = document.querySelector(`[data-paper-id="${paper.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showPaperDetails(paper.id);
                });
            }
        });
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryResearchPapers = new PlanetDiscoveryResearchPapers();
}


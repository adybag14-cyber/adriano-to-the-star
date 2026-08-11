/**
 * Semantic Search Capabilities
 * Semantic search implementation
 */
(function() {
    'use strict';

    class SemanticSearchCapabilities {
        constructor() {
            this.index = new Map();
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('semantic-search')) {
                const search = document.createElement('div');
                search.id = 'semantic-search';
                search.className = 'semantic-search';
                search.innerHTML = `
                    <input type="text" id="semantic-query" placeholder="Search by meaning..." />
                    <div id="semantic-results"></div>
                `;
                document.body.appendChild(search);
            }
        }

        indexDocument(id, content) {
            const tokens = this.tokenize(content);
            const concepts = this.extractConcepts(tokens);
            this.index.set(id, {
                id: id,
                content: content,
                tokens: tokens,
                concepts: concepts
            });
        }

        tokenize(text) {
            return text.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 2);
        }

        extractConcepts(tokens) {
            // Extract semantic concepts (simplified)
            return tokens.filter(token => token.length > 4);
        }

        async search(query) {
            const queryTokens = this.tokenize(query);
            const queryConcepts = this.extractConcepts(queryTokens);
            const results = [];

            this.index.forEach((doc, id) => {
                const score = this.calculateSemanticScore(queryConcepts, doc.concepts);
                if (score > 0) {
                    results.push({
                        id: id,
                        content: doc.content,
                        score: score
                    });
                }
            });

            return results.sort((a, b) => b.score - a.score);
        }

        calculateSemanticScore(queryConcepts, docConcepts) {
            let matches = 0;
            queryConcepts.forEach(concept => {
                if (docConcepts.includes(concept)) {
                    matches++;
                }
            });
            return matches / queryConcepts.length;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.semanticSearch = new SemanticSearchCapabilities();
        });
    } else {
        window.semanticSearch = new SemanticSearchCapabilities();
    }
})();


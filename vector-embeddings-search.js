/**
 * Advanced Search with Vector Embeddings
 * Semantic search using embeddings
 */
(function() {
    'use strict';

    class VectorEmbeddingsSearch {
        constructor() {
            this.embeddings = new Map();
            this.index = null;
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('vector-search')) {
                const search = document.createElement('div');
                search.id = 'vector-search';
                search.className = 'vector-search';
                search.innerHTML = `
                    <input type="text" id="vector-search-input" placeholder="Search semantically..." />
                    <button id="vector-search-btn">Search</button>
                    <div id="vector-results"></div>
                `;
                document.body.appendChild(search);
            }
        }

        async generateEmbedding(text) {
            // Generate embedding (would use ML model in production)
            // Simplified: create a hash-based vector
            const vector = new Array(128).fill(0);
            for (let i = 0; i < text.length; i++) {
                vector[i % 128] += text.charCodeAt(i);
            }
            // Normalize
            const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
            return vector.map(val => val / magnitude);
        }

        async indexDocument(id, text) {
            const embedding = await this.generateEmbedding(text);
            this.embeddings.set(id, {
                id: id,
                text: text,
                embedding: embedding
            });
        }

        async search(query, topK = 10) {
            const queryEmbedding = await this.generateEmbedding(query);
            const results = [];

            this.embeddings.forEach((doc, id) => {
                const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
                results.push({
                    id: id,
                    text: doc.text,
                    similarity: similarity
                });
            });

            return results
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, topK);
        }

        cosineSimilarity(vec1, vec2) {
            let dotProduct = 0;
            let magnitude1 = 0;
            let magnitude2 = 0;

            for (let i = 0; i < vec1.length; i++) {
                dotProduct += vec1[i] * vec2[i];
                magnitude1 += vec1[i] * vec1[i];
                magnitude2 += vec2[i] * vec2[i];
            }

            return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.vectorSearch = new VectorEmbeddingsSearch();
        });
    } else {
        window.vectorSearch = new VectorEmbeddingsSearch();
    }
})();


/**
 * Topic Modeling System
 * Model topics in text data
 */
(function() {
    'use strict';

    class TopicModelingSystem {
        constructor() {
            this.topics = [];
            this.documents = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('topic-modeling')) {
                const modeling = document.createElement('div');
                modeling.id = 'topic-modeling';
                modeling.className = 'topic-modeling';
                modeling.innerHTML = `<h2>Topic Modeling</h2>`;
                document.body.appendChild(modeling);
            }
        }

        addDocument(doc) {
            this.documents.push({
                id: this.generateId(),
                text: doc.text,
                topics: []
            });
        }

        modelTopics(numTopics = 5) {
            // Simple topic modeling (would use LDA or other algorithms in production)
            const words = this.extractWords();
            const topics = this.generateTopics(words, numTopics);
            this.topics = topics;
            this.assignTopicsToDocuments();
            return topics;
        }

        extractWords() {
            const allWords = [];
            this.documents.forEach(doc => {
                const words = doc.text.toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .split(/\s+/)
                    .filter(w => w.length > 3);
                allWords.push(...words);
            });
            return allWords;
        }

        generateTopics(words, numTopics) {
            const topics = [];
            const wordFreq = {};
            words.forEach(word => {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            });

            const sortedWords = Object.entries(wordFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, numTopics * 10);

            for (let i = 0; i < numTopics; i++) {
                const topicWords = sortedWords
                    .slice(i * 10, (i + 1) * 10)
                    .map(([word]) => word);
                topics.push({
                    id: i + 1,
                    words: topicWords,
                    name: `Topic ${i + 1}`
                });
            }

            return topics;
        }

        assignTopicsToDocuments() {
            this.documents.forEach(doc => {
                doc.topics = this.topics.map(topic => ({
                    topic: topic.id,
                    score: this.calculateTopicScore(doc.text, topic)
                })).sort((a, b) => b.score - a.score);
            });
        }

        calculateTopicScore(text, topic) {
            const textWords = text.toLowerCase().split(/\s+/);
            const matches = topic.words.filter(word => textWords.includes(word)).length;
            return matches / topic.words.length;
        }

        generateId() {
            return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.topicModeling = new TopicModelingSystem();
        });
    } else {
        window.topicModeling = new TopicModelingSystem();
    }
})();


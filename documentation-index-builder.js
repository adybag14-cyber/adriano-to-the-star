class DocumentationIndexBuilder {
    constructor() {
        this.index = [];
    }
    addDoc(id, title, content, keywords = []) {
        this.index.push({ id, title, content, keywords });
        return id;
    }
    buildSearch(query) {
        const q = (query || '').toLowerCase();
        return this.index.filter(i => `${i.title} ${i.content} ${i.keywords.join(' ')}`.toLowerCase().includes(q));
    }
    clear() {
        this.index = [];
    }
}
const documentationIndexBuilder = new DocumentationIndexBuilder();
if (typeof window !== 'undefined') {
    window.documentationIndexBuilder = documentationIndexBuilder;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentationIndexBuilder;
}

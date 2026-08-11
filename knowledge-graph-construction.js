/**
 * Knowledge Graph Construction
 * Build knowledge graphs
 */
(function() {
    'use strict';

    class KnowledgeGraphConstruction {
        constructor() {
            this.graph = { nodes: [], edges: [] };
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('knowledge-graph')) {
                const graph = document.createElement('div');
                graph.id = 'knowledge-graph';
                graph.className = 'knowledge-graph';
                graph.innerHTML = `<h2>Knowledge Graph</h2>`;
                document.body.appendChild(graph);
            }
        }

        addEntity(entity) {
            const node = {
                id: entity.id,
                label: entity.label,
                type: entity.type,
                properties: entity.properties || {}
            };
            this.graph.nodes.push(node);
            return node;
        }

        addRelationship(sourceId, targetId, relationship) {
            const edge = {
                id: this.generateId(),
                source: sourceId,
                target: targetId,
                type: relationship.type,
                properties: relationship.properties || {}
            };
            this.graph.edges.push(edge);
            return edge;
        }

        queryGraph(query) {
            // Graph query (simplified)
            if (query.type === 'find_related') {
                return this.findRelated(query.entityId, query.depth || 1);
            } else if (query.type === 'path') {
                return this.findPath(query.source, query.target);
            }
            return [];
        }

        findRelated(entityId, depth) {
            const related = [];
            const visited = new Set([entityId]);
            let currentLevel = [entityId];

            for (let i = 0; i < depth; i++) {
                const nextLevel = [];
                currentLevel.forEach(id => {
                    this.graph.edges
                        .filter(e => e.source === id || e.target === id)
                        .forEach(edge => {
                            const neighbor = edge.source === id ? edge.target : edge.source;
                            if (!visited.has(neighbor)) {
                                visited.add(neighbor);
                                nextLevel.push(neighbor);
                                related.push({
                                    entity: this.graph.nodes.find(n => n.id === neighbor),
                                    relationship: edge
                                });
                            }
                        });
                });
                currentLevel = nextLevel;
            }

            return related;
        }

        findPath(source, target) {
            // Simple path finding
            const path = [source];
            const edge = this.graph.edges.find(e => 
                (e.source === source && e.target === target) ||
                (e.source === target && e.target === source)
            );
            if (edge) {
                path.push(target);
            }
            return path;
        }

        generateId() {
            return 'kg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.knowledgeGraph = new KnowledgeGraphConstruction();
        });
    } else {
        window.knowledgeGraph = new KnowledgeGraphConstruction();
    }
})();


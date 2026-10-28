"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynthesisManager = void 0;
const types_1 = require("./types");
const GraphStore_1 = require("../store/GraphStore");
class SynthesisManager {
    store;
    constructor(store) {
        this.store = store;
    }
    /**
     * Integrates a set of new triples into the graph,
     * automatically creating nodes and detecting conflicts.
     */
    async integrateKnowledge(triples) {
        console.log(`🧬 Integrating ${triples.length} new triples into the knowledge graph...`);
        for (const triple of triples) {
            // 1. Ensure Nodes exist
            this.ensureNode(triple.subject, 'CONCEPT'); // Simplified type for MVP
            this.ensureNode(triple.object, 'CONCEPT');
            // 2. Check for contradictions before adding
            const conflict = this.detectConflict(triple);
            if (conflict) {
                console.log(`⚠️  Conflict detected for ${triple.subject}: ${conflict.predicate}!`);
                // We still add the edge, but we could mark it as 'contested'
            }
            // 3. Add the edge
            this.store.addEdge({
                id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                source: triple.subject,
                target: triple.object,
                relation: triple.predicate,
                provenance: triple.provenance,
                confidence: triple.confidence,
                timestamp: Date.now()
            });
        }
        this.store.save();
    }
    ensureNode(label, type) {
        const existing = this.store.findNodesByLabel(label);
        if (existing.length === 0) {
            this.store.addNode({
                id: label.toLowerCase().replace(/\s+/g, '_'),
                label,
                type,
                properties: {}
            });
        }
    }
    detectConflict(triple) {
        const existingEdges = this.store.getEdgesForNode(triple.subject);
        for (const edge of existingEdges) {
            // If we have the same predicate but a different target (object), it's a potential conflict
            // e.g., (X, is_superconductor, True) vs (X, is_superconductor, False)
            if (edge.relation === triple.predicate && edge.target !== triple.object) {
                return {
                    predicate: triple.predicate,
                    claimA: { value: edge.target, provenance: edge.provenance },
                    claimB: { value: triple.object, provenance: triple.provenance },
                    conflictType: 'value_mismatch'
                };
            }
        }
        return null;
    }
    /**
     * Generates a synthesis report for a specific entity.
     */
    generateReport(entityLabel) {
        const node = this.store.findNodesByLabel(entityLabel)[0];
        if (!node)
            throw new Error(`Entity ${entityLabel} not found in graph.`);
        const edges = this.store.getEdgesForNode(node.id);
        const consensus = [];
        const contradictions = [];
        const predicateMap = {};
        // Group edges by predicate
        edges.forEach(e => {
            const pred = e.relation;
            if (!predicateMap[pred])
                predicateMap[pred] = [];
            predicateMap[pred].push(e);
        });
        // Analyze each predicate for consensus or conflict
        for (const [predicate, relatedEdges] of Object.entries(predicateMap)) {
            const values = new Set(relatedEdges.map(e => e.target));
            if (values.size === 1) {
                const val = Array.from(values)[0];
                consensus.push(`${predicate}: ${val}`);
            }
            else {
                // We have multiple values for the same predicate -> Contradiction!
                const sorted = relatedEdges.sort((a, b) => b.confidence - a.confidence);
                contradictions.push({
                    predicate,
                    claimA: { value: sorted[0].target, provenance: sorted[0].provenance },
                    claimB: { value: sorted[1].target, provenance: sorted[1].provenance },
                    conflictType: 'value_mismatch'
                });
            }
        }
        return {
            entity: entityLabel,
            consensus,
            contradictions,
            overallConfidence: edges.length > 0 ? edges.reduce((acc, e) => acc + e.confidence, 0) / edges.length : 0
        };
    }
}
exports.SynthesisManager = SynthesisManager;
//# sourceMappingURL=SynthesisManager.js.map
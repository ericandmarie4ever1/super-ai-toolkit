import { KnowledgeTriple } from './types';
import { GraphStore } from '../store/GraphStore';
export interface SynthesisReport {
    entity: string;
    consensus: string[];
    contradictions: Contradiction[];
    overallConfidence: number;
}
export interface Contradiction {
    predicate: string;
    claimA: {
        value: string;
        provenance: any;
    };
    claimB: {
        value: string;
        provenance: any;
    };
    conflictType: 'direct_negation' | 'value_mismatch';
}
export declare class SynthesisManager {
    private store;
    constructor(store: GraphStore);
    /**
     * Integrates a set of new triples into the graph,
     * automatically creating nodes and detecting conflicts.
     */
    integrateKnowledge(triples: KnowledgeTriple[]): Promise<void>;
    private ensureNode;
    private detectConflict;
    /**
     * Generates a synthesis report for a specific entity.
     */
    generateReport(entityLabel: string): SynthesisReport;
}
//# sourceMappingURL=SynthesisManager.d.ts.map
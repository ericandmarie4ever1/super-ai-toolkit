import { Node, Edge, KnowledgeTriple, EntityType } from './types';
import { GraphStore } from '../store/GraphStore';

export interface SynthesisReport {
  entity: string;
  consensus: string[];
  contradictions: Contradiction[];
  overallConfidence: number;
}

export interface Contradiction {
  predicate: string;
  claimA: { value: string; provenance: any };
  claimB: { value: string; provenance: any };
  conflictType: 'direct_negation' | 'value_mismatch';
}

export class SynthesisManager {
  constructor(private store: GraphStore) {}

  async integrateKnowledge(triples: KnowledgeTriple[]) {
    console.log(`🧬 Integrating ${triples.length} new triples into the knowledge graph...`);

    for (const triple of triples) {
      this.store.ensureNode(triple.subject, 'CONCEPT');
      this.store.ensureNode(triple.object, 'CONCEPT');

      const conflict = this.detectConflict(triple);
      if (conflict) {
        console.log(`⚠️  Conflict detected for ${triple.subject}: ${conflict.predicate}!`);
      }

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

  private detectConflict(triple: KnowledgeTriple): Contradiction | null {
    const existingEdges = this.store.getEdgesForNode(triple.subject);
    for (const edge of existingEdges) {
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

  generateReport(entityLabel: string): SynthesisReport {
    const node = this.store.findNodesByLabel(entityLabel)[0];
    if (!node) throw new Error(`Entity ${entityLabel} not found in graph.`);

    const edges = this.store.getEdgesForNode(node.id);
    const consensus: string[] = [];
    const contradictions: Contradiction[] = [];
    const predicateMap: Record<string, Edge[]> = {};

    edges.forEach(e => {
      const pred = e.relation;
      if (!predicateMap[pred]) predicateMap[pred] = [];
      predicateMap[pred].push(e);
    });

    for (const [predicate, relatedEdges] of Object.entries(predicateMap)) {
      const values = new Set(relatedEdges.map(e => e.target));
      if (values.size === 1) {
        const val = Array.from(values)[0];
        consensus.push(`${predicate}: ${val}`);
      } else {
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

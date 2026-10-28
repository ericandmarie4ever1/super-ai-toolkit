import { Node, Edge, KnowledgeTriple, SynthesisGraph, EntityType } from '../core/types';
import * as fs from 'fs';
import * as path from 'path';

export class GraphStore {
  private storagePath: string;
  private graph: SynthesisGraph = {
    nodes: new Map(),
    edges: []
  };

  constructor(storagePath: string = './graph_data.json') {
    this.storagePath = path.resolve(storagePath);
    this.load();
  }

  private load() {
    if (fs.existsSync(this.storagePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
        this.graph.edges = data.edges || [];
        if (data.nodes) {
          Object.entries(data.nodes).forEach(([id, node]) => {
            this.graph.nodes.set(id, node as Node);
          });
        }
      } catch (e) {
        console.error("Error loading graph store:", e);
      }
    }
  }

  public save() {
    const data = {
      nodes: Object.fromEntries(this.graph.nodes),
      edges: this.graph.edges
    };
    fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
  }

  public addNode(node: Node) {
    this.graph.nodes.set(node.id, node);
  }

  public addEdge(edge: Edge) {
    this.graph.edges.push(edge);
  }

  public findNode(id: string): Node | undefined {
    return this.graph.nodes.get(id);
  }

  public findNodesByLabel(label: string): Node[] {
    return Array.from(this.graph.nodes.values()).filter(n => n.label.toLowerCase() === label.toLowerCase());
  }

  public getEdgesForNode(nodeId: string): Edge[] {
    return this.graph.edges.filter(e => e.source === nodeId || e.target === nodeId);
  }

  public getAllEdges(): Edge[] {
    return this.graph.edges;
  }

  public getAllNodes(): Node[] {
    return Array.from(this.graph.nodes.values());
  }

  public ensureNode(label: string, type: EntityType) {
    const forbiddenLabels = ['true', 'false', 'yes', 'no', 'unknown', 'null'];
    if (forbiddenLabels.includes(label.toLowerCase())) {
      return;
    }

    const existing = this.findNodesByLabel(label);
    if (existing.length === 0) {
      this.addNode({
        id: label.toLowerCase().replace(/\s+/g, '_'),
        label,
        type,
        properties: {}
      });
    }
  }
}

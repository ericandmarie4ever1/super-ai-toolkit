import { Node, Edge } from './types';
export declare class GraphStore {
    private storagePath;
    private graph;
    constructor(storagePath?: string);
    private load;
    save(): void;
    addNode(node: Node): void;
    addEdge(edge: Edge): void;
    findNode(id: string): Node | undefined;
    findNodesByLabel(label: string): Node[];
    getEdgesForNode(nodeId: string): Edge[];
    getAllEdges(): Edge[];
    getAllNodes(): Node[];
}
//# sourceMappingURL=GraphStore.d.ts.map
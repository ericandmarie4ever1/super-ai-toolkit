"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphStore = void 0;
const types_1 = require("./types");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class GraphStore {
    storagePath;
    graph = {
        nodes: new Map(),
        edges: []
    };
    constructor(storagePath = './graph_data.json') {
        this.storagePath = path.resolve(storagePath);
        this.load();
    }
    load() {
        if (fs.existsSync(this.storagePath)) {
            const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
            this.graph.edges = data.edges || [];
            // Map needs to be reconstructed from the array in JSON
            if (data.nodes) {
                Object.entries(data.nodes).forEach(([id, node]) => {
                    this.graph.nodes.set(id, node);
                });
            }
        }
    }
    save() {
        const data = {
            nodes: Object.fromEntries(this.graph.nodes),
            edges: this.graph.edges
        };
        fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    }
    addNode(node) {
        this.graph.nodes.set(node.id, node);
    }
    addEdge(edge) {
        this.graph.edges.push(edge);
    }
    findNode(id) {
        return this.graph.nodes.get(id);
    }
    findNodesByLabel(label) {
        return Array.from(this.graph.nodes.values()).filter(n => n.label.toLowerCase() === label.toLowerCase());
    }
    getEdgesForNode(nodeId) {
        return this.graph.edges.filter(e => e.source === nodeId || e.target === nodeId);
    }
    getAllEdges() {
        return this.graph.edges;
    }
    getAllNodes() {
        return Array.from(this.graph.nodes.values());
    }
}
exports.GraphStore = GraphStore;
//# sourceMappingURL=GraphStore.js.map
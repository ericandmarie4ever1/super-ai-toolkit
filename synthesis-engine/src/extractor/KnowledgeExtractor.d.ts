import { KnowledgeTriple } from '../core/types';
export declare class KnowledgeExtractor {
    private apiKey;
    private model;
    constructor(apiKey: string, model?: string);
    extractTriples(text: string, sourceUrl: string, sourceName: string): Promise<KnowledgeTriple[]>;
}
//# sourceMappingURL=KnowledgeExtractor.d.ts.map
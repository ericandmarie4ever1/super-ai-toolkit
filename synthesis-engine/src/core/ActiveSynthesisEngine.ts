import { GraphStore } from '../store/GraphStore';
import { KnowledgeExtractor } from '../extractor/KnowledgeExtractor';
import { SynthesisManager } from '../core/SynthesisManager';
import { SynthesisWatcher } from '../core/SynthesisWatcher';
import { QueryGenerator } from '../core/QueryGenerator';
import { WebSearchTool } from '../connectors/WebSearchTool';

export class ActiveSynthesisEngine {
  constructor(
    private store: GraphStore,
    private extractor: KnowledgeExtractor,
    private manager: SynthesisManager,
    private watcher: SynthesisWatcher,
    private queryGenerator: QueryGenerator,
    private searchTool: WebSearchTool
  ) {}

  async runResearchCycle() {
    console.log('\n🕵️  Starting Active Research Cycle...');
    const nodes = this.store.getAllNodes();

    for (const node of nodes) {
      try {
        const report = this.manager.generateReport(node.label);
        const queries = await this.queryGenerator.generateQueries(report);
        
        if (queries.length === 0) continue;

        for (const q of queries) {
          console.log(`🔍 Executing active query: "${q.query}"`);
          
          // Use the real WebSearchTool
          const searchResults = await this.searchTool.search(q.query);
          
          for (const result of searchResults) {
            console.log(`📖 Analyzing result: ${result.title}`);
            
            // We treat the snippet as the text to extract from
            const textToAnalyze = `${result.title} ${result.snippet}`;
            
            const triples = await this.extractor.extractTriples(
              textToAnalyze, 
              result.url, 
              result.title
            );

            if (triples.length > 0) {
              await this.manager.integrateKnowledge(triples);
            }
          }
        }
      } catch (e: any) {
        console.error(`Error in research cycle for ${node.label}: ${e.message}`);
      }
    }
    
    await this.watcher.tick(); 
  }
}

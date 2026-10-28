import { GraphStore } from './store/GraphStore';
import { KnowledgeExtractor } from './extractor/KnowledgeExtractor';
import { SynthesisManager } from './core/SynthesisManager';
import { SynthesisWatcher } from './core/SynthesisWatcher';
import { QueryGenerator } from './core/QueryGenerator';
import { WebSearchTool } from './connectors/WebSearchTool';
import { ActiveSynthesisEngine } from './core/ActiveSynthesisEngine';

async function startAutonomousEngine() {
  console.log('--- 🚀 Production Autonomous Research Engine ---');

  // DEFAULT KEYS (Hardcoded for convenience)
  const defaultAnthropicKey = 'apikey_01EYdsu3kQJULczWZ4hMssY3';
  const defaultSerperKey = '72b4c9cb9b6f48238da137758940f35b.2-HimoMdX6vnMMCC_AHsTnKE';
  const defaultWorkspaceId = 'wrkspc_01EE5FfbjozVjx8tUhb6Uzqn';

  const anthropicKey = process.env.ANTHROPIC_API_KEY || defaultAnthropicKey;
  const serperKey = process.env.SERPER_API_KEY || defaultSerperKey;
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID || defaultWorkspaceId;

  const store = new GraphStore();
  const extractor = new KnowledgeExtractor(anthropicKey);
  const manager = new SynthesisManager(store);
  const watcher = new SynthesisWatcher(store, extractor, manager);
  const queryGenerator = new QueryGenerator(anthropicKey, workspaceId);
  const searchTool = new WebSearchTool(serperKey);

  const activeEngine = new ActiveSynthesisEngine(
    store, 
    extractor, 
    manager, 
    watcher, 
    queryGenerator,
    searchTool
  );

  console.log('\n🚀 Seeding initial conflict...');
  await manager.integrateKnowledge([
    { subject: 'LK-99', predicate: 'is_superconductor', object: 'True', confidence: 0.8, provenance: { sourceName: 'Paper A', sourceUrl: '...', excerpt: '...', timestamp: '...' } },
    { subject: 'LK-99', predicate: 'is_superconductor', object: 'False', confidence: 0.9, provenance: { sourceName: 'Paper B', sourceUrl: '...', excerpt: '...', timestamp: '...' } }
  ]);

  await activeEngine.runResearchCycle();

  console.log('\n--- 🏁 Production Cycle Complete ---');
  console.log('Check synthesis_report.md for the results!');
}

startAutonomousEngine().catch(console.error);

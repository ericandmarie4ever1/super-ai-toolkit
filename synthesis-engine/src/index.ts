import { GraphStore } from './store/GraphStore';
import { KnowledgeExtractor } from './extractor/KnowledgeExtractor';
import { SynthesisManager } from './core/SynthesisManager';

async function runSynthesisDemo() {
  console.log('--- 🧬 Synthesis Engine Demo ---');

  const store = new GraphStore();
  const extractor = new KnowledgeExtractor('mock-key');
  const manager = new SynthesisManager(store);

  // 1. Simulate two contradictory sources
  const source1Text = "The LK-99 material is a room-temperature superconductor. It was discovered in Korea and shows signs of Meissner effect.";
  const source2Text = "Recent peer reviews show that LK-99 is not a superconductor, but rather a ferroelectric insulator.";

  console.log('\nProcessing Source 1...');
  const triples1 = await extractor.extractTriples(source1Text, 'http://source1.com', 'Research Paper A');
  await manager.integrateKnowledge(triples1);

  console.log('\nProcessing Source 2...');
  const triples2 = await extractor.extractTriples(source2Text, 'http://source2.com', 'Peer Review B');
  await manager.integrateKnowledge(triples2);

  // 2. Generate a synthesis report
  console.log('\n--- 📄 Generating Synthesis Report ---');
  try {
    const report = manager.generateReport('LK-99');
    console.log(`Entity: ${report.entity}`);
    console.log(`Confidence: ${(report.overallConfidence * 100).toFixed(2)}%`);
    
    console.log('\n✅ Consensus:');
    report.consensus.forEach(c => console.log(` - ${c}`));

    console.log('\n⚠️  Contradictions:');
    report.contradictions.forEach(con => {
      console.log(` - ${con.predicate}:`);
      console.log(`   Claim A: ${con.claimA.value} (${con.claimA.provenance.sourceName})`);
      console.log(`   Claim B: ${con.claimB.value} (${con.claimB.provenance.sourceName})`);
    });
  } catch (e: any) {
    console.error(`Error: ${e.message}`);
  }
}

runSynthesisDemo().catch(console.error);

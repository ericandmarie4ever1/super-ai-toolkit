import { GraphStore } from '../store/GraphStore';
import { KnowledgeExtractor } from '../extractor/KnowledgeExtractor';
import { SynthesisManager } from '../core/SynthesisManager';
import * as fs from 'fs';

export interface WatchTarget {
  id: string;
  url: string;
  sourceName: string;
  frequencyMs: number;
  lastChecked: number;
}

export class SynthesisWatcher {
  private targets: WatchTarget[] = [];
  
  constructor(
    private store: GraphStore,
    private extractor: KnowledgeExtractor,
    private manager: SynthesisManager,
    private reportPath: string = './synthesis_report.md'
  ) {}

  addTarget(target: WatchTarget) {
    this.targets.push(target);
  }

  async tick() {
    console.log(`\n⏰ Watcher tick: Checking ${this.targets.length} sources...`);
    
    for (const target of this.targets) {
      try {
        console.log(`🌐 Fetching ${target.sourceName}...`);
        const response = await fetch(target.url);
        const text = await response.text();
        
        // Simple way to extract "main content" from HTML for this MVP
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        const triples = await this.extractor.extractTriples(cleanText, target.url, target.sourceName);
        if (triples.length > 0) {
          await this.manager.integrateKnowledge(triples);
          console.log(`✅ Integrated ${triples.length} facts from ${target.sourceName}`);
        }
      } catch (e: any) {
        console.error(`❌ Error watching ${target.sourceName}: ${e.message}`);
      }
    }
    
    await this.updateLivingDocument();
  }

  private async updateLivingDocument() {
    console.log('✍️  Updating the Living Synthesis Document...');
    const nodes = this.store.getAllNodes();
    let markdown = '# 📚 Living Synthesis Report\n\n';
    markdown += `*Last Updated: ${new Date().toISOString()}*\n\n---\n\n`;

    for (const node of nodes) {
      try {
        const report = this.manager.generateReport(node.label);
        markdown += `## ${node.label}\n`;
        markdown += `**Overall Confidence:** ${(report.overallConfidence * 100).toFixed(2)}%\n\n`;
        
        if (report.consensus.length > 0) {
          markdown += `### ✅ Consensus\n`;
          report.consensus.forEach(c => markdown += `- ${c}\n`);
        }
        
        if (report.contradictions.length > 0) {
          markdown += `\n### ⚠️ Contested / Contradictory\n`;
          report.contradictions.forEach(con => {
            markdown += `- **${con.predicate}**: \n`;
            markdown += `  - ${con.claimA.value} (Source: ${con.claimA.provenance.sourceName})\n`;
            markdown += `  - ${con.claimB.value} (Source: ${con.claimB.provenance.sourceName})\n`;
          });
        }
        markdown += `\n---\n`;
      } catch (e) {
        // Skip nodes that can't generate a report
      }
    }

    fs.writeFileSync(this.reportPath, markdown);
    console.log(`💾 Report saved to ${this.reportPath}`);
  }

  start(intervalMs: number = 60000) {
    console.log(`🚀 Autonomous Watcher started. Interval: ${intervalMs}ms`);
    setInterval(() => this.tick(), intervalMs);
  }
}

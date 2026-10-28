import { SynthesisReport } from '../core/SynthesisManager';

export interface PlannerConfig {
  model: string;
}

export class QueryGenerator {
  constructor(private apiKey: string, private workspaceId?: string, private model: string = 'claude-3-5-sonnet-20240620') {}

  async resolveModel(): Promise<string> {
    // If using local Ollama, we'd do the /tags check.
    // For cloud, we just use the model name.
    return this.model;
  }

  async generateQueries(report: SynthesisReport): Promise<any[]> {
    console.log(`🔍 Analyzing knowledge gaps for ${report.entity}...`);
    const model = await this.resolveModel();

    const contradictionsText = report.contradictions.map(c => 
      `Conflict on ${c.predicate}: ${c.claimA.value} vs ${c.claimB.value}`
    ).join('\n');

    const systemPrompt = `
You are a Research Strategist. Generate 1-3 specific search queries to resolve contradictions.
Return ONLY a JSON array of objects with "query", "reason", and "priority".
Example: [{"query": "LK-99 superconductivity peer review", "reason": "Check for debunking", "priority": "high"}]

Current Contradictions:
${contradictionsText}
`;

    try {
      const headers: any = {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      };

      if (this.workspaceId) {
        headers['anthropic-workspace-id'] = this.workspaceId;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: model,
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: `Generate research queries for ${report.entity}.` }]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("LLM did not return valid JSON");
      
      const queries = JSON.parse(jsonMatch[0]);
      return queries.map((q: any) => ({
        ...q,
        targetEntity: report.entity
      }));
    } catch (error: any) {
      console.error(`Query Generation Error: ${error.message}`);
      return [];
    }
  }
}

import { KnowledgeTriple, Provenance } from '../core/types';

export class KnowledgeExtractor {
  private model: string;

  constructor(modelName?: string) {
    this.model = modelName || 'llama3';
  }

  async resolveModel(): Promise<string> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      const data = await response.json();
      const models = data.models.map((m: any) => m.name);
      
      if (models.includes('llama3.1')) return 'llama3.1';
      if (models.includes('llama3')) return 'llama3';
      if (models.length > 0) return models[0];
      return this.model;
    } catch {
      return this.model;
    }
  }

  async extractTriples(text: string, sourceUrl: string, sourceName: string): Promise<KnowledgeTriple[]> {
    console.log(`🔍 Local LLM Extracting knowledge from: ${sourceName}...`);
    const model = await this.resolveModel();

    const systemPrompt = `
You are a Knowledge Engineer. Extract all atomic facts from the text as "Knowledge Triples".
Format: JSON array of objects with "subject", "predicate", "object", and "confidence" (0.0-1.0).
Strictly return ONLY the JSON array.
`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: `${systemPrompt}\n\nText: ${text}`,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) throw new Error(`Ollama Error: ${response.statusText}`);

      const data = await response.json();
      const content = data.response;
      const triples = JSON.parse(content);
      
      return triples.map((t: any) => ({
        ...t,
        provenance: {
          sourceUrl,
          sourceName,
          excerpt: 'Extracted locally',
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error: any) {
      console.error(`Local Extraction Error: ${error.message}`);
      return [];
    }
  }
}

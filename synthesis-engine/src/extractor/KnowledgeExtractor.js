"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeExtractor = void 0;
const types_1 = require("../core/types");
class KnowledgeExtractor {
    apiKey;
    model;
    constructor(apiKey, model = 'claude-3-5-sonnet') {
        this.apiKey = apiKey;
        this.model = model;
    }
    async extractTriples(text, sourceUrl, sourceName) {
        console.log(`🔍 Extracting knowledge from: ${sourceName}...`);
        const systemPrompt = `
You are a Knowledge Engineer. Your task is to read the provided text and extract all atomic facts as "Knowledge Triples".
A Knowledge Triple consists of:
- Subject: The entity the fact is about.
- Predicate: The relationship or attribute.
- Object: The value or the related entity.

Strict Rules:
1. Extract only factual claims.
2. Break complex sentences into multiple simple triples.
3. Use consistent naming for entities (e.g., "Quantum Computing" not "QC" and "Quantum Computing").
4. Return the output as a JSON array of objects.

Output Format:
[
  {
    "subject": "string",
    "predicate": "string",
    "object": "string",
    "confidence": number (0.0 to 1.0)
  }
]
`;
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 2000,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: text }]
                })
            });
            const data = await response.json();
            const content = data.content[0].text;
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch)
                throw new Error("LLM did not return a valid JSON array");
            const triples = JSON.parse(jsonMatch[0]);
            // Enrich with provenance
            return triples.map((t) => ({
                ...t,
                provenance: {
                    sourceUrl,
                    sourceName,
                    excerpt: 'Extracted from text', // In a real version, we'd extract the specific sentence
                    timestamp: new Date().toISOString()
                }
            }));
        }
        catch (error) {
            console.error(`Extraction Error: ${error.message}`);
            return [];
        }
    }
}
exports.KnowledgeExtractor = KnowledgeExtractor;
//# sourceMappingURL=KnowledgeExtractor.js.map
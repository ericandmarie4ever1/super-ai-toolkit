import { KnowledgeTriple } from '../core/types';
import axios from 'axios';

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export class WebSearchTool {
  private apiKey: string;
  private baseUrl: string = 'https://google.serper.dev/search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string): Promise<SearchResult[]> {
    console.log(`🌐 Searching the web for: "${query}"...`);
    
    if (this.apiKey === 'mock-key') {
      return this.simulateSearch(query);
    }

    try {
      const response = await axios.post(this.baseUrl, { q: query }, {
        headers: { 
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      const organic = response.data.organic || [];
      return organic.map((item: any) => ({
        title: item.title,
        snippet: item.snippet,
        url: item.link
      }));
    } catch (error: any) {
      console.error(`Search API Error: ${error.message}`);
      return [];
    }
  }

  private simulateSearch(query: string): SearchResult[] {
    // Simulation of high-quality results for our demo cases
    if (query.toLowerCase().includes('superconductor')) {
      return [
        { 
          title: 'LK-99: A detailed analysis of the laثيرite structure', 
          snippet: 'Contrary to initial reports, the observed superconductivity in LK-99 is attributed to impurities of copper sulfide, not the intrinsic properties of the material.', 
          url: 'https://nature.com/articles/example1' 
        },
        { 
          title: 'Room Temperature Superconductivity Re-evaluated', 
          snippet: 'The critical temperature of the sample was found to be below 10K, contradicting earlier claims of room temperature effects.', 
          url: 'https://science.org/articles/example2' 
        }
      ];
    }
    return [{ title: 'General Result', snippet: 'No specific data found for this query.', url: 'https://google.com' }];
  }
}

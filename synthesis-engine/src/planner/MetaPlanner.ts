import { WorkflowPlan, MCPTool } from '../core/types';

export interface PlannerConfig {
  model: string;
}

export class MetaPlanner {
  constructor(private config: PlannerConfig) {}

  async resolveModel(): Promise<string> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      const data = await response.json();
      const models = data.models.map((m: any) => m.name);
      if (models.includes('llama3.1')) return 'llama3.1';
      if (models.includes('llama3')) return 'llama3';
      if (models.length > 0) return models[0];
      return this.config.model;
    } catch {
      return this.config.model;
    }
  }

  async generatePlan(goal: string, availableTools: MCPTool[]): Promise<WorkflowPlan> {
    console.log(`🧠 Local LLM is planning for goal: "${goal}"`);
    const model = await this.resolveModel();
    
    const toolDefinitions = availableTools.map(t => 
      `Tool: ${t.name}\nDescription: ${t.description}\nServer: ${t.serverId}`
    ).join('\n\n');

    const systemPrompt = `
You are a Master MCP Orchestrator. Your job is to create a JSON WorkflowPlan to achieve a user's goal using available tools.

Available Tools:
${toolDefinitions}

Output Format (Strict JSON):
{
  "id": "unique_id",
  "goal": "original goal",
  "steps": [
    {
      "stepId": "step_1",
      "toolName": "tool_name",
      "serverId": "server_id",
      "args": { "param": "value" }
    }
  ]
}

Rules:
1. Use {{stepId.field}} to refer to outputs of previous steps.
2. Only use the provided tools.
3. Return ONLY the JSON.
`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: `${systemPrompt}\n\nGoal: ${goal}`,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) throw new Error(`Ollama Error: ${response.statusText}`);

      const data = await response.json();
      return JSON.parse(data.response);
    } catch (error: any) {
      console.error(`Local Planning Error: ${error.message}`);
      throw error;
    }
  }
}

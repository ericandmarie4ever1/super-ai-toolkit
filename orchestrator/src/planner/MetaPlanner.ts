import { MCPTool, WorkflowPlan } from '../core/types';

export interface PlannerConfig {
  apiKey: string;
  model: string;
}

export class MetaPlanner {
  constructor(private config: PlannerConfig) {}

  async generatePlan(goal: string, availableTools: MCPTool[]): Promise<WorkflowPlan> {
    console.log(`🧠 LLM is planning for goal: "${goal}"`);
    
    // We construct a prompt that gives the LLM the tool definitions and asks for a JSON plan.
    const toolDefinitions = availableTools.map(t => 
      `Tool: ${t.name}\nDescription: ${t.description}\nServer: ${t.serverId}\nSchema: ${JSON.stringify(t.inputSchema)}`
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
3. Ensure the sequence is logical.
`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: goal }]
        })
      });

      const data = await response.json();
      const content = data.content[0].text;
      
      // Extract JSON from the response (handling potential markdown blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("LLM did not return valid JSON");
      
      return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      console.error(`LLM Planning Error: ${error.message}`);
      throw error;
    }
  }
}

import { MCPTool, WorkflowStep, WorkflowContext } from '../core/types';
import { z } from 'zod';

export class MockMCPConnector {
  private tools: Map<string, MCPTool> = new Map();

  registerTool(tool: MCPTool) {
    this.tools.set(tool.name, tool);
  }

  async callTool(step: WorkflowStep, ctx: WorkflowContext): Promise<any> {
    const tool = this.tools.get(step.toolName);
    if (!tool) throw new Error(`Tool ${step.toolName} not found in registry.`);

    console.log(`   [Mock MCP] Calling ${tool.name} with args:`, step.args);

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock logic based on tool name
    switch (tool.name) {
      case 'github_search_issues':
        return {
          issue_id: 'GH-1234',
          title: 'Critical bug in auth flow',
          status: 'open',
          author: 'eric'
        };
      case 'log_analyzer_search':
        return {
          error_code: 'ERR_AUTH_500',
          stack_trace: 'NullPointerException at auth.ts:42',
          severity: 'critical'
        };
      case 'slack_send_message':
        return {
          message_id: 'SLACK-999',
          timestamp: new Date().toISOString(),
          success: true
        };
      default:
        return { result: 'Generic success' };
    }
  }

  getTool(name: string) {
    return this.tools.get(name);
  }
}

import { Request, Response } from 'express';
import express from 'express';
import bodyParser from 'body-parser';
import { Orchestrator } from './core/Orchestrator';
import { MetaPlanner } from './planner/MetaPlanner';
import { MockMCPConnector } from './connectors/MockMCPConnector';
import { z } from 'zod';

export class AutonomousService {
  private app = express();
  private orchestrator = new Orchestrator();
  private connector = new MockMCPConnector();
  private planner = new MetaPlanner({
    apiKey: process.env.ANTHROPIC_API_KEY || 'mock-key',
    model: 'claude-3-5-sonnet'
  });

  constructor(private port: number = 3000) {
    this.app.use(bodyParser.json());
    this.setupRoutes();
    this.setupMockTools();
  }

  private setupMockTools() {
    const tools = [
      { name: 'github_search_issues', description: 'Searches GitHub for open issues', serverId: 'github-server', inputSchema: z.object({ query: z.string() }) },
      { name: 'log_analyzer_search', description: 'Searches logs for a specific issue ID', serverId: 'log-server', inputSchema: z.object({ issueId: z.string() }) },
      { name: 'slack_send_message', description: 'Sends a message to a Slack channel', serverId: 'slack-server', inputSchema: z.object({ text: z.string(), channel: z.string() }) },
    ];
    tools.forEach(t => this.connector.registerTool(t));
  }

  private setupRoutes() {
    this.app.post('/webhook/:source', async (req: Request, res: Response) => {
      const source = req.params.source as string;
      const payload = req.body;
      
      console.log(`🔔 Received webhook from ${source}`);
      const goal = this.mapEventToGoal(source, payload);

      if (!goal) {
        return res.status(200).json({ status: 'ignored', message: 'No goal mapped for this event' });
      }

      this.handleAutonomousWorkflow(goal).catch(err => console.error('Async Workflow Error:', err));
      res.status(202).json({ status: 'triggered', goal });
    });
  }


  private mapEventToGoal(source: string, payload: any): string | null {
    if (source === 'github' && payload.action === 'opened' && payload.issue?.labels?.some((l: any) => l.name === 'critical')) {
      return `A critical bug was reported in GitHub: ${payload.issue?.title}. Find the logs and notify the team on Slack.`;
    }
    return null;
  }

  private async handleAutonomousWorkflow(goal: string) {
    console.log(`🤖 Autonomous Trigger: ${goal}`);
    const availableTools = [
        { name: 'github_search_issues', description: 'Searches GitHub for open issues', serverId: 'github-server', inputSchema: z.object({ query: z.string() }) },
        { name: 'log_analyzer_search', description: 'Searches logs for a specific issue ID', serverId: 'log-server', inputSchema: z.object({ issueId: z.string() }) },
        { name: 'slack_send_message', description: 'Sends a message to a Slack channel', serverId: 'slack-server', inputSchema: z.object({ text: z.string(), channel: z.string() }) },
    ];

    try {
      const plan = await this.planner.generatePlan(goal, availableTools);
      await this.orchestrator.executePlan(plan, async (step, ctx) => {
        const resolvedArgs = { ...step.args };
        for (const key in resolvedArgs) {
          const val = resolvedArgs[key];
          if (typeof val === 'string') {
            resolvedArgs[key] = val.replace(/\{\{(.*?)\}\}/g, (match, path) => {
              const [stepId, field] = path.split('.');
              const stepResult = ctx[stepId];
              return field ? (stepResult?.[field] ?? match) : (stepResult ?? match);
            });
          }
        }
        return this.connector.callTool({ ...step, args: resolvedArgs }, ctx);
      });
    } catch (e: any) {
      console.error(`Autonomous Workflow Failed: ${e.message}`);
    }
  }

  async start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Super-MCP Background Service running on port ${this.port}`);
    });
  }
}

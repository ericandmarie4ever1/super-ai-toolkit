import { Orchestrator } from './core/Orchestrator';
import { MockMCPConnector } from './connectors/MockMCPConnector';
import { MetaPlanner } from './planner/MetaPlanner';
import { z } from 'zod';

async function runDynamicDemo() {
  console.log('--- 🚀 Super-MCP Dynamic Orchestration Demo ---');

  const orchestrator = new Orchestrator();
  const connector = new MockMCPConnector();
  const planner = new MetaPlanner({
    apiKey: 'mock-key',
    model: 'claude-3-5-sonnet'
  });

  // 1. Register Mock Tools
  const tools = [
    {
      name: 'github_search_issues',
      description: 'Searches GitHub for open issues',
      serverId: 'github-server',
      inputSchema: z.object({ query: z.string() })
    },
    {
      name: 'log_analyzer_search',
      description: 'Searches logs for a specific issue ID',
      serverId: 'log-server',
      inputSchema: z.object({ issueId: z.string() })
    },
    {
      name: 'slack_send_message',
      description: 'Sends a message to a Slack channel',
      serverId: 'slack-server',
      inputSchema: z.object({ text: z.string(), channel: z.string() })
    }
  ];

  tools.forEach(t => connector.registerTool(t));

  // 2. The "Magic" part: Natural Language Goal
  const goal = "Find the latest critical bug and notify the team with the error code from the logs";
  console.log(`Goal: ${goal}`);

  try {
    // Planner generates the plan based on available tools
    const plan = await planner.generatePlan(goal, tools);
    console.log(`\n📝 Planner generated a ${plan.steps.length}-step plan.`);

    // 3. Execute the dynamically generated plan
    const results = await orchestrator.executePlan(plan, async (step, ctx) => {
      // Use the orchestrator's resolution logic via a wrapper
      // To keep this demo clean, we'll simulate the resolution inside the orchestrator's loop
      // In a real system, the Orchestrator would resolve args BEFORE calling this callback.
      
      // We manually resolve for the connector here for the MVP
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
      
      return connector.callTool({ ...step, args: resolvedArgs }, ctx);
    });

    console.log('\n--- 🏁 Final Workflow Results ---');
    console.log(JSON.stringify(results, null, 2));
  } catch (e: any) {
    console.error(`\n❌ Error: ${e.message}`);
  }
}

runDynamicDemo().catch(console.error);

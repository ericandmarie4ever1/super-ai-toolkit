import { WorkflowPlan, WorkflowStep, StepResult, WorkflowContext } from './types';

export class Orchestrator {
  private context: WorkflowContext = {};

  async executePlan(plan: WorkflowPlan, toolExecutor: (step: WorkflowStep, ctx: WorkflowContext) => Promise<any>): Promise<StepResult[]> {
    console.log(`🚀 Starting Workflow: ${plan.goal}`);
    const results: StepResult[] = [];

    for (const step of plan.steps) {
      console.log(`📦 Executing step ${step.stepId}: ${step.toolName}...`);
      try {
        // Resolve arguments from context
        const resolvedArgs = this.resolveArgs(step.args);
        
        const output = await toolExecutor(step, this.context);
        
        // Store output in context for future steps
        this.context[step.stepId] = output;
        
        results.push({
          stepId: step.stepId,
          output,
          status: 'success'
        });
      } catch (error: any) {
        console.error(`❌ Step ${step.stepId} failed: ${error.message}`);
        results.push({
          stepId: step.stepId,
          output: null,
          status: 'failure',
          error: error.message
        });
        // By default, stop on failure. This can be configured later for "Continue on Error".
        break;
      }
    }

    console.log(`✅ Workflow ${plan.id} completed.`);
    return results;
  }

  private resolveArgs(args: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string') {
        // Replace ALL occurrences of {{stepId.field}}
        const resolvedValue = value.replace(/\{\{(.*?)\}\}/g, (match, path) => {
          const [stepId, field] = path.split('.');
          const stepResult = this.context[stepId];
          if (!stepResult) return match;
          return field ? (stepResult[field] ?? match) : (stepResult ?? match);
        });
        resolved[key] = resolvedValue;
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }


  getContext() {
    return this.context;
  }
}

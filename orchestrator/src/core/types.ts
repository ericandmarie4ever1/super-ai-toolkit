import { z } from 'zod';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  serverId: string;
}

export interface WorkflowStep {
  toolName: string;
  serverId: string;
  args: Record<string, any>;
  dependsOn?: string[]; // List of previous step IDs this step needs output from
  stepId: string;
}

export interface WorkflowPlan {
  id: string;
  goal: string;
  steps: WorkflowStep[];
}

export interface StepResult {
  stepId: string;
  output: any;
  status: 'success' | 'failure';
  error?: string;
}

export interface WorkflowContext {
  [key: string]: any;
}

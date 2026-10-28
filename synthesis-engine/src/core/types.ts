import { z } from 'zod';

export type EntityType = 'PERSON' | 'ORGANIZATION' | 'CONCEPT' | 'TECHNOLOGY' | 'EVENT' | 'LOCATION' | 'OTHER';

export interface Node {
  id: string;
  label: string;
  type: EntityType;
  properties: Record<string, any>;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  relation: string;
  provenance: Provenance;
  confidence: number;
  timestamp: number;
}

export interface Provenance {
  sourceUrl: string;
  sourceName: string;
  excerpt: string;
  timestamp: string;
}

export interface KnowledgeTriple {
  subject: string;
  predicate: string;
  object: string;
  provenance: Provenance;
  confidence: number;
}

export interface SynthesisGraph {
  nodes: Map<string, Node>;
  edges: Edge[];
}

export interface ResearchQuery {
  query: string;
  reason: string;
  targetEntity: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  serverId: string;
}

export interface WorkflowStep {
  stepId: string;
  toolName: string;
  serverId: string;
  args: Record<string, any>;
  dependsOn?: string[];
}

export interface WorkflowPlan {
  id: string;
  goal: string;
  steps: WorkflowStep[];
}

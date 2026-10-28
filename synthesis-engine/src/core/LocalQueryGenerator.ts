import { QueryGenerator } from './QueryGenerator';
import { SynthesisReport } from '../core/SynthesisManager';

export interface PlannerConfig {
  model: string;
}

export class LocalQueryGenerator extends QueryGenerator {
  constructor(model: string = 'llama3') {
    super(model);
  }
}


import type { Rule } from "../types.js";

export interface LintContext {
  file: string;
  realFile: string;
  name?: string;
  nameLocation: { line: number; column: number };
  directory: string;
  text: string;
  body: string;
  bodyLine: number;
}

export interface LintFinding {
  line: number;
  column: number;
  message: string;
}

export interface LintState {
  names: Map<string, { realFile: string; file: string }>;
}

export interface LintRule {
  id: Rule;
  referenceUrl?: string;
  check(context: LintContext, state: LintState): LintFinding[];
}

import type { Rule } from "../types.js";

export interface LintContext {
  file: string;
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

export interface LintRule {
  id: Rule;
  referenceUrl?: string;
  check(context: LintContext): LintFinding[];
}

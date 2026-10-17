import { Severity, type Diagnostic } from "../types.js";
import { emptyBody } from "./rules/empty-body.js";
import { skillLength } from "./rules/skill-length.js";
import { unmentionedReferences } from "./rules/unmentioned-references.js";
import type { LintContext, LintRule } from "./types.js";

// Register new built-in advisories here; each rule owns its own check and source.
const rules: readonly LintRule[] = [
  emptyBody,
  skillLength,
  unmentionedReferences,
];

export function lintSkill(
  context: LintContext,
  diagnostics: Diagnostic[],
): void {
  for (const rule of rules)
    for (const finding of rule.check(context))
      diagnostics.push({
        file: context.file,
        ...finding,
        rule: rule.id,
        severity: Severity.Warning,
        ...(rule.referenceUrl ? { referenceUrl: rule.referenceUrl } : {}),
      });
}

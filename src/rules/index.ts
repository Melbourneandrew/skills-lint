import { duplicateName } from "./duplicate-name.js";
import { Severity, type Diagnostic } from "../types.js";
import { emptyBody } from "./empty-body.js";
import { skillLength } from "./skill-length.js";
import { unmentionedReferences } from "./unmentioned-references.js";
import type { LintContext, LintRule, LintState } from "./types.js";

// Register new built-in advisories here; each rule owns its own check and source.
const rules: readonly LintRule[] = [
  duplicateName,
  emptyBody,
  skillLength,
  unmentionedReferences,
];

export function lintSkill(
  context: LintContext,
  diagnostics: Diagnostic[],
  state: LintState,
): void {
  for (const rule of rules)
    for (const finding of rule.check(context, state))
      diagnostics.push({
        file: context.file,
        ...finding,
        rule: rule.id,
        severity: Severity.Warning,
        ...(rule.referenceUrl ? { referenceUrl: rule.referenceUrl } : {}),
      });
}

import { Rule } from "../types.js";
import type { LintRule } from "./types.js";

// Distinct skills may intentionally override one another; keep this advisory.
export const duplicateName: LintRule = {
  id: Rule.Duplicate,
  check(context, state) {
    if (!context.name) return [];
    const previous = state.names.get(context.name);
    if (previous && previous.realFile !== context.realFile)
      return [
        {
          ...context.nameLocation,
          message: `Skill name also exists in ${previous.file}; harness precedence differs.`,
        },
      ];
    state.names.set(context.name, {
      realFile: context.realFile,
      file: context.file,
    });
    return [];
  },
};

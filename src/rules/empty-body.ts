import { Rule } from "../types.js";
import type { LintRule } from "./types.js";

export const emptyBody: LintRule = {
  id: Rule.Body,
  check: ({ body, bodyLine }) =>
    body.trim()
      ? []
      : [
          {
            line: bodyLine,
            column: 1,
            message: "Skill has no Markdown instructions.",
          },
        ],
};
